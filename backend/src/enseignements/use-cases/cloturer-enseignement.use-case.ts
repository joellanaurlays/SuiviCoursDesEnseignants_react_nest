import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloturerEnseignementDto } from '../dto/cloturer-enseignement.dto';
import { AuthContext } from '../../auth/auth-context';
import { PermissionsService } from '../permissions/permissions.service';
import { SuiviRecalculService } from '../services/suivi-recalcul.service';
import { construireSuivi, EnseignementSuiviLigne } from '../domain/construire-suivi';
import { calculerSuivi, EtatEnseignement } from '../domain/calcul-suivi';

const includeSuivi = { seances: true } as const;

/** Longueur minimale du motif, alignée sur la validation du DTO. */
const MOTIF_LONGUEUR_MIN = 5;

/**
 * Clôture anticipée d'un enseignement, réalisée directement par l'enseignant.
 *
 * L'enseignant termine lui-même son enseignement en fournissant un motif
 * obligatoire : il n'y a ni demande, ni validation, ni intervenant externe.
 *
 * L'enseignant ne peut QUE clôturer : il ne modifie ni le volume, ni les heures
 * réalisées, ni la progression. Ces valeurs restent calculées par le serveur à
 * partir des séances réelles (27/30 h reste 90 %).
 */
@Injectable()
export class CloturerEnseignementUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
    private readonly suiviRecalculService: SuiviRecalculService,
  ) {}

  async execute(enseignementId: string, dto: CloturerEnseignementDto, context?: AuthContext) {
    if (!context) {
      throw new ForbiddenException('Authentification requise pour clôturer un enseignement');
    }

    const enseignement = await this.charger(enseignementId);

    if (!this.permissionsService.canCloturer(context, enseignement)) {
      throw new ForbiddenException(
        "Seul l'enseignant affecté à cet enseignement peut le clôturer",
      );
    }

    this.verifierCoherence(enseignement);

    const motif = this.normaliserMotif(dto.motif);

    await this.prisma.enseignement.update({
      where: { id: enseignementId },
      data: {
        clotureAnticipee: true,
        motifCloture: motif,
        dateCloture: new Date(),
      },
    });

    // Resynchronise le cache dénormalisé (heures, progression, état) avec les
    // séances réelles, exactement comme après une création ou une modification
    // de séance. L'état n'est plus posé à la main : c'est la règle métier unique
    // qui le déduit du drapeau de clôture anticipée.
    await this.suiviRecalculService.recalculerEtPersister(enseignementId);

    return { suivi: construireSuivi(await this.charger(enseignementId)) };
  }

  /**
   * Garde-fou métier : pas de clôture sans motif réel. Le DTO filtre déjà les
   * corps vides via `@MinLength`, ce contrôle protège l'appel direct du use-case.
   */
  private normaliserMotif(motif: string): string {
    const valeur = motif?.trim() ?? '';
    if (valeur.length < MOTIF_LONGUEUR_MIN) {
      throw new BadRequestException(
        `Le motif de la clôture anticipée est obligatoire (${MOTIF_LONGUEUR_MIN} caractères minimum)`,
      );
    }
    return valeur;
  }

  /**
   * Garde-fous métier : pas de clôture sans séance réalisée, pas de seconde
   * clôture, et pas de clôture « anticipée » alors que le volume est atteint.
   */
  private verifierCoherence(enseignement: EnseignementSuiviLigne): void {
    if (enseignement.clotureAnticipee) {
      throw new ConflictException('Cet enseignement a déjà été clôturé de façon anticipée');
    }

    const suivi = calculerSuivi(enseignement.volumePrevu, enseignement.seances);

    if (suivi.etat === EtatEnseignement.NON_COMMENCE) {
      throw new BadRequestException(
        "Clôture anticipée impossible : aucune séance n'a encore été réalisée pour cet enseignement",
      );
    }

    if (suivi.etat === EtatEnseignement.TERMINE) {
      throw new BadRequestException(
        "Clôture anticipée sans objet : le volume horaire prévu est entièrement atteint (clôture normale)",
      );
    }
  }

  private async charger(enseignementId: string): Promise<EnseignementSuiviLigne> {
    const enseignement = await this.prisma.enseignement.findUnique({
      where: { id: enseignementId },
      include: includeSuivi,
    });
    if (!enseignement) {
      throw new NotFoundException(`Enseignement ${enseignementId} introuvable`);
    }
    return enseignement;
  }
}

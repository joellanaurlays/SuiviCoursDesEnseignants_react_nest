import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthContext } from '../../auth/auth-context';
import { PermissionsService } from '../permissions/permissions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { calculerSuivi, EtatEnseignement, TypeCloture } from '../domain/calcul-suivi';
import { construireWhereSuivi } from '../domain/filtres-suivi';
import { SuiviQueryDto } from '../dto/suivi-query.dto';

/** Agrégats de suivi calculés sur les données réelles du périmètre de l'utilisateur. */
export interface SuiviStatistiques {
  totaux: {
    enseignements: number;
    volumePrevu: number;
    heuresRealisees: number;
    heuresRestantes: number;
    /** Progression globale = heures réalisées / volume prévu (plafonnée à 100). */
    progression: number;
  };
  etats: {
    nonCommences: number;
    enCours: number;
    termines: number;
  };
  clotures: {
    /** Enseignements terminés parce que le volume prévu est atteint. */
    terminesParVolumeAtteint: number;
    /** Enseignements terminés par l'enseignant avant le volume prévu. */
    terminesParClotureAnticipee: number;
  };
}

function emptyStats(): SuiviStatistiques {
  return {
    totaux: { enseignements: 0, volumePrevu: 0, heuresRealisees: 0, heuresRestantes: 0, progression: 0 },
    etats: { nonCommences: 0, enCours: 0, termines: 0 },
    clotures: { terminesParVolumeAtteint: 0, terminesParClotureAnticipee: 0 },
  };
}

/**
 * Statistiques de suivi du périmètre de l'utilisateur (route GET /suivi/statistiques).
 *
 * Un seul calcul pour tous les rôles : le périmètre est dérivé du rôle
 * d'authentification, jamais d'un paramètre envoyé par le frontend.
 *
 * Les filtres du tableau de bord sont acceptés et combinés en AND avec le
 * périmètre : les agrégats correspondent donc toujours aux lignes affichées,
 * sans jamais pouvoir élargir l'accès. Le constructeur de filtres est partagé
 * avec la liste (`construireWhereSuivi`) pour interdire toute divergence.
 */
@Injectable()
export class GetSuiviStatistiquesUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async execute(context?: AuthContext, filters?: SuiviQueryDto): Promise<SuiviStatistiques> {
    if (!context) {
      throw new ForbiddenException('Authentification requise');
    }

    const scope = this.permissionsService.buildEnseignementScope(context);
    const where = construireWhereSuivi(filters);
    const enseignements = await this.prisma.enseignement.findMany({
      where: { AND: [scope, where] },
      select: {
        id: true,
        volumePrevu: true,
        clotureAnticipee: true,
        seances: { select: { duree: true, statut: true } },
      },
    });

    const stats = emptyStats();

    for (const enseignement of enseignements) {
      const suivi = calculerSuivi(
        enseignement.volumePrevu,
        enseignement.seances,
        enseignement.clotureAnticipee,
      );

      stats.totaux.enseignements += 1;
      stats.totaux.volumePrevu += enseignement.volumePrevu;
      stats.totaux.heuresRealisees += suivi.heuresRealisees;
      stats.totaux.heuresRestantes += suivi.heuresRestantes;

      if (suivi.etat === EtatEnseignement.NON_COMMENCE) {
        stats.etats.nonCommences += 1;
      } else if (suivi.etat === EtatEnseignement.EN_COURS) {
        stats.etats.enCours += 1;
      } else {
        stats.etats.termines += 1;
        if (suivi.typeCloture === TypeCloture.ANTICIPEE) {
          stats.clotures.terminesParClotureAnticipee += 1;
        } else {
          stats.clotures.terminesParVolumeAtteint += 1;
        }
      }
    }

    if (stats.totaux.volumePrevu > 0) {
      stats.totaux.progression = Math.min(
        Math.round((stats.totaux.heuresRealisees / stats.totaux.volumePrevu) * 10000) / 100,
        100,
      );
    }

    return stats;
  }
}

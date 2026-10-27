import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { EtatEnseignement } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthContext } from '../../auth/auth-context.js';
import { CreateEnseignementDto } from '../dto/create-enseignement.dto.js';
import { PermissionsService } from '../permissions/permissions.service.js';
import { ReferentielEnseignementService } from '../services/referentiel-enseignement.service.js';
import { validerCoherenceAcademique } from '../domain/referentiel-enseignement.js';
import { construireSuivi, SuiviEnseignement } from '../domain/construire-suivi.js';

@Injectable()
export class CreateEnseignementUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
    private readonly referentielService: ReferentielEnseignementService,
  ) {}

  async execute(
    createDto: CreateEnseignementDto,
    context?: AuthContext,
  ): Promise<SuiviEnseignement> {
    if (!context) {
      throw new ForbiddenException('Authentification requise');
    }
    if (!this.permissionsService.canCreateEnseignement(context, createDto)) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à créer cet enseignement dans votre périmètre",
      );
    }

    const incoherence = validerCoherenceAcademique(createDto);
    if (incoherence) {
      throw new BadRequestException(incoherence);
    }

    await this.referentielService.verifierReferences(createDto);

    const doublon = await this.prisma.enseignement.findFirst({
      where: {
        matiereId: createDto.matiereId,
        enseignantId: createDto.enseignantId,
        mentionId: createDto.mentionId,
        cycle: createDto.cycle,
        niveauId: createDto.niveauId,
        parcours: createDto.parcours,
        semestreId: createDto.semestreId,
        anneeUniversitaireId: createDto.anneeUniversitaireId,
      },
      select: { id: true },
    });
    if (doublon) {
      throw new ConflictException(
        'Un enseignement identique existe déjà pour cette matière, cet enseignant et cette période.',
      );
    }

    const enseignement = await this.prisma.enseignement.create({
      data: {
        matiereId: createDto.matiereId,
        enseignantId: createDto.enseignantId,
        mentionId: createDto.mentionId,
        cycle: createDto.cycle,
        niveauId: createDto.niveauId,
        parcours: createDto.parcours,
        semestreId: createDto.semestreId,
        anneeUniversitaireId: createDto.anneeUniversitaireId,
        volumePrevu: createDto.volumePrevu,
        heuresRealisees: 0,
        progression: 0,
        etat: EtatEnseignement.NON_COMMENCE,
        clotureAnticipee: false,
        motifCloture: null,
        dateCloture: null,
      },
      include: { seances: true },
    });

    return construireSuivi(enseignement);
  }
}

import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateEnseignementDto } from '../dto/create-enseignement.dto.js';
import { UpdateEnseignementDto } from '../dto/update-enseignement.dto.js';
import { CreateSeanceDto } from '../dto/create-seance.dto.js';
import { UpdateSeanceDto } from '../dto/update-seance.dto.js';
import { SuiviQueryDto } from '../dto/suivi-query.dto.js';
import { CreateEnseignementUseCase } from '../use-cases/create-enseignement.use-case.js';
import { CreateSeanceUseCase } from '../use-cases/create-seance.use-case.js';
import { GetSuiviUseCase } from '../use-cases/get-suivi.use-case.js';
import {
  UpdateSeanceStatusUseCase,
  RealisationSeanceOptions,
} from '../use-cases/update-seance-status.use-case.js';
import { GetTeacherDashboardUseCase } from '../use-cases/get-teacher-dashboard.use-case.js';
import { SuiviRecalculService } from './suivi-recalcul.service.js';
import { AuditSeanceService, FiltresJournalAudit } from './audit-seance.service.js';
import { calculerDureeSeance, StatutSeance } from '../domain/calcul-suivi.js';
import { ActionAuditSeance, champsModifies, instantaneSeance } from '../domain/audit-seance.js';
import { construireSuivi } from '../domain/construire-suivi.js';
import { AuthContext } from '../../auth/auth-context.js';
import { PermissionsService } from '../permissions/permissions.service.js';

const includeSuivi = { seances: true } as const;

@Injectable()
export class EnseignementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly createSeanceUseCase: CreateSeanceUseCase,
    private readonly getSuiviUseCase: GetSuiviUseCase,
    private readonly updateSeanceStatusUseCase: UpdateSeanceStatusUseCase,
    private readonly suiviRecalculService: SuiviRecalculService,
    private readonly getTeacherDashboardUseCase: GetTeacherDashboardUseCase,
    private readonly permissionsService: PermissionsService,
    private readonly auditSeanceService: AuditSeanceService,
    private readonly createEnseignementUseCase: CreateEnseignementUseCase,
  ) {}

  // ---------------------------------------------------------------- Enseignements

  async create(createDto: CreateEnseignementDto, context?: AuthContext) {
    return this.createEnseignementUseCase.execute(createDto, context);
  }

  async findAll(context?: AuthContext) {
    const scope = context ? this.permissionsService.buildEnseignementScope(context) : {};
    const enseignements = await this.prisma.enseignement.findMany({
      where: scope,
      include: includeSuivi,
      orderBy: [{ anneeUniversitaireId: 'asc' }, { matiereId: 'asc' }],
    });
    return enseignements.map((ens) => construireSuivi(ens));
  }

  async findOne(id: string, context?: AuthContext) {
    const enseignement = await this.prisma.enseignement.findUnique({
      where: { id },
      include: includeSuivi,
    });
    if (!enseignement) {
      throw new NotFoundException(`Enseignement ${id} not found`);
    }
    if (context && !this.permissionsService.canAccessEnseignement(context, enseignement)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à consulter cet enseignement");
    }
    return construireSuivi(enseignement);
  }

  async update(id: string, updateDto: UpdateEnseignementDto, context?: AuthContext) {
    const existing = await this.prisma.enseignement.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Enseignement ${id} not found`);
    }
    if (context && !this.permissionsService.canManageEnseignement(context, existing)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à modifier cet enseignement");
    }

    const updated = await this.prisma.enseignement.update({
      where: { id },
      data: updateDto,
      include: includeSuivi,
    });

    await this.suiviRecalculService.recalculerEtPersister(id);
    return construireSuivi(updated);
  }

  async remove(id: string, context?: AuthContext) {
    const existing = await this.prisma.enseignement.findUnique({
      where: { id },
      include: { seances: true },
    });
    if (!existing) {
      throw new NotFoundException(`Enseignement ${id} not found`);
    }
    if (context && !this.permissionsService.canManageEnseignement(context, existing)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à supprimer cet enseignement");
    }

    const perimetre = {
      enseignantId: existing.enseignantId,
      mentionId: existing.mentionId,
      cycle: existing.cycle,
      parcours: existing.parcours,
    };

    await this.prisma.$transaction(async (tx) => {
      // La suppression d'un enseignement supprime ses séances : on conserve une
      // trace d'audit de chacune AVANT la suppression, y compris les séances
      // réalisées (le journal n'a pas de clé étrangère vers la séance).
      for (const seance of existing.seances) {
        await this.auditSeanceService.enregistrer(
          {
            seanceId: seance.id,
            enseignementId: id,
            action: ActionAuditSeance.SUPPRESSION,
            motif: "Suppression de l'enseignement",
            statutAvant: seance.statut,
            statutApres: null,
            valeursAvant: instantaneSeance(seance),
            perimetre,
          },
          context,
          tx,
        );
      }

      await tx.seance.deleteMany({ where: { enseignementId: id } });
      await tx.enseignement.delete({ where: { id } });
    });
    return { deleted: true };
  }

  // ---------------------------------------------------------------- Séances

  async createSeance(enseignementId: string, createDto: CreateSeanceDto, context?: AuthContext) {
    const enseignement = await this.prisma.enseignement.findUnique({ where: { id: enseignementId } });
    if (!enseignement) {
      throw new NotFoundException(`Enseignement ${enseignementId} not found`);
    }
    return this.createSeanceUseCase.execute({ ...createDto, enseignementId }, context);
  }

  async getSeances(enseignementId: string, context?: AuthContext) {
    const enseignement = await this.prisma.enseignement.findUnique({ where: { id: enseignementId } });
    if (!enseignement) {
      throw new NotFoundException(`Enseignement ${enseignementId} not found`);
    }
    if (context && !this.permissionsService.canAccessEnseignement(context, enseignement)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à consulter ces séances");
    }

    return this.prisma.seance.findMany({
      where: { enseignementId },
      orderBy: [{ dateSeance: 'asc' }, { heureDebut: 'asc' }],
    });
  }

  async getAllSeances(context?: AuthContext) {
    const scope = context
      ? { enseignement: this.permissionsService.buildEnseignementScope(context) }
      : {};
    return this.prisma.seance.findMany({
      where: scope,
      include: { enseignement: true },
      orderBy: { dateSeance: 'desc' },
    });
  }

  async getSeanceById(id: string, context?: AuthContext) {
    const seance = await this.prisma.seance.findUnique({
      where: { id },
      include: { enseignement: true },
    });
    if (!seance) {
      throw new NotFoundException(`Seance ${id} not found`);
    }
    if (context && !this.permissionsService.canAccessSeance(context, seance)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à consulter cette séance");
    }

    // Les actions de réalisation/annulation sont réservées à l'enseignant
    // responsable, et uniquement tant que la séance est encore planifiée.
    // La correction est réservée au même enseignant, sur une séance réalisée.
    const estResponsable = this.permissionsService.canRealiserOuAnnulerSeance(context, seance);
    const estPlanifiee = seance.statut === StatutSeance.PLANIFIEE;
    const estRealisee = seance.statut === StatutSeance.REALISEE;

    return {
      ...seance,
      peutRealiser: estResponsable && estPlanifiee,
      peutAnnuler: estResponsable && estPlanifiee,
      peutCorriger: estResponsable && estRealisee,
    };
  }

  /** Historique d'audit d'une séance (consultation soumise aux permissions). */
  async getHistoriqueSeance(seanceId: string, context?: AuthContext) {
    return this.auditSeanceService.listerParSeance(seanceId, context);
  }

  async realiserSeance(
    seanceId: string,
    options: RealisationSeanceOptions,
    context?: AuthContext,
  ) {
    return this.updateSeanceStatusUseCase.execute(seanceId, StatutSeance.REALISEE, context, options);
  }

  async annulerSeance(seanceId: string, motif: string | undefined, context?: AuthContext) {
    return this.updateSeanceStatusUseCase.execute(seanceId, StatutSeance.ANNULEE, context, {
      motif,
    });
  }

  async updateSeance(
    seanceId: string,
    enseignementId: string | undefined,
    updateDto: UpdateSeanceDto,
    context?: AuthContext,
  ) {
    if (updateDto.enseignementId) {
      throw new BadRequestException(
        'Impossible de réaffecter une séance à un autre enseignement',
      );
    }

    const seance = await this.prisma.seance.findUnique({
      where: { id: seanceId },
      include: {
        enseignement: {
          select: { id: true, enseignantId: true, mentionId: true, cycle: true, parcours: true },
        },
      },
    });
    if (!seance) {
      throw new NotFoundException(`Seance ${seanceId} not found`);
    }
    if (enseignementId !== undefined && seance.enseignementId !== enseignementId) {
      throw new NotFoundException(`Seance ${seanceId} not found for this enseignement`);
    }
    const { statut, motif, ...autresChamps } = updateDto;

    // Tout changement de statut passe par le use-case dédié : permissions
    // strictes (enseignant responsable), règles de transition et recalcul
    // atomique des heures.
    if (statut !== undefined) {
      return this.updateSeanceStatusUseCase.execute(seanceId, statut, context, {
        dateSeance: autresChamps.dateSeance,
        heureDebut: autresChamps.heureDebut,
        heureFin: autresChamps.heureFin,
        contenuEnseigne: autresChamps.contenuEnseigne,
        salle: autresChamps.salle,
        typeSeance: autresChamps.typeSeance,
        motif,
      });
    }

    if (context && !this.permissionsService.canManageSeance(context, seance)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à modifier cette séance");
    }

    const data: Record<string, unknown> = { ...autresChamps };
    delete data.duree; // durée toujours recalculée par le serveur

    if (data.heureDebut !== undefined || data.heureFin !== undefined) {
      const heureDebut = (data.heureDebut as string | undefined) ?? seance.heureDebut;
      const heureFin = (data.heureFin as string | undefined) ?? seance.heureFin;
      try {
        data.duree = calculerDureeSeance(heureDebut, heureFin);
      } catch (error) {
        throw new BadRequestException(error instanceof Error ? error.message : 'Horaire invalide');
      }
    }

    // Une modification portant sur une séance DÉJÀ RÉALISÉE est une correction
    // exceptionnelle : elle est tracée comme telle. Les valeurs avant/après
    // sont conservées pour comprendre ce qui a changé.
    const action =
      seance.statut === StatutSeance.REALISEE
        ? ActionAuditSeance.CORRECTION
        : ActionAuditSeance.MODIFICATION;

    const avant = instantaneSeance(seance);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.seance.update({
        where: { id: seanceId },
        data: data as Prisma.SeanceUpdateInput,
      });

      await this.suiviRecalculService.recalculerEtPersister(seance.enseignementId, tx);

      // Seuls les champs réellement modifiés sont conservés, pour un audit
      // lisible de type « avant → après ».
      const diff = champsModifies(avant, instantaneSeance(updated));

      await this.auditSeanceService.enregistrer(
        {
          seanceId: updated.id,
          enseignementId: updated.enseignementId,
          action,
          motif: motif?.trim() || null,
          statutAvant: seance.statut,
          statutApres: updated.statut,
          valeursAvant: diff.avant,
          valeursApres: diff.apres,
          perimetre: {
            enseignantId: seance.enseignement.enseignantId,
            mentionId: seance.enseignement.mentionId,
            cycle: seance.enseignement.cycle,
            parcours: seance.enseignement.parcours,
          },
        },
        context,
        tx,
      );

      return updated;
    });
  }

  async removeSeance(
    seanceId: string,
    enseignementId: string | undefined,
    context?: AuthContext,
    motif?: string,
  ) {
    const seance = await this.prisma.seance.findUnique({
      where: { id: seanceId },
      include: {
        enseignement: {
          select: { id: true, enseignantId: true, mentionId: true, cycle: true, parcours: true },
        },
      },
    });
    if (!seance) {
      throw new NotFoundException(`Seance ${seanceId} not found`);
    }
    if (enseignementId !== undefined && seance.enseignementId !== enseignementId) {
      throw new NotFoundException(`Seance ${seanceId} not found for this enseignement`);
    }
    if (context && !this.permissionsService.canManageSeance(context, seance)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à supprimer cette séance");
    }

    // Protection de l'historique : une séance réalisée n'est jamais supprimée
    // définitivement. Elle doit être corrigée (CORRECTION) ou conservée.
    if (seance.statut === StatutSeance.REALISEE) {
      throw new ConflictException(
        'Une séance réalisée ne peut pas être supprimée : corrigez-la pour préserver l’historique',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // La trace est écrite AVANT la suppression (et sans clé étrangère vers la
      // séance) : elle survit donc à la suppression de l'enregistrement.
      await this.auditSeanceService.enregistrer(
        {
          seanceId: seance.id,
          enseignementId: seance.enseignementId,
          action: ActionAuditSeance.SUPPRESSION,
          motif: motif?.trim() || null,
          statutAvant: seance.statut,
          statutApres: null,
          valeursAvant: instantaneSeance(seance),
          perimetre: {
            enseignantId: seance.enseignement.enseignantId,
            mentionId: seance.enseignement.mentionId,
            cycle: seance.enseignement.cycle,
            parcours: seance.enseignement.parcours,
          },
        },
        context,
        tx,
      );

      await tx.seance.delete({ where: { id: seanceId } });
      await this.suiviRecalculService.recalculerEtPersister(seance.enseignementId, tx);
    });

    return { deleted: true };
  }

  /** Historique d'audit global, borné au périmètre de l'utilisateur. */
  async getJournalAudit(filtres: FiltresJournalAudit = {}, context?: AuthContext) {
    return this.auditSeanceService.lister(context, filtres);
  }

  // ---------------------------------------------------------------- Suivi

  async getSuivi(filters?: SuiviQueryDto, context?: AuthContext) {
    return this.getSuiviUseCase.execute(filters, context);
  }

  async getSuiviById(id: string, context?: AuthContext) {
    const suivi = await this.getSuiviUseCase.getById(id, context);
    if (!suivi) {
      throw new NotFoundException(`Enseignement ${id} not found`);
    }
    return suivi;
  }

  async getDashboard(enseignantId: string, context?: AuthContext) {
    return this.getTeacherDashboardUseCase.execute(enseignantId, context);
  }
}
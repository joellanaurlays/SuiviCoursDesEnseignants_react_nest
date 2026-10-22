import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthContext } from '../../auth/auth-context.js';
import { PermissionsService } from '../permissions/permissions.service.js';
import {
  ActionAuditSeance,
  PerimetreAudit,
  ValeursSeanceAudit,
} from '../domain/audit-seance.js';

/** Entrée d'audit à enregistrer (l'auteur provient toujours du contexte d'auth). */
export interface EntreeAudit {
  seanceId: string;
  enseignementId: string;
  action: ActionAuditSeance;
  motif?: string | null;
  statutAvant?: string | null;
  statutApres?: string | null;
  valeursAvant?: ValeursSeanceAudit | null;
  valeursApres?: ValeursSeanceAudit | null;
  perimetre: PerimetreAudit;
}

export interface FiltresJournalAudit {
  seanceId?: string;
  enseignementId?: string;
  limit?: number;
}

const LIMITE_DEFAUT = 200;

/**
 * Journal d'audit des séances.
 *
 * - L'écriture est TOUJOURS effectuée dans la transaction de l'action métier :
 *   une opération réussie ne peut pas exister sans sa trace, et inversement.
 * - L'auteur (`utilisateurId`) provient EXCLUSIVEMENT du contexte
 *   d'authentification, jamais d'un champ fourni par le client.
 * - Le journal est en lecture seule : aucun endpoint ne l'expose en écriture,
 *   il ne peut donc pas être modifié ni supprimé par les utilisateurs.
 * - La consultation respecte les permissions existantes du module Suivi.
 */
@Injectable()
export class AuditSeanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async enregistrer(
    entree: EntreeAudit,
    context: AuthContext | undefined,
    client: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    if (!context) {
      throw new ForbiddenException("Authentification requise pour journaliser l'action");
    }

    await client.journalAuditSeance.create({
      data: {
        seanceId: entree.seanceId,
        enseignementId: entree.enseignementId,
        utilisateurId: context.userId,
        action: entree.action as unknown as Prisma.JournalAuditSeanceCreateInput['action'],
        motif: entree.motif ?? null,
        statutAvant: (entree.statutAvant ?? null) as Prisma.SeanceCreateInput['statut'] | null,
        statutApres: (entree.statutApres ?? null) as Prisma.SeanceCreateInput['statut'] | null,
        valeursAvant: (entree.valeursAvant ?? undefined) as Prisma.InputJsonValue | undefined,
        valeursApres: (entree.valeursApres ?? undefined) as Prisma.InputJsonValue | undefined,
        enseignantId: entree.perimetre.enseignantId,
        mentionId: entree.perimetre.mentionId,
        cycle: entree.perimetre.cycle as Prisma.JournalAuditSeanceCreateInput['cycle'],
        parcours: entree.perimetre.parcours,
      },
    });
  }

  /**
   * Historique d'une séance. Reste consultable même après suppression de la
   * séance grâce au périmètre figé dans le journal.
   */
  async listerParSeance(seanceId: string, context?: AuthContext) {
    const seance = await this.prisma.seance.findUnique({
      where: { id: seanceId },
      include: {
        enseignement: {
          select: { id: true, enseignantId: true, mentionId: true, cycle: true, parcours: true },
        },
      },
    });

    let perimetre: PerimetreAudit | null = null;
    if (seance) {
      perimetre = {
        enseignantId: seance.enseignement.enseignantId,
        mentionId: seance.enseignement.mentionId,
        cycle: seance.enseignement.cycle,
        parcours: seance.enseignement.parcours,
      };
    } else {
      perimetre = await this.perimetreDepuisJournal(seanceId);
      if (!perimetre) {
        return [];
      }
    }

    this.assertPeutConsulter(context, perimetre);

    return this.prisma.journalAuditSeance.findMany({
      where: { seanceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Journal global, borné au périmètre de l'utilisateur :
   * - ENSEIGNANT          : uniquement les séances dont il est responsable ;
   * - RESPONSABLE_MENTION : uniquement son couple (parcours, cycle) ;
   * - SCOLARITÉ / ADMIN   : accès global.
   */
  async lister(context?: AuthContext, filtres: FiltresJournalAudit = {}) {
    if (!context) {
      throw new ForbiddenException("Authentification requise pour consulter le journal d'audit");
    }

    const where: Prisma.JournalAuditSeanceWhereInput = {
      ...this.scopeAudit(context),
      ...(filtres.seanceId ? { seanceId: filtres.seanceId } : {}),
      ...(filtres.enseignementId ? { enseignementId: filtres.enseignementId } : {}),
    };

    return this.prisma.journalAuditSeance.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filtres.limit && filtres.limit > 0 ? filtres.limit : LIMITE_DEFAUT,
    });
  }

  private scopeAudit(context: AuthContext): Prisma.JournalAuditSeanceWhereInput {
    switch (context.role) {
      case 'ENSEIGNANT':
        return { enseignantId: context.userId };
      case 'RESPONSABLE_MENTION':
        if (!context.parcours) {
          return { id: '__aucun__' };
        }
        return context.cycles && context.cycles.length > 0
          ? { parcours: context.parcours, cycle: { in: context.cycles as never } }
          : { parcours: context.parcours };
      default:
        return {};
    }
  }

  private async perimetreDepuisJournal(seanceId: string): Promise<PerimetreAudit | null> {
    const derniere = await this.prisma.journalAuditSeance.findFirst({
      where: { seanceId },
      orderBy: { createdAt: 'desc' },
      select: { enseignantId: true, mentionId: true, cycle: true, parcours: true },
    });
    if (!derniere) {
      return null;
    }
    return {
      enseignantId: derniere.enseignantId,
      mentionId: derniere.mentionId,
      cycle: derniere.cycle,
      parcours: derniere.parcours,
    };
  }

  private assertPeutConsulter(context: AuthContext | undefined, perimetre: PerimetreAudit): void {
    if (!context) {
      throw new ForbiddenException("Authentification requise pour consulter l'historique");
    }
    if (!this.permissionsService.canAccessEnseignement(context, perimetre)) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à consulter cet historique");
    }
  }
}

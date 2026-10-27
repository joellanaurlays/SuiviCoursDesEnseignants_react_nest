import { Injectable } from '@nestjs/common';
import { Cycle, Prisma } from '@prisma/client';
import { AuthContext } from '../../auth/auth-context.js';
import { Role } from '../../auth/roles.enum.js';

interface EnseignementScope {
  enseignantId: string;
  mentionId: string;
  cycle: string;
  parcours: string;
}

/**
 * Règles d'accès par rôle / périmètre, appliquées côté backend.
 * - ENSEIGNANT          : uniquement ses propres enseignements.
 * - RESPONSABLE_MENTION : responsable de parcours, uniquement son couple
 *                         (cycle, parcours) — ex. Licence Informatique. Le
 *                         parcours seul ne suffit pas : « Informatique »
 *                         existe en Licence et en Master.
 * - SCOLARITE / ADMIN   : accès global au module.
 *
 * Le périmètre provient EXCLUSIVEMENT du contexte d'authentification (headers
 * d'identité), jamais d'un paramètre de requête, d'URL ou de corps de requête :
 * un responsable ne peut donc pas élargir son périmètre en modifiant ses
 * filtres (ceux-ci sont combinés en AND avec le périmètre).
 *
 * Clôture anticipée : action propre à l'enseignant affecté, avec motif
 * obligatoire. Le responsable de parcours, la scolarité et l'administrateur
 * conservent uniquement la consultation du suivi (état, clôture, motif).
 */
@Injectable()
export class PermissionsService {
  buildEnseignementScope(context?: AuthContext): Prisma.EnseignementWhereInput {
    if (!context) {
      return {};
    }
    switch (context.role) {
      case Role.ENSEIGNANT:
        return { enseignantId: context.userId };
      case Role.RESPONSABLE_MENTION:
        // Un responsable sans parcours n'a AUCUN périmètre : on ne retombe
        // jamais sur un accès global ou un accès par mention.
        if (!context.parcours) {
          return { id: '__aucun__' };
        }
        if (context.cycles && context.cycles.length > 0) {
          return {
            parcours: context.parcours,
            cycle: { in: context.cycles as Cycle[] },
          };
        }
        return { parcours: context.parcours };
      default:
        return {};
    }
  }

  canAccessEnseignement(context: AuthContext, enseignement: EnseignementScope): boolean {
    switch (context.role) {
      case Role.ENSEIGNANT:
        return enseignement.enseignantId === context.userId;
      case Role.RESPONSABLE_MENTION:
        if (!context.parcours || enseignement.parcours !== context.parcours) {
          return false;
        }
        if (context.cycles && context.cycles.length > 0) {
          return context.cycles.includes(enseignement.cycle);
        }
        return true;
      default:
        return true;
    }
  }

  canCreateEnseignement(context: AuthContext, enseignement: EnseignementScope): boolean {
    switch (context.role) {
      case Role.RESPONSABLE_MENTION:
        if (!context.parcours || enseignement.parcours !== context.parcours) {
          return false;
        }
        if (enseignement.mentionId !== context.parcours) {
          return false;
        }
        if (!context.cycles || context.cycles.length === 0) {
          return false;
        }
        return context.cycles.includes(enseignement.cycle);
      case Role.SCOLARITE:
      case Role.ADMINISTRATEUR:
        return true;
      default:
        return false;
    }
  }

  canManageEnseignement(context: AuthContext, enseignement: EnseignementScope): boolean {
    switch (context.role) {
      case Role.ENSEIGNANT:
        return enseignement.enseignantId === context.userId;
      case Role.SCOLARITE:
      case Role.ADMINISTRATEUR:
        return true;
      default:
        return false;
    }
  }

  canAccessSeance(
    context: AuthContext,
    seance: { enseignement: EnseignementScope },
  ): boolean {
    return this.canAccessEnseignement(context, seance.enseignement);
  }

  canManageSeance(
    context: AuthContext,
    seance: { enseignement: EnseignementScope },
  ): boolean {
    return this.canManageEnseignement(context, seance.enseignement);
  }

  /**
   * Réalisation / annulation d'une séance : action métier réservée à
   * l'enseignant responsable de la séance. Posséder le rôle ENSEIGNANT ne
   * suffit pas : il faut être affecté à l'enseignement de la séance.
   *
   * Les autres rôles (responsable de parcours, scolarité, administrateur)
   * conservent uniquement la consultation des détails.
   */
  canRealiserOuAnnulerSeance(
    context: AuthContext | undefined,
    seance: { enseignement: EnseignementScope },
  ): boolean {
    if (!context) {
      return false;
    }
    return (
      context.role === Role.ENSEIGNANT &&
      seance.enseignement.enseignantId === context.userId
    );
  }

  // ------------------------------------------------------------------ Clôture anticipée

  /**
   * Clôture anticipée d'un enseignement : l'enseignant affected termine
   * lui-même son enseignement avec un motif obligatoire.
   *
   * Il n'y a ni demande, ni validation, ni décideur : aucun autre rôle
   * (responsable de mention, scolarité, administrateur) ne peut clôturer à la
   * place de l'enseignant, même s'il consulte l'enseignement.
   */
  canCloturer(context: AuthContext, enseignement: EnseignementScope): boolean {
    return context.role === Role.ENSEIGNANT && enseignement.enseignantId === context.userId;
  }
}

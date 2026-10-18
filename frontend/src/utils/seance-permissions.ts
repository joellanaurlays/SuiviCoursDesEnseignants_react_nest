import { Seance, UserSession } from '../types/enseignement';

/**
 * L'utilisateur courant est-il l'enseignant responsable de la séance ?
 * Avoir le rôle ENSEIGNANT ne suffit pas : il faut être affecté à
 * l'enseignement de la séance.
 */
export function estEnseignantResponsable(
  seance: Pick<Seance, 'enseignement'>,
  session: Pick<UserSession, 'role' | 'userId'>,
): boolean {
  return (
    session.role === 'ENSEIGNANT' &&
    seance.enseignement?.enseignantId === session.userId
  );
}

/** Réalisation possible : séance planifiée et utilisateur responsable. */
export function peutRealiserSeance(
  seance: Pick<Seance, 'statut' | 'enseignement'>,
  session: Pick<UserSession, 'role' | 'userId'>,
): boolean {
  return seance.statut === 'PLANIFIEE' && estEnseignantResponsable(seance, session);
}

/** Annulation possible : séance planifiée et utilisateur responsable. */
export function peutAnnulerSeance(
  seance: Pick<Seance, 'statut' | 'enseignement'>,
  session: Pick<UserSession, 'role' | 'userId'>,
): boolean {
  return seance.statut === 'PLANIFIEE' && estEnseignantResponsable(seance, session);
}

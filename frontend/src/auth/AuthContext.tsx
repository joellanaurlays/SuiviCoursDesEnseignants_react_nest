import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useAuth as useJwtAuth } from '../context/AuthContext.jsx';
import { getAuthHeaders } from '../services/auth.service';
import { Cycle, Parcours, UserRole, UserSession } from '../types/enseignement';

/**
 * Pont d'identité entre la session JWT réelle (Membre 1) et le contrat
 * d'identité du module suivi des enseignements (Membres 2/4) : ce module
 * authentifie encore par en-têtes x-user-* et identifie un enseignant par son
 * nom affiché (Enseignement.enseignantId). La session n'est plus un profil
 * factice choisi dans un switcher : elle est DÉRIVÉE du compte connecté
 * (rôle mappé comme côté backend, périmètre responsable porté par les champs
 * du compte). Toutes les pages qui consomment ce contexte sont sous
 * <ProtectedRoute> : `user` y est toujours non null au rendu.
 */
interface AuthContextValue {
  session: UserSession;
  headers: Record<string, string>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type RoleName =
  | 'CHEF_SCOLARITE'
  | 'ADMINISTRATEUR'
  | 'RESPONSABLE_LICENCE'
  | 'RESPONSABLE_MASTER'
  | 'ENSEIGNANT';

interface JwtUser {
  id: string | number;
  firstName: string;
  lastName: string;
  role: RoleName;
  mentionId?: string | null;
  cycles?: string[] | null;
  parcours?: string | null;
}

const NO_SESSION: UserSession = { userId: '', role: 'ENSEIGNANT' };

function toBackendRole(role: RoleName): UserRole {
  switch (role) {
    case 'CHEF_SCOLARITE':
      return 'SCOLARITE';
    case 'RESPONSABLE_LICENCE':
    case 'RESPONSABLE_MASTER':
      return 'RESPONSABLE_MENTION';
    case 'ADMINISTRATEUR':
      return 'ADMINISTRATEUR';
    default:
      return 'ENSEIGNANT';
  }
}

function sessionFromUser(user: JwtUser): UserSession {
  const role = toBackendRole(user.role);
  const cycles = (user.cycles ?? [])
    .map((c) => String(c).toUpperCase())
    .filter((c): c is Cycle => c === 'LICENCE' || c === 'MASTER');
  if (role === 'RESPONSABLE_MENTION' && cycles.length === 0) {
    cycles.push(user.role === 'RESPONSABLE_MASTER' ? 'MASTER' : 'LICENCE');
  }
  return {
    userId: `${user.firstName} ${user.lastName}`.trim(),
    role,
    mentionId: user.mentionId ?? undefined,
    cycles,
    parcours: (user.parcours as Parcours | null) ?? undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user } = useJwtAuth() as { user: JwtUser | null };

  const session = useMemo(() => (user ? sessionFromUser(user) : NO_SESSION), [user]);
  const headers = useMemo(
    () => (user ? getAuthHeaders(session) : {}),
    [user, session],
  );

  const value = useMemo(() => ({ session, headers }), [session, headers]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}

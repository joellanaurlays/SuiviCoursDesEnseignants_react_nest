import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

import { useAuth as useJwtAuthContext } from '../context/AuthContext.jsx';
import { getAuthHeaders } from '../services/auth.service';
import type {
  Cycle,
  Parcours,
  UserRole,
  UserSession,
} from '../types/enseignement';

interface JwtUser {
  id?: string | number;
  firstName?: string;
  lastName?: string;
  username?: string | null;
  role?: string;
  mentionId?: string | null;
  cycles?: string[] | null;
  parcours?: string | null;
}

interface JwtAuthState {
  user: JwtUser | null;
  isLoading: boolean;
}

export interface AuthContextValue {
  session: UserSession;
  headers: Record<string, string>;
  isLoading: boolean;
  displayName: string;
}

const NO_SESSION: UserSession = {
  userId: '',
  role: 'ENSEIGNANT',
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toBackendRole(role: unknown): UserRole | null {
  switch (role) {
    case 'CHEF_SCOLARITE':
      return 'SCOLARITE';
    case 'ADMINISTRATEUR':
      return 'ADMINISTRATEUR';
    case 'RESPONSABLE_LICENCE':
    case 'RESPONSABLE_MASTER':
    case 'RESPONSABLE_MENTION':
      return 'RESPONSABLE_MENTION';
    case 'ENSEIGNANT':
      return 'ENSEIGNANT';
    default:
      return null;
  }
}

function getDisplayName(user: JwtUser | null): string {
  if (!user) return '';

  const fullName = [user.firstName, user.lastName]
    .filter((part) => typeof part === 'string' && part.trim())
    .join(' ')
    .trim();

  if (fullName) return fullName;
  if (user.username?.trim()) return user.username.trim();

  return 'Utilisateur';
}

function normalizeParcours(value: unknown): Parcours | undefined {
  switch (value) {
    case 'Informatique':
    case 'Management':
    case 'ICM':
      return value;
    default:
      return undefined;
  }
}

function sessionFromUser(user: JwtUser): UserSession | null {
  if (user.id === undefined || user.id === null) return null;

  const userId = String(user.id).trim();
  if (!userId || !user.role) return null;

  const role = toBackendRole(user.role);
  if (!role) return null;

  const cycles = (user.cycles ?? [])
    .map((cycle) => String(cycle).toUpperCase())
    .filter(
      (cycle): cycle is Cycle =>
        cycle === 'LICENCE' || cycle === 'MASTER',
    );

  if (role === 'RESPONSABLE_MENTION' && cycles.length === 0) {
    if (user.role === 'RESPONSABLE_LICENCE') {
      cycles.push('LICENCE');
    } else if (user.role === 'RESPONSABLE_MASTER') {
      cycles.push('MASTER');
    }
  }

  return {
    userId,
    role,
    mentionId: user.mentionId ?? undefined,
    cycles,
    parcours: normalizeParcours(user.parcours),
  };
}

export function useJwtAuth(): JwtAuthState {
  return useJwtAuthContext() as JwtAuthState;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useJwtAuth();

  const session = useMemo(() => {
    if (isLoading || !user) return NO_SESSION;
    return sessionFromUser(user) ?? NO_SESSION;
  }, [user, isLoading]);

  const headers = useMemo(() => {
    if (isLoading || !user || !session.userId) return {};
    return getAuthHeaders(session);
  }, [user, session, isLoading]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      headers,
      isLoading,
      displayName: getDisplayName(user),
    }),
    [session, headers, isLoading, user],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }

  return context;
}

export { AuthProvider as SuiviAuthProvider };

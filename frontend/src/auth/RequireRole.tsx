import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { UserRole, UserSession } from '../types/enseignement';

function defaultPathForSession(session: UserSession): string {
  switch (session.role) {
    case 'ENSEIGNANT':
      return '/enseignant/enseignements';
    case 'SCOLARITE':
      return '/scolarite/suivi-enseignements';
    case 'RESPONSABLE_MENTION':
      return session.cycles?.includes('MASTER')
        ? '/responsable/master/suivi-enseignements'
        : '/responsable/licence/suivi-enseignements';
    case 'ADMINISTRATEUR':
      return '/admin/suivi-enseignements';
    default:
      return '/enseignant/enseignements';
  }
}

function defaultPathForRole(role: UserRole): string {
  return defaultPathForSession({ userId: '', role });
}

export function DefaultRedirect() {
  const { session } = useAuth();
  return <Navigate to={defaultPathForSession(session)} replace />;
}

export function RequireRole({ role, children }: { role: UserRole; children: ReactNode }) {
  const { session } = useAuth();
  if (session.role !== role) {
    return <Navigate to={defaultPathForRole(session.role)} replace />;
  }
  return <>{children}</>;
}

export function RequireResponsable({ cycle, children }: { cycle: 'LICENCE' | 'MASTER'; children: ReactNode }) {
  const { session } = useAuth();
  if (session.role !== 'RESPONSABLE_MENTION') {
    return <Navigate to={defaultPathForRole(session.role)} replace />;
  }
  if (session.cycles && !session.cycles.includes(cycle)) {
    return <Navigate to="/responsable/licence/suivi-enseignements" replace />;
  }
  return <>{children}</>;
}
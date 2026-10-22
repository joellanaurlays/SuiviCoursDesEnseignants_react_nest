import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { UserRole } from '../types/enseignement';
import { getRoleHomePath } from '../routing/roleRoutes.js';

export function DefaultRedirect() {
  const { session } = useAuth();
  return <Navigate to={getRoleHomePath(session)} replace />;
}

export function RequireRole({ role, children }: { role: UserRole; children: ReactNode }) {
  const { session } = useAuth();
  if (session.role !== role) {
    return <Navigate to={getRoleHomePath(session)} replace />;
  }
  return <>{children}</>;
}

export function RequireResponsable({ cycle, children }: { cycle: 'LICENCE' | 'MASTER'; children: ReactNode }) {
  const { session } = useAuth();
  if (session.role !== 'RESPONSABLE_MENTION') {
    return <Navigate to={getRoleHomePath(session)} replace />;
  }
  if (session.cycles && !session.cycles.includes(cycle)) {
    return <Navigate to={getRoleHomePath(session)} replace />;
  }
  return <>{children}</>;
}

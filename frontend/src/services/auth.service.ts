import { AUTH_HEADERS } from '../auth/headers';
import { UserSession } from '../types/enseignement';

const SESSION_KEY = 'suivi-auth-session';

export function getSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserSession;
    if (!parsed.userId || !parsed.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: UserSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getAuthHeaders(session: UserSession | null): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!session) return headers;

  headers[AUTH_HEADERS.userId] = session.userId;
  headers[AUTH_HEADERS.role] = session.role;
  if (session.mentionId) {
    headers[AUTH_HEADERS.mentionId] = session.mentionId;
  }
  if (session.cycles && session.cycles.length > 0) {
    headers[AUTH_HEADERS.cycles] = session.cycles.join(',');
  }
  if (session.parcours) {
    headers[AUTH_HEADERS.parcours] = session.parcours;
  }
  return headers;
}
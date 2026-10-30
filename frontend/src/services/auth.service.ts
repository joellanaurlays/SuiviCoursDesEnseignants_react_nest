import { AUTH_HEADERS } from '../auth/headers';
import { TOKEN_KEY } from './sessionApi.js';
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

export function getToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ?? null;
}

export function getAuthHeaders(session: UserSession | null): Record<string, string> {
  const headers: Record<string, string> = {};

  // Priorité 1 : Si un JWT existe, on l'utilise (même si une session incomplète existe aussi)
  // Le backend vérifiera le JWT et reconstruira l'AuthContext depuis ses claims
  const token = getToken();
  if (token) {
    headers.authorization = `Bearer ${token}`;
    return headers;
  }

  // Priorité 2 : Si aucun JWT, utiliser la session historique par en-têtes x-user-*
  // Uniquement si une session valide existe
  if (session) {
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
  }
  // Si ni JWT ni session valide : en-têtes vides, le backend refusera (401)

  return headers;
}
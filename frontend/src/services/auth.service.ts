import { AUTH_HEADERS } from '../auth/headers';
import { UserSession } from '../types/enseignement';

const SESSION_KEY = 'suivi-auth-session';
const TOKEN_KEY = 'suivi-auth-token';

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

/** Jeton JWT renvoye par le login. */
export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

/**
 * Appelle POST /api/auth/login, stocke le jeton et la session,
 * puis retourne les donnees utilisateur.
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    let message = 'Identifiants incorrects.';
    try {
      const data = await res.json();
      if (data.message) {
        message =
          typeof data.message === 'string'
            ? data.message
            : data.message.join('. ');
      }
    } catch {
      // corps non JSON
    }
    throw new Error(message);
  }

  const data: AuthResponse = await res.json();
  return data;
}

export function logout(): void {
  clearSession();
  clearToken();
}
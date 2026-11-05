import { ApiError } from '../types/enseignement';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

function headersForMethod(authHeaders: Record<string, string>, hasBody: boolean): Record<string, string> {
  const headers: Record<string, string> = { ...authHeaders };
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

export async function request<T>(
  path: string,
  method: HttpMethod = 'GET',
  body?: unknown,
  authHeaders: Record<string, string> = {},
): Promise<T> {
  const hasBody = body !== undefined;

  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: headersForMethod(authHeaders, hasBody),
      body: hasBody ? JSON.stringify(body) : undefined,
    });
  } catch {
    // Échec réseau (backend arrêté, coupure de connexion…) : message lisible.
    throw {
      status: 0,
      message:
        'Connexion au serveur impossible. Vérifiez votre connexion puis réessayez.',
    } as ApiError;
  }

  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try {
      const data = await res.json();
      if (Array.isArray(data.message)) {
        message = data.message.join('. ');
      } else if (typeof data.message === 'string' && data.message) {
        message = data.message;
      }
    } catch {
      // corps non JSON
    }
    throw { status: res.status, message } as ApiError;
  }

  if (res.status === 204) {
    return undefined as T;
  }

  try {
    return (await res.json()) as T;
  } catch {
    throw { status: res.status, message: 'Réponse invalide du serveur.' } as ApiError;
  }
}
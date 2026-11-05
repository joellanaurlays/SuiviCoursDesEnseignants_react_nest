// Client HTTP du module Structure académique : fetch + jeton JWT du projet.
// Même interface que axios (api.get/post/patch/delete -> { data }) et mêmes erreurs
// normalisées : err.userMessage (texte lisible), err.fieldErrors ({champ: [messages]}).
import { SESSION_EXPIRED_EVENT, TOKEN_KEY } from '../../services/sessionApi.js';

const API_URL = `${import.meta.env.VITE_API_URL || ''}/api`;

async function request(method, path, body) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    const err = new Error('network');
    err.fieldErrors = null;
    err.userMessage = 'Impossible de joindre le serveur. Vérifiez que le backend est démarré.';
    throw err;
  }

  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const err = new Error(`HTTP ${response.status}`);
    err.response = { status: response.status, data };
    err.fieldErrors = data?.fieldErrors ?? null;
    err.userMessage =
      response.status === 403
        ? "Votre rôle n'est pas autorisé à effectuer cette opération."
        : ((Array.isArray(data?.message) ? data.message.join(' · ') : data?.message) ??
          'Une erreur est survenue.');
    throw err;
  }
  return { data, status: response.status };
}

const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body ?? {}),
  patch: (path, body) => request('PATCH', path, body ?? {}),
  delete: (path) => request('DELETE', path),
};

export default api;

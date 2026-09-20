const API_URL = import.meta.env.VITE_API_URL
const TOKEN_KEY = 'emit_access_token'
const SESSION_EXPIRED_EVENT = 'emit:session-expired'

export async function apiFetch(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }

  if (auth) {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (response.status === 401 && auth) {
    localStorage.removeItem(TOKEN_KEY)
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Une erreur est survenue.')
  }

  return data
}

export { SESSION_EXPIRED_EVENT, TOKEN_KEY }
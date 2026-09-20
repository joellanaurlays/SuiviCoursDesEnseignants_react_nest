import { apiFetch } from './apiClient.js'

export function updateProfile(payload) {
  return apiFetch('/users/me', { method: 'PATCH', body: payload })
}

export function changePassword(payload) {
  return apiFetch('/users/me/password', { method: 'PATCH', body: payload })
}

export function listUsers({ search, role, isActive, page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (role) params.set('role', role)
  if (isActive !== undefined && isActive !== '') params.set('isActive', isActive)
  params.set('page', page)
  params.set('limit', limit)

  return apiFetch(`/users?${params.toString()}`)
}

export function getUser(id) {
  return apiFetch(`/users/${id}`)
}

export function createUser(payload) {
  return apiFetch('/users', { method: 'POST', body: payload })
}

export function updateUser(id, payload) {
  return apiFetch(`/users/${id}`, { method: 'PATCH', body: payload })
}
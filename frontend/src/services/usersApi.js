import { apiFetch } from './apiClient.js'

export function updateProfile(payload) {
  return apiFetch('/users/me', { method: 'PATCH', body: payload })
}

export function changePassword(payload) {
  return apiFetch('/users/me/password', { method: 'PATCH', body: payload })
}
import { apiFetch } from './apiClient.js'

export function loginRequest(email, password) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  })
}

export function fetchProfile() {
  return apiFetch('/auth/profile')
}

export function logoutRequest() {
  return apiFetch('/auth/logout', { method: 'POST' })
}
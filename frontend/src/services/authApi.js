import { apiFetch } from './sessionApi.js'

export function loginRequest(email, password) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  })
}

export function forgotPasswordRequest(email) {
  return apiFetch('/auth/forgot-password', {
    method: 'POST',
    body: { email },
    auth: false,
  })
}

export function resetPasswordRequest(email, code, newPassword) {
  return apiFetch('/auth/reset-password', {
    method: 'POST',
    body: { email, code, newPassword },
    auth: false,
  })
}

export function fetchProfile() {
  return apiFetch('/auth/profile')
}

export function logoutRequest() {
  return apiFetch('/auth/logout', { method: 'POST' })
}
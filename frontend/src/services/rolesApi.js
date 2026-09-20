import { apiFetch } from './apiClient.js'

export function listRoles() {
  return apiFetch('/roles')
}
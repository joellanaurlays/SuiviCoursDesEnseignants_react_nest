import { apiFetch } from './sessionApi.js'

export function listRoles() {
  return apiFetch('/roles')
}
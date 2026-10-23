import { request } from './api.client';

export type TypeAlerte = 'NOTES_NON_REMISES' | 'MISSING_DOCUMENTS' | 'EN_COURS' | 'A_VENIR';

export interface Alerte {
  id: string;
  typeAlerte: TypeAlerte;
  message: string;
  examenId: string | null;
  estLue: boolean;
  estTraitee: boolean;
  createdAt: string;
  updatedAt: string;
  examen?: {
    id: string;
    dateExamen: string;
    salle: string | null;
  } | null;
}

export const alerteService = {
  getAll(authHeaders: Record<string, string>): Promise<Alerte[]> {
    return request<Alerte[]>('/exams/alertes/all', 'GET', undefined, authHeaders);
  },

  create(typeAlerte: TypeAlerte, payload: { message?: string; examenId?: string }, authHeaders: Record<string, string>): Promise<Alerte> {
    return request<Alerte>('/exams/alertes', 'POST', { typeAlerte, ...payload }, authHeaders);
  },

  markNotesRemises(examenId: string, authHeaders: Record<string, string>): Promise<void> {
    return request<void>(`/exams/${examenId}/notes-remises`, 'PATCH', undefined, authHeaders);
  },

  updateStatut(examenId: string, statut: string, authHeaders: Record<string, string>): Promise<void> {
    return request<void>(`/exams/${examenId}/statut`, 'PATCH', { statut }, authHeaders);
  },
};

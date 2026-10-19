import { request } from './api.client';
import { EnseignementAvecSuivi, Seance } from '../types/enseignement';

export const enseignementService = {
  list(headers: Record<string, string>): Promise<EnseignementAvecSuivi[]> {
    return request<EnseignementAvecSuivi[]>('/enseignements', 'GET', undefined, headers);
  },

  getById(id: string, headers: Record<string, string>): Promise<EnseignementAvecSuivi> {
    return request<EnseignementAvecSuivi>(`/enseignements/${id}`, 'GET', undefined, headers);
  },

  getSeances(id: string, headers: Record<string, string>): Promise<Seance[]> {
    return request<Seance[]>(`/enseignements/${id}/seances`, 'GET', undefined, headers);
  },
};
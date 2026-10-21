import { request } from './api.client';
import { SuiviEnseignement, SuiviQuery, SuiviStatistiques } from '../types/enseignement';

function toQueryString(filters: SuiviQuery): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.append(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const suiviService = {
  list(filters: SuiviQuery = {}, headers: Record<string, string>): Promise<SuiviEnseignement[]> {
    return request<SuiviEnseignement[]>(
      `/suivi/enseignements${toQueryString(filters)}`,
      'GET',
      undefined,
      headers,
    );
  },

  getById(id: string, headers: Record<string, string>): Promise<SuiviEnseignement> {
    return request<SuiviEnseignement>(`/suivi/enseignements/${id}`, 'GET', undefined, headers);
  },

  statistiques(filters: SuiviQuery = {}, headers: Record<string, string>): Promise<SuiviStatistiques> {
    return request<SuiviStatistiques>(
      `/suivi/statistiques${toQueryString(filters)}`,
      'GET',
      undefined,
      headers,
    );
  },
};

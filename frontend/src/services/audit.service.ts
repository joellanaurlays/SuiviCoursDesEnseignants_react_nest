import { request } from './api.client';
import { JournalAuditEntry } from '../types/enseignement';

export interface JournalAuditFiltres {
  seanceId?: string;
  enseignementId?: string;
  limit?: number;
}

function construireQuery(filtres: JournalAuditFiltres): string {
  const params = new URLSearchParams();
  if (filtres.seanceId) params.set('seanceId', filtres.seanceId);
  if (filtres.enseignementId) params.set('enseignementId', filtres.enseignementId);
  if (filtres.limit) params.set('limit', String(filtres.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/** Journal d'audit des séances (lecture seule, périmètre déduit côté serveur). */
export const auditService = {
  getAll(filtres: JournalAuditFiltres, headers: Record<string, string>): Promise<JournalAuditEntry[]> {
    return request<JournalAuditEntry[]>(
      `/audit/seances${construireQuery(filtres)}`,
      'GET',
      undefined,
      headers,
    );
  },
};

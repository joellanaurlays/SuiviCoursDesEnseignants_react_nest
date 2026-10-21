import { request } from './api.client';
import { DashboardResponse } from '../types/enseignement';

export const dashboardService = {
  get(enseignantId: string, headers: Record<string, string>): Promise<DashboardResponse> {
    return request<DashboardResponse>(
      `/enseignants/${encodeURIComponent(enseignantId)}/dashboard`,
      'GET',
      undefined,
      headers,
    );
  },
};
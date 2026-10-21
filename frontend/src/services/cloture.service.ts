import { request } from './api.client';
import { DetailCloture, SuiviEnseignement } from '../types/enseignement';

/**
 * Clôture anticipée d'un enseignement.
 *
 * L'enseignant affecté clôture lui-même son enseignement avec un motif
 * obligatoire. Il n'existe aucune validation par un responsable : ce service
 * n'expose que le dépôt de la clôture et la lecture de son état.
 */
export const clotureService = {
  /** L'enseignant clôture son enseignement avant l'atteinte du volume prévu. */
  cloturer(
    id: string,
    motif: string,
    headers: Record<string, string>,
  ): Promise<{ suivi: SuiviEnseignement }> {
    return request<{ suivi: SuiviEnseignement }>(
      `/enseignements/${id}/cloture`,
      'POST',
      { motif },
      headers,
    );
  },

  /** État de clôture et droit d'action, calculés par le backend. */
  getById(id: string, headers: Record<string, string>): Promise<DetailCloture> {
    return request<DetailCloture>(`/enseignements/${id}/cloture`, 'GET', undefined, headers);
  },
};

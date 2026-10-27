import { request } from './api.client';
import {
  CreateEnseignementPayload,
  EnseignementAvecSuivi,
  ReferentielCreationEnseignement,
  Seance,
  SuiviEnseignement,
} from '../types/enseignement';
import { isLocalPreviewEnabled, withPreviewFallback } from '../preview/localPreview';
import { previewStore } from '../preview/demoStore';

/**
 * Service des enseignements.
 *
 * En mode de prévisualisation local, l'API réelle est interrogée d'abord et
 * le jeu de démonstration prend le relais en cas d'échec (erreur réelle
 * conservée et affichée dans le bandeau). Hors prévisualisation, le
 * comportement est strictement inchangé.
 */
export const enseignementService = {
  list(headers: Record<string, string>): Promise<EnseignementAvecSuivi[]> {
    if (!isLocalPreviewEnabled()) {
      return request<EnseignementAvecSuivi[]>('/enseignements', 'GET', undefined, headers);
    }
    return withPreviewFallback(
      () => request<EnseignementAvecSuivi[]>('/enseignements', 'GET', undefined, headers),
      () => previewStore.listEnseignements(),
      (enseignements) => enseignements.length === 0,
    );
  },

  getById(id: string, headers: Record<string, string>): Promise<EnseignementAvecSuivi> {
    if (!isLocalPreviewEnabled()) {
      return request<EnseignementAvecSuivi>(`/enseignements/${id}`, 'GET', undefined, headers);
    }
    return withPreviewFallback(
      () => request<EnseignementAvecSuivi>(`/enseignements/${id}`, 'GET', undefined, headers),
      () => previewStore.getEnseignement(id),
    );
  },

  getSeances(id: string, headers: Record<string, string>): Promise<Seance[]> {
    if (!isLocalPreviewEnabled()) {
      return request<Seance[]>(`/enseignements/${id}/seances`, 'GET', undefined, headers);
    }
    return withPreviewFallback(
      () => request<Seance[]>(`/enseignements/${id}/seances`, 'GET', undefined, headers),
      () => previewStore.getSeancesDeLEnseignement(id),
      (seances) => seances.length === 0,
    );
  },

  getReferentielCreation(
    headers: Record<string, string>,
  ): Promise<ReferentielCreationEnseignement> {
    return request<ReferentielCreationEnseignement>(
      '/enseignements/referentiels',
      'GET',
      undefined,
      headers,
    );
  },

  /** Alias conservé pour les écrans qui utilisaient l'ancien nom. */
  getReferentiel(headers: Record<string, string>): Promise<ReferentielCreationEnseignement> {
    return this.getReferentielCreation(headers);
  },

  create(
    payload: CreateEnseignementPayload,
    headers: Record<string, string>,
  ): Promise<SuiviEnseignement> {
    return request<SuiviEnseignement>('/enseignements', 'POST', payload, headers);
  },
};

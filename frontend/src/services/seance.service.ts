import { request } from './api.client';
import {
  AnnulerSeancePayload,
  CorrigerSeancePayload,
  CreateSeancePayload,
  JournalAuditEntry,
  RealiserSeancePayload,
  Seance,
} from '../types/enseignement';
import { isLocalPreviewEnabled, withPreviewFallback } from '../preview/localPreview';
import { previewStore } from '../preview/demoStore';

/**
 * Service des séances.
 *
 * MODE DE PRÉVISUALISATION LOCAL (développement + VITE_ENABLE_LOCAL_PREVIEW=true)
 *  - LECTURE : l'API réelle est interrogée d'abord. Si elle échoue (backend
 *    arrêté, 401 faute d'authentification…), le jeu de démonstration prend le
 *    relais et l'erreur réelle est affichée dans le bandeau de prévisualisation
 *    (elle n'est jamais masquée).
 *  - ÉCRITURE : jamais transmise au backend. Les actions sont simulées en
 *    mémoire : PostgreSQL n'est jamais modifié pendant une prévisualisation.
 *
 * HORS PRÉVISUALISATION : comportement strictement inchangé, l'API réelle est
 * la seule source de vérité.
 */
export const seanceService = {
  create(payload: CreateSeancePayload, headers: Record<string, string>): Promise<Seance> {
    if (isLocalPreviewEnabled()) {
      return Promise.resolve(previewStore.create(payload));
    }
    return request<Seance>('/seances', 'POST', payload, headers);
  },

  getAll(headers: Record<string, string>): Promise<Seance[]> {
    if (!isLocalPreviewEnabled()) {
      return request<Seance[]>('/seances', 'GET', undefined, headers);
    }
    return withPreviewFallback(
      () => request<Seance[]>('/seances', 'GET', undefined, headers),
      () => previewStore.listSeances(),
      (seances) => seances.length === 0,
    );
  },

  getById(id: string, headers: Record<string, string>): Promise<Seance> {
    if (!isLocalPreviewEnabled()) {
      return request<Seance>(`/seances/${id}`, 'GET', undefined, headers);
    }
    return withPreviewFallback(
      () => request<Seance>(`/seances/${id}`, 'GET', undefined, headers),
      () => previewStore.getSeance(id),
    );
  },

  /** Historique d'audit de la séance (actions, auteur, dates, valeurs, motifs). */
  getHistorique(id: string, headers: Record<string, string>): Promise<JournalAuditEntry[]> {
    if (!isLocalPreviewEnabled()) {
      return request<JournalAuditEntry[]>(`/seances/${id}/historique`, 'GET', undefined, headers);
    }
    return withPreviewFallback(
      () => request<JournalAuditEntry[]>(`/seances/${id}/historique`, 'GET', undefined, headers),
      () => previewStore.historique(id),
    );
  },

  /** Réalise une séance planifiée (enseignant responsable uniquement). */
  realiser(
    id: string,
    payload: RealiserSeancePayload,
    headers: Record<string, string>,
  ): Promise<Seance> {
    if (isLocalPreviewEnabled()) {
      return Promise.resolve(previewStore.realiser(id, payload));
    }
    return request<Seance>(`/seances/${id}/realiser`, 'POST', payload, headers);
  },

  /** Annule une séance planifiée (enseignant responsable uniquement). */
  annuler(
    id: string,
    payload: AnnulerSeancePayload,
    headers: Record<string, string>,
  ): Promise<Seance> {
    if (isLocalPreviewEnabled()) {
      return Promise.resolve(previewStore.annuler(id, payload));
    }
    return request<Seance>(`/seances/${id}/annuler`, 'POST', payload, headers);
  },

  /** Corrige les informations d'une séance déjà réalisée (motif tracé). */
  corriger(
    id: string,
    payload: CorrigerSeancePayload,
    headers: Record<string, string>,
  ): Promise<Seance> {
    if (isLocalPreviewEnabled()) {
      return Promise.resolve(previewStore.corriger(id, payload));
    }
    return request<Seance>(`/seances/${id}`, 'PATCH', payload, headers);
  },
};

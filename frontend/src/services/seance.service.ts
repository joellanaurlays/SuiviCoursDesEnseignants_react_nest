import { request } from './api.client';
import {
  AnnulerSeancePayload,
  CorrigerSeancePayload,
  CreateSeancePayload,
  JournalAuditEntry,
  RealiserSeancePayload,
  Seance,
} from '../types/enseignement';

export const seanceService = {
  create(payload: CreateSeancePayload, headers: Record<string, string>): Promise<Seance> {
    return request<Seance>('/seances', 'POST', payload, headers);
  },

  getAll(headers: Record<string, string>): Promise<Seance[]> {
    return request<Seance[]>('/seances', 'GET', undefined, headers);
  },

  getById(id: string, headers: Record<string, string>): Promise<Seance> {
    return request<Seance>(`/seances/${id}`, 'GET', undefined, headers);
  },

  /** Historique d'audit de la séance (actions, auteur, dates, valeurs, motifs). */
  getHistorique(id: string, headers: Record<string, string>): Promise<JournalAuditEntry[]> {
    return request<JournalAuditEntry[]>(`/seances/${id}/historique`, 'GET', undefined, headers);
  },

  /** Réalise une séance planifiée (enseignant responsable uniquement). */
  realiser(
    id: string,
    payload: RealiserSeancePayload,
    headers: Record<string, string>,
  ): Promise<Seance> {
    return request<Seance>(`/seances/${id}/realiser`, 'POST', payload, headers);
  },

  /** Annule une séance planifiée (enseignant responsable uniquement). */
  annuler(
    id: string,
    payload: AnnulerSeancePayload,
    headers: Record<string, string>,
  ): Promise<Seance> {
    return request<Seance>(`/seances/${id}/annuler`, 'POST', payload, headers);
  },

  /** Corrige les informations d'une séance déjà réalisée (motif tracé). */
  corriger(
    id: string,
    payload: CorrigerSeancePayload,
    headers: Record<string, string>,
  ): Promise<Seance> {
    return request<Seance>(`/seances/${id}`, 'PATCH', payload, headers);
  },
};

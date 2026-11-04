/**
 * MAGASIN DE DÉMONSTRATION EN MÉMOIRE — mode de prévisualisation local.
 *
 * Ce magasin reproduit, en mémoire uniquement, les opérations du module
 * Suivi des enseignements (liste, détail, déclaration, réalisation,
 * annulation, correction, journal d'audit).
 *
 * AUCUNE écriture n'est transmise au backend : PostgreSQL n'est jamais
 * modifié pendant une prévisualisation. Les actions sont donc VOLATILES :
 * elles disparaissent au rechargement de la page.
 */

import {
  AnnulerSeancePayload,
  CorrigerSeancePayload,
  CreateSeancePayload,
  EnseignementAvecSuivi,
  JournalAuditEntry,
  RealiserSeancePayload,
  Seance,
  StatutSeance,
  ValeursSeanceAudit,
} from '../types/enseignement';
import { DEMO_ENSEIGNANT, DEMO_ENSEIGNEMENTS, DEMO_JOURNAL_AUDIT, DEMO_SEANCES } from './demoData';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

let seances: Seance[] = clone(DEMO_SEANCES);
let journal: JournalAuditEntry[] = clone(DEMO_JOURNAL_AUDIT);
let compteur = 0;

function maintenant(): string {
  return new Date().toISOString();
}

function cloneSeance(seance: Seance): Seance {
  return { ...seance, enseignement: seance.enseignement ? { ...seance.enseignement } : undefined };
}

function journaliser(
  seance: Seance,
  action: JournalAuditEntry['action'],
  statutAvant: StatutSeance | null,
  statutApres: StatutSeance | null,
  valeursAvant: ValeursSeanceAudit | null,
  valeursApres: ValeursSeanceAudit | null,
  motif: string | null,
): void {
  const enseignement = DEMO_ENSEIGNEMENTS.find((e) => e.id === seance.enseignementId);
  compteur += 1;
  journal.push({
    id: `demo-audit-${compteur}`,
    seanceId: seance.id,
    enseignementId: seance.enseignementId,
    utilisateurId: DEMO_ENSEIGNANT,
    action,
    motif,
    statutAvant,
    statutApres,
    valeursAvant,
    valeursApres,
    enseignantId: DEMO_ENSEIGNANT,
    mentionId: enseignement?.mentionId ?? 'Mention Informatique (démo)',
    cycle: enseignement?.cycle ?? 'LICENCE',
    parcours: enseignement?.parcours ?? 'Informatique',
    createdAt: maintenant(),
  });
}

function findSeance(id: string): Seance {
  const seance = seances.find((s) => s.id === id);
  if (!seance) {
    throw { status: 404, message: 'Séance introuvable (jeu de démonstration).' } as const;
  }
  return seance;
}

function calculerDuree(heureDebut: string, heureFin: string): number {
  const [h1, m1] = heureDebut.split(':').map(Number);
  const [h2, m2] = heureFin.split(':').map(Number);
  return h2 * 60 + m2 - (h1 * 60 + m1);
}

export const previewStore = {
  /** Réinitialise le jeu de démonstration (utile entre deux Sessions). */
  reset(): void {
    seances = clone(DEMO_SEANCES);
    journal = clone(DEMO_JOURNAL_AUDIT);
    compteur = 0;
  },

  listSeances(): Seance[] {
    return seances.map(cloneSeance);
  },

  getSeance(id: string): Seance {
    return cloneSeance(findSeance(id));
  },

  listEnseignements(): EnseignementAvecSuivi[] {
    return clone(DEMO_ENSEIGNEMENTS);
  },

  getEnseignement(id: string): EnseignementAvecSuivi {
    const found = DEMO_ENSEIGNEMENTS.find((e) => e.id === id);
    if (!found) {
      throw { status: 404, message: 'Enseignement introuvable (jeu de démonstration).' } as const;
    }
    return clone(found);
  },

  getSeancesDeLEnseignement(enseignementId: string): Seance[] {
    return seances.filter((s) => s.enseignementId === enseignementId).map(cloneSeance);
  },

  historique(seanceId: string): JournalAuditEntry[] {
    return clone(journal.filter((entry) => entry.seanceId === seanceId));
  },

  create(payload: CreateSeancePayload): Seance {
    const enseignement = DEMO_ENSEIGNEMENTS.find((e) => e.id === payload.enseignementId);
    if (!enseignement) {
      throw { status: 404, message: 'Enseignement introuvable (jeu de démonstration).' } as const;
    }

    compteur += 1;
    const statut: StatutSeance = payload.statut ?? 'PLANIFIEE';
    const seance: Seance = {
      id: `demo-seance-${compteur}`,
      enseignementId: payload.enseignementId,
      dateSeance: payload.dateSeance,
      heureDebut: payload.heureDebut,
      heureFin: payload.heureFin,
      duree: calculerDuree(payload.heureDebut, payload.heureFin),
      contenuEnseigne: payload.contenuEnseigne ?? null,
      salle: payload.salle ?? null,
      typeSeance: payload.typeSeance ?? null,
      statut,
      createdAt: maintenant(),
      updatedAt: maintenant(),
      enseignement: clone(enseignement),
      peutRealiser: statut === 'PLANIFIEE',
      peutAnnuler: statut === 'PLANIFIEE',
      peutCorriger: statut === 'REALISEE',
    };

    seances = [seance, ...seances];
    journaliser(
      seance,
      'CREATION',
      null,
      statut,
      null,
      {
        heureDebut: seance.heureDebut,
        heureFin: seance.heureFin,
        salle: seance.salle,
        typeSeance: seance.typeSeance,
        statut,
      },
      null,
    );
    return cloneSeance(seance);
  },

  realiser(id: string, payload: RealiserSeancePayload): Seance {
    const seance = findSeance(id);
    const valeursAvant: ValeursSeanceAudit = {
      dateSeance: seance.dateSeance,
      heureDebut: seance.heureDebut,
      heureFin: seance.heureFin,
      contenuEnseigne: seance.contenuEnseigne,
      salle: seance.salle,
      typeSeance: seance.typeSeance,
      statut: seance.statut,
    };

    const miseAJour: Seance = {
      ...seance,
      dateSeance: payload.dateSeance ?? seance.dateSeance,
      heureDebut: payload.heureDebut ?? seance.heureDebut,
      heureFin: payload.heureFin ?? seance.heureFin,
      contenuEnseigne: payload.contenuEnseigne ?? seance.contenuEnseigne,
      salle: payload.salle ?? seance.salle,
      typeSeance: payload.typeSeance ?? seance.typeSeance,
      duree: calculerDuree(
        payload.heureDebut ?? seance.heureDebut,
        payload.heureFin ?? seance.heureFin,
      ),
      statut: 'REALISEE',
      updatedAt: maintenant(),
      peutRealiser: false,
      peutAnnuler: false,
      peutCorriger: true,
    };

    seances = seances.map((s) => (s.id === id ? miseAJour : s));
    journaliser(
      miseAJour,
      'REALISATION',
      seance.statut,
      'REALISEE',
      valeursAvant,
      {
        dateSeance: miseAJour.dateSeance,
        heureDebut: miseAJour.heureDebut,
        heureFin: miseAJour.heureFin,
        contenuEnseigne: miseAJour.contenuEnseigne,
        salle: miseAJour.salle,
        typeSeance: miseAJour.typeSeance,
        statut: 'REALISEE',
      },
      null,
    );
    return cloneSeance(miseAJour);
  },

  annuler(id: string, payload: AnnulerSeancePayload): Seance {
    const seance = findSeance(id);
    const valeursAvant: ValeursSeanceAudit = { statut: seance.statut };

    const miseAJour: Seance = {
      ...seance,
      statut: 'ANNULEE',
      updatedAt: maintenant(),
      peutRealiser: false,
      peutAnnuler: false,
      peutCorriger: false,
    };

    seances = seances.map((s) => (s.id === id ? miseAJour : s));
    journaliser(
      miseAJour,
      'ANNULATION',
      seance.statut,
      'ANNULEE',
      valeursAvant,
      { statut: 'ANNULEE' },
      payload.motif ?? null,
    );
    return cloneSeance(miseAJour);
  },

  corriger(id: string, payload: CorrigerSeancePayload): Seance {
    const seance = findSeance(id);
    const valeursAvant: ValeursSeanceAudit = {
      dateSeance: seance.dateSeance,
      heureDebut: seance.heureDebut,
      heureFin: seance.heureFin,
      contenuEnseigne: seance.contenuEnseigne,
      salle: seance.salle,
      typeSeance: seance.typeSeance,
      statut: seance.statut,
    };

    const miseAJour: Seance = {
      ...seance,
      dateSeance: payload.dateSeance ?? seance.dateSeance,
      heureDebut: payload.heureDebut ?? seance.heureDebut,
      heureFin: payload.heureFin ?? seance.heureFin,
      contenuEnseigne: payload.contenuEnseigne ?? seance.contenuEnseigne,
      salle: payload.salle ?? seance.salle,
      typeSeance: payload.typeSeance ?? seance.typeSeance,
      duree: calculerDuree(
        payload.heureDebut ?? seance.heureDebut,
        payload.heureFin ?? seance.heureFin,
      ),
      updatedAt: maintenant(),
      peutCorriger: true,
    };

    seances = seances.map((s) => (s.id === id ? miseAJour : s));
    journaliser(
      miseAJour,
      'CORRECTION',
      seance.statut,
      miseAJour.statut,
      valeursAvant,
      {
        dateSeance: miseAJour.dateSeance,
        heureDebut: miseAJour.heureDebut,
        heureFin: miseAJour.heureFin,
        contenuEnseigne: miseAJour.contenuEnseigne,
        salle: miseAJour.salle,
        typeSeance: miseAJour.typeSeance,
        statut: miseAJour.statut,
      },
      payload.motif ?? null,
    );
    return cloneSeance(miseAJour);
  },
};

/**
 * DONNÉES DE DÉMONSTRATION — mode de prévisualisation local.
 *
 * AVERTISSEMENT
 * Ce jeu de données est ENTIÈREMENT FICTIF. Il ne contient aucune donnée
 * réelle d'un enseignant, d'un enseignement ou d'une séance de l'EMIT.
 * Il sert uniquement à rendre l'interface du module Suivi des enseignements
 * exploitable pendant que l'authentification est en cours de résolution.
 *
 * Toutes les données sont identifiables comme démo :
 *  - identifiants préfixés par « demo- » ;
 *  - intitulés explicitement suffixés par « (démo) » ;
 *  - enseignant de démonstration « Démo Enseignant ».
 *
 * Ces données vivent uniquement dans le bundle du navigateur : la base
 * PostgreSQL n'est jamais lue ni écrite par ce jeu.
 */

import {
  EnseignementAvecSuivi,
  JournalAuditEntry,
  Seance,
  StatutSeance,
} from '../types/enseignement';

const DATEDEMO = '2026-10-21T08:00:00.000Z';

export const DEMO_ENSEIGNANT = 'Démo Enseignant';

export const DEMO_ENSEIGNEMENTS: EnseignementAvecSuivi[] = [
  {
    id: 'demo-ens-algo',
    matiereId: 'Algorithmique 1 (démo)',
    enseignantId: DEMO_ENSEIGNANT,
    mentionId: 'Mention Informatique (démo)',
    cycle: 'LICENCE',
    niveauId: 'L1',
    parcours: 'Informatique',
    semestreId: 'S1',
    anneeUniversitaireId: '2026-2027 (démo)',
    volumePrevu: 30,
    heuresRealisees: 12,
    heuresRestantes: 18,
    progression: 40,
    etat: 'EN_COURS',
    matiere: 'Algorithmique 1 (démo)',
    enseignant: DEMO_ENSEIGNANT,
    mention: 'Mention Informatique (démo)',
    niveau: 'L1 (démo)',
    semestre: 'S1 (démo)',
    anneeUniversitaire: '2026-2027 (démo)',
    createdAt: DATEDEMO,
    updatedAt: DATEDEMO,
  },
  {
    id: 'demo-ens-bdd',
    matiereId: 'Bases de données (démo)',
    enseignantId: DEMO_ENSEIGNANT,
    mentionId: 'Mention Informatique (démo)',
    cycle: 'LICENCE',
    niveauId: 'L2',
    parcours: 'Informatique',
    semestreId: 'S2',
    anneeUniversitaireId: '2026-2027 (démo)',
    volumePrevu: 24,
    heuresRealisees: 24,
    heuresRestantes: 0,
    progression: 100,
    etat: 'TERMINE',
    matiere: 'Bases de données (démo)',
    enseignant: DEMO_ENSEIGNANT,
    mention: 'Mention Informatique (démo)',
    niveau: 'L2 (démo)',
    semestre: 'S2 (démo)',
    anneeUniversitaire: '2026-2027 (démo)',
    createdAt: DATEDEMO,
    updatedAt: DATEDEMO,
  },
  {
    id: 'demo-ens-reseau',
    matiereId: 'Réseaux informatiques (démo)',
    enseignantId: DEMO_ENSEIGNANT,
    mentionId: 'Mention Informatique (démo)',
    cycle: 'MASTER',
    niveauId: 'M1',
    parcours: 'Informatique',
    semestreId: 'S1',
    anneeUniversitaireId: '2026-2027 (démo)',
    volumePrevu: 20,
    heuresRealisees: 0,
    heuresRestantes: 20,
    progression: 0,
    etat: 'NON_COMMENCE',
    matiere: 'Réseaux informatiques (démo)',
    enseignant: DEMO_ENSEIGNANT,
    mention: 'Mention Informatique (démo)',
    niveau: 'M1 (démo)',
    semestre: 'S1 (démo)',
    anneeUniversitaire: '2026-2027 (démo)',
    createdAt: DATEDEMO,
    updatedAt: DATEDEMO,
  },
];

function demoSeance(
  id: string,
  enseignementId: string,
  dateSeance: string,
  heureDebut: string,
  heureFin: string,
  contenuEnseigne: string | null,
  salle: string | null,
  typeSeance: string | null,
  statut: StatutSeance,
): Seance {
  const [h1, m1] = heureDebut.split(':').map(Number);
  const [h2, m2] = heureFin.split(':').map(Number);
  const duree = h2 * 60 + m2 - (h1 * 60 + m1);

  return {
    id,
    enseignementId,
    dateSeance,
    heureDebut,
    heureFin,
    duree,
    contenuEnseigne,
    salle,
    typeSeance,
    statut,
    createdAt: DATEDEMO,
    updatedAt: DATEDEMO,
    enseignement: DEMO_ENSEIGNEMENTS.find((e) => e.id === enseignementId),
    peutRealiser: statut === 'PLANIFIEE',
    peutAnnuler: statut === 'PLANIFIEE',
    peutCorriger: statut === 'REALISEE',
  };
}

export const DEMO_SEANCES: Seance[] = [
  demoSeance(
    'demo-seance-1',
    'demo-ens-algo',
    '2026-10-19T08:00:00.000Z',
    '08:30',
    '10:00',
    'Introduction à la complexité algorithmique (démo)',
    'B303',
    'CM',
    'REALISEE',
  ),
  demoSeance(
    'demo-seance-2',
    'demo-ens-algo',
    '2026-10-20T08:00:00.000Z',
    '08:30',
    '10:00',
    'Tri par dichotomie — exercices guidés (démo)',
    'B303',
    'TD',
    'REALISEE',
  ),
  demoSeance(
    'demo-seance-3',
    'demo-ens-algo',
    '2026-10-21T08:00:00.000Z',
    '10:15',
    '11:45',
    'Récursivité : exercices (démo)',
    'B303',
    'TD',
    'PLANIFIEE',
  ),
  demoSeance(
    'demo-seance-4',
    'demo-ens-bdd',
    '2026-10-15T13:00:00.000Z',
    '14:00',
    '16:00',
    'Modèle relationnel et normalisation (démo)',
    'A001',
    'CM',
    'REALISEE',
  ),
  demoSeance(
    'demo-seance-5',
    'demo-ens-bdd',
    '2026-10-17T13:00:00.000Z',
    '14:00',
    '16:00',
    'SQL advanced : jointures et requêtes (démo)',
    'A001',
    'TP',
    'ANNULEE',
  ),
  demoSeance(
    'demo-seance-6',
    'demo-ens-reseau',
    '2026-10-22T08:00:00.000Z',
    '08:30',
    '10:00',
    null,
    'C204',
    'CM + TD',
    'PLANIFIEE',
  ),
];

export const DEMO_JOURNAL_AUDIT: JournalAuditEntry[] = [
  {
    id: 'demo-audit-1',
    seanceId: 'demo-seance-1',
    enseignementId: 'demo-ens-algo',
    utilisateurId: DEMO_ENSEIGNANT,
    action: 'CREATION',
    motif: null,
    statutAvant: null,
    statutApres: 'PLANIFIEE',
    valeursAvant: null,
    valeursApres: { heureDebut: '08:30', heureFin: '10:00', salle: 'B303', typeSeance: 'CM' },
    enseignantId: DEMO_ENSEIGNANT,
    mentionId: 'Mention Informatique (démo)',
    cycle: 'LICENCE',
    parcours: 'Informatique',
    createdAt: '2026-10-12T08:00:00.000Z',
  },
  {
    id: 'demo-audit-2',
    seanceId: 'demo-seance-1',
    enseignementId: 'demo-ens-algo',
    utilisateurId: DEMO_ENSEIGNANT,
    action: 'DECLARATION_REALISEE',
    motif: null,
    statutAvant: 'PLANIFIEE',
    statutApres: 'REALISEE',
    valeursAvant: { salle: null, typeSeance: null },
    valeursApres: { salle: 'B303', typeSeance: 'CM' },
    enseignantId: DEMO_ENSEIGNANT,
    mentionId: 'Mention Informatique (démo)',
    cycle: 'LICENCE',
    parcours: 'Informatique',
    createdAt: '2026-10-19T10:05:00.000Z',
  },
  {
    id: 'demo-audit-3',
    seanceId: 'demo-seance-5',
    enseignementId: 'demo-ens-bdd',
    utilisateurId: DEMO_ENSEIGNANT,
    action: 'ANNULATION',
    motif: 'Salle indisponible (démo)',
    statutAvant: 'PLANIFIEE',
    statutApres: 'ANNULEE',
    valeursAvant: null,
    valeursApres: null,
    enseignantId: DEMO_ENSEIGNANT,
    mentionId: 'Mention Informatique (démo)',
    cycle: 'LICENCE',
    parcours: 'Informatique',
    createdAt: '2026-10-17T09:00:00.000Z',
  },
];

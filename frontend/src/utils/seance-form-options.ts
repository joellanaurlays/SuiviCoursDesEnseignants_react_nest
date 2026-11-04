/**
 * Options partagées du formulaire de séance (déclaration et modification).
 *
 * Le type de séance est purement descriptif : il n'entre dans AUCUN calcul
 * d'heures. La salle est un code saisi selon la convention libre de l'EMIT
 * (ex. B303, A001, C204) : aucune gestion de réservation ni de conflit.
 */

/** Valeurs de type de séance acceptées par le backend. */
export const TYPES_SEANCE = [
  'CM',
  'TD',
  'TP',
  'CM + TD',
  'CM + TP',
  'TD + TP',
  'Autre',
] as const;

export type TypeSeance = (typeof TYPES_SEANCE)[number];

/** Libellés lisibles des types de séance. */
export const LIBELLES_TYPE_SEANCE: Record<string, string> = {
  CM: 'CM — Cours magistral',
  TD: 'TD — Travaux dirigés',
  TP: 'TP — Travaux pratiques',
  'CM + TD': 'CM + TD',
  'CM + TP': 'CM + TP',
  'TD + TP': 'TD + TP',
  Autre: 'Autre',
};

/** Options prêtes à l'affichage d'une liste déroulante de type de séance. */
export const OPTIONS_TYPE_SEANCE = TYPES_SEANCE.map((value) => ({
  value,
  label: LIBELLES_TYPE_SEANCE[value] ?? value,
}));

/** Exemples de salles affichés en aide à la saisie (saisie libre conservée). */
export const PLACEHOLDER_SALLE = 'Ex. : B303, A001, C204';

/** Longueur minimale du contenu enseigné saisi lors de la réalisation. */
export const CONTENU_MIN = 3;

/** Format horaire attendu (identique à la validation backend). */
const HEURE_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;

/** Valeurs du formulaire de réalisation d'une séance. */
export interface ChampsRealisation {
  dateSeance: string;
  heureDebut: string;
  heureFin: string;
  contenuEnseigne: string;
  salle: string;
  typeSeance: string;
}

/** Erreurs de validation par champ du formulaire de réalisation. */
export interface ErreursRealisation {
  dateSeance?: string;
  heureDebut?: string;
  heureFin?: string;
  contenuEnseigne?: string;
  salle?: string;
  typeSeance?: string;
}

/**
 * Validation du formulaire de réalisation, jouée AVANT tout appel API.
 *
 * La salle et le type de séance sont obligatoires pour marquer une séance
 * comme réalisée (le backend revalide de toute façon ces règles). La durée
 * n'est jamais saisie : elle est recalculée côté serveur.
 */
export function validerRealisation(champs: ChampsRealisation): ErreursRealisation {
  const erreurs: ErreursRealisation = {};

  if (!champs.dateSeance) {
    erreurs.dateSeance = 'La date effective est obligatoire.';
  }

  if (!champs.heureDebut) {
    erreurs.heureDebut = "L'heure de début est obligatoire.";
  } else if (!HEURE_RE.test(champs.heureDebut)) {
    erreurs.heureDebut = 'Format attendu : HH:mm.';
  }

  if (!champs.heureFin) {
    erreurs.heureFin = "L'heure de fin est obligatoire.";
  } else if (!HEURE_RE.test(champs.heureFin)) {
    erreurs.heureFin = 'Format attendu : HH:mm.';
  }

  if (!erreurs.heureDebut && !erreurs.heureFin && champs.heureFin <= champs.heureDebut) {
    erreurs.heureFin = "L'heure de fin doit être postérieure à l'heure de début.";
  }

  if (!champs.salle.trim()) {
    erreurs.salle = 'La salle est obligatoire pour marquer la séance comme réalisée.';
  }

  if (!champs.typeSeance.trim()) {
    erreurs.typeSeance = 'Le type de séance est obligatoire pour marquer la séance comme réalisée.';
  } else if (!(TYPES_SEANCE as readonly string[]).includes(champs.typeSeance)) {
    erreurs.typeSeance = 'Type de séance non reconnu.';
  }

  if (champs.contenuEnseigne.trim().length < CONTENU_MIN) {
    erreurs.contenuEnseigne = `Le contenu enseigné est obligatoire (${CONTENU_MIN} caractères minimum).`;
  }

  return erreurs;
}

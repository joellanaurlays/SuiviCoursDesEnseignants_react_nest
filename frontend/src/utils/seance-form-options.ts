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

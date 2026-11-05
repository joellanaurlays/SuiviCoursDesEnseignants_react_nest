/**
 * TRACABILITÉ DES ACTIONS SUR LES SÉANCES (journal d'audit)
 * ========================================================
 * Toute action métier significative sur une séance est journalisée :
 * création / déclaration directe d'une réalisation, réalisation, annulation,
 * modification, correction d'une séance déjà réalisée et suppression
 * exceptionnelle. La trace est écrite dans la MÊME transaction que l'action
 * métier afin qu'aucune opération ne puisse être enregistrée sans son audit.
 *
 * Les valeurs de cet enum correspondent EXACTEMENT à l'enum Prisma
 * `ActionAuditSeance` (source unique côté base de données).
 */
export enum ActionAuditSeance {
  /** Création d'une séance planifiée (ou annulée) via le formulaire. */
  CREATION = 'CREATION',
  /** Déclaration directe d'une séance déjà réalisée (cas A). */
  DECLARATION_REALISEE = 'DECLARATION_REALISEE',
  /** Réalisation d'une séance initialement planifiée. */
  REALISATION = 'REALISATION',
  /** Annulation d'une séance planifiée. */
  ANNULATION = 'ANNULATION',
  /** Modification « ordinaire » des informations d'une séance planifiée. */
  MODIFICATION = 'MODIFICATION',
  /** Correction exceptionnelle d'une séance déjà réalisée. */
  CORRECTION = 'CORRECTION',
  /** Suppression exceptionnelle (hors séance réalisée), trace conservée. */
  SUPPRESSION = 'SUPPRESSION',
}

/**
 * Instantané des champs métier d'une séance, conservé avant/après une action.
 * Les valeurs sont stockées telles quelles (JSON) pour comprendre ce qui a
 * changé, sans dépendre de l'état courant de la séance.
 */
export interface ValeursSeanceAudit {
  dateSeance?: string | null;
  heureDebut?: string | null;
  heureFin?: string | null;
  duree?: number | null;
  contenuEnseigne?: string | null;
  salle?: string | null;
  typeSeance?: string | null;
  statut?: string | null;
}

/** Périmètre figé au moment de l'action (sert au contrôle d'accès à l'historique). */
export interface PerimetreAudit {
  /** Null si aucun enseignant n'était affecté au moment de l'action. */
  enseignantId: string | null;
  mentionId: string;
  cycle: string;
  parcours: string;
}

/** Construit l'instantané de valeurs d'une séance à partir de son enregistrement. */
export function instantaneSeance(seance: {
  dateSeance: Date | string;
  heureDebut: string;
  heureFin: string;
  duree: number;
  contenuEnseigne: string | null;
  salle?: string | null;
  typeSeance?: string | null;
  statut: string;
}): ValeursSeanceAudit {
  const date = seance.dateSeance instanceof Date ? seance.dateSeance : new Date(seance.dateSeance);
  return {
    dateSeance: Number.isNaN(date.getTime()) ? null : date.toISOString(),
    heureDebut: seance.heureDebut,
    heureFin: seance.heureFin,
    duree: seance.duree,
    contenuEnseigne: seance.contenuEnseigne,
    salle: seance.salle ?? null,
    typeSeance: seance.typeSeance ?? null,
    statut: seance.statut,
  };
}

/**
 * Ne conserve que les champs qui ont réellement changé entre deux instantanés.
 * Un champ absent des deux côtés n'apparaît pas ; un champ identique est omis.
 */
export function champsModifies(
  avant: ValeursSeanceAudit,
  apres: ValeursSeanceAudit,
): { avant: ValeursSeanceAudit; apres: ValeursSeanceAudit } {
  const champs: (keyof ValeursSeanceAudit)[] = [
    'dateSeance',
    'heureDebut',
    'heureFin',
    'duree',
    'contenuEnseigne',
    'salle',
    'typeSeance',
    'statut',
  ];

  const avantModifie: Record<string, unknown> = {};
  const apresModifie: Record<string, unknown> = {};

  for (const champ of champs) {
    const valeurAvant = avant[champ] ?? null;
    const valeurApres = apres[champ] ?? null;
    if (valeurAvant !== valeurApres) {
      avantModifie[champ] = valeurAvant;
      apresModifie[champ] = valeurApres;
    }
  }

  return {
    avant: avantModifie as ValeursSeanceAudit,
    apres: apresModifie as ValeursSeanceAudit,
  };
}

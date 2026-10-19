/**
 * RÈGLE MÉTIER OFFICIELLE DU SUIVI DES ENSEIGNEMENTS
 * ==================================================
 * Heures réalisées = somme des durées des séances dont le statut = REALISEE
 * Heures restantes  = max(volumePrevu - heuresRealisees, 0)
 * Progression       = (heuresRealisees / volumePrevu) * 100, limitée à 100
 * Durée d'une séance = heureFin - heureDebut (recalculée côté serveur)
 *
 * ÉTAT
 * ----
 *   heures = 0                          -> NON_COMMENCE
 *   0 < heures < volumePrevu            -> EN_COURS
 *   heures >= volumePrevu               -> TERMINE
 *
 * CLÔTURE ANTICIPÉE
 * -----------------
 * Exception métier : l'enseignant a terminé le contenu pédagogique avant
 * d'atteindre le volume horaire prévu. Il clôture lui-même son enseignement
 * en fournissant un MOTIF OBLIGATOIRE. Aucune validation par un responsable,
 * aucun statut de demande, aucun circuit de décision.
 *
 * Règle centrale : la progression reste TOUJOURS calculée sur les heures
 * réellement effectuées. Une clôture anticipée ne fait donc JAMAIS passer la
 * progression de 90 % à 100 % ; elle modifie uniquement l'état final.
 *
 *   volume atteint                    -> typeCloture = NORMALE
 *   clôture anticipée                 -> etat = TERMINE, typeCloture = ANTICIPEE
 *
 * Exemple : 30 h prévues, 27 h réalisées, clôture anticipée
 *           -> 27 h réalisées, 3 h restantes, 90 %, TERMINE
 *
 * Cette logique est l'UNIQUE source de vérité : aucune autre implémentation
 * du calcul de progression ne doit exister ailleurs dans le projet.
 */

export enum EtatEnseignement {
  NON_COMMENCE = 'NON_COMMENCE',
  EN_COURS = 'EN_COURS',
  TERMINE = 'TERMINE',
}

export enum StatutSeance {
  PLANIFIEE = 'PLANIFIEE',
  REALISEE = 'REALISEE',
  ANNULEE = 'ANNULEE',
}

/**
 * Mode de clôture d'un enseignement terminé.
 * NORMALE  : le volume horaire prévu a été entièrement atteint.
 * ANTICIPEE : l'enseignant a clôturé avant le volume, avec un motif.
 */
export const TypeCloture = {
  NORMALE: 'NORMALE',
  ANTICIPEE: 'ANTICIPEE',
} as const;
export type TypeCloture = (typeof TypeCloture)[keyof typeof TypeCloture];

/** Valeurs du filtre « clôture » exposé sur le suivi des enseignements. */
export const FiltreCloture = {
  NORMALE: 'NORMALE',
  ANTICIPEE: 'ANTICIPEE',
} as const;
export type FiltreCloture = (typeof FiltreCloture)[keyof typeof FiltreCloture];

export interface CalculSuivi {
  heuresRealisees: number;
  heuresRestantes: number;
  progression: number;
  etat: EtatEnseignement;
  /** Vrai si l'enseignement a été clôturé avant l'atteinte du volume prévu. */
  clotureAnticipee: boolean;
  /** NORMALE / ANTICIPEE si l'enseignement est terminé, sinon null. */
  typeCloture: TypeCloture | null;
}

export interface SeancePourCalcul {
  duree: number;
  statut: string;
}

/**
 * Durée d'une séance en heures, calculée depuis les horaires de début et fin.
 * Rejette les horaires mal formés ou une fin antérieure/égale au début.
 */
export function calculerDureeSeance(heureDebut: string, heureFin: string): number {
  if (!/^\d{1,2}:\d{2}$/.test(heureDebut) || !/^\d{1,2}:\d{2}$/.test(heureFin)) {
    throw new Error("Format d'heure invalide (format attendu : HH:mm)");
  }

  const [debutH, debutM] = heureDebut.split(':').map(Number);
  const [finH, finM] = heureFin.split(':').map(Number);
  const dateDebut = new Date(0, 0, 0, debutH, debutM, 0, 0);
  const dateFin = new Date(0, 0, 0, finH, finM, 0, 0);

  const dureeEnHeures = (dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60);
  if (dureeEnHeures <= 0) {
    throw new Error('heureFin doit être postérieure à heureDebut');
  }

  return dureeEnHeures;
}

/**
 * Convertit un horaire « HH:mm » en nombre de minutes depuis minuit.
 * Rejette les formats invalides pour ne jamais comparer des heures mal saisies.
 */
export function heureEnMinutes(heure: string): number {
  if (!/^\d{1,2}:\d{2}$/.test(heure)) {
    throw new Error("Format d'heure invalide (format attendu : HH:mm)");
  }
  const [h, m] = heure.split(':').map(Number);
  if (h > 23 || m > 59) {
    throw new Error("Format d'heure invalide (format attendu : HH:mm)");
  }
  return h * 60 + m;
}

/**
 * Deux plages horaires se chevauchent-elles ? Les bornes sont semi-ouvertes :
 * une séance qui commence exactement quand une autre se termine ne chevauche
 * pas.
 */
export function plagesHorairesSeChevauchent(
  debutA: string,
  finA: string,
  debutB: string,
  finB: string,
): boolean {
  return heureEnMinutes(debutA) < heureEnMinutes(finB) && heureEnMinutes(debutB) < heureEnMinutes(finA);
}

/**
 * Calcule le suivi complet d'un enseignement selon la règle métier officielle.
 * Seules les séances REALISEE comptent dans le volume horaire réalisé.
 *
 * @param volumePrevu       Volume horaire prévu de l'enseignement.
 * @param seances           Séances de l'enseignement (source de vérité des heures).
 * @param clotureAnticipee  L'enseignant a-t-il clôturé son enseignement avant
 *                          le volume ? (colonne `Enseignement.clotureAnticipee`)
 */
export function calculerSuivi(
  volumePrevu: number,
  seances: readonly SeancePourCalcul[],
  clotureAnticipee = false,
): CalculSuivi {
  const heuresRealisees = seances
    .filter((seance) => seance.statut === StatutSeance.REALISEE)
    .reduce((total, seance) => total + seance.duree, 0);

  const heuresRestantes = Math.max(volumePrevu - heuresRealisees, 0);

  let progression = 0;
  if (volumePrevu > 0) {
    progression = (heuresRealisees / volumePrevu) * 100;
    progression = Math.min(progression, 100);
    progression = Math.round(progression * 100) / 100;
  }

  const volumeAtteint = heuresRealisees >= volumePrevu;

  let etat: EtatEnseignement;
  if (heuresRealisees === 0) {
    etat = EtatEnseignement.NON_COMMENCE;
  } else if (clotureAnticipee) {
    // Exception métier : l'enseignant a terminé le contenu pédagogique.
    // Conservée même si des séances sont ajoutées ensuite.
    etat = EtatEnseignement.TERMINE;
  } else if (volumeAtteint) {
    etat = EtatEnseignement.TERMINE;
  } else {
    etat = EtatEnseignement.EN_COURS;
  }

  const typeCloture: TypeCloture | null =
    etat === EtatEnseignement.TERMINE
      ? clotureAnticipee
        ? TypeCloture.ANTICIPEE
        : TypeCloture.NORMALE
      : null;

  return {
    heuresRealisees,
    heuresRestantes,
    progression,
    etat,
    clotureAnticipee: typeCloture === TypeCloture.ANTICIPEE,
    typeCloture,
  };
}

import { Prisma } from '@prisma/client';
import {
  StatutSeance as StatutSeanceEnum,
  calculerSuivi,
  EtatEnseignement,
  TypeCloture,
} from './calcul-suivi';

/** Colonnes d'enseignement nécessaires au calcul du suivi. */
export const seanceCalculSelect = {
  duree: true,
  statut: true,
} satisfies Prisma.SeanceSelect;

/** Enseignement enrichi de ses séances (source de vérité du suivi). */
export type EnseignementSuiviLigne = Prisma.EnseignementGetPayload<{
  include: { seances: true };
}>;

/** Structure de suivi unique renvoyée par l'API (voir domaine calcul-suivi). */
export interface SuiviEnseignement {
  id: string;
  matiereId: string;
  enseignantId: string;
  mentionId: string;
  cycle: string;
  niveauId: string;
  parcours: string;
  semestreId: string;
  anneeUniversitaireId: string;
  volumePrevu: number;
  matiere: string;
  enseignant: string;
  mention: string;
  niveau: string;
  semestre: string;
  anneeUniversitaire: string;
  heuresRealisees: number;
  heuresRestantes: number;
  progression: number;
  etat: EtatEnseignement;
  /** Enseignement terminé avant le volume prévu, sur décision de l'enseignant. */
  clotureAnticipee: boolean;
  /** NORMALE / ANTICIPEE si l'enseignement est terminé, sinon null. */
  typeCloture: TypeCloture | null;
  /** Motif pédagogique de la clôture anticipée (null sinon). */
  motifCloture: string | null;
  /** Date de la clôture anticipée (null sinon). */
  dateCloture: Date | null;
  nombreSeancesRealisees: number;
  derniereSeanceRealisee: Date | null;
  enRetard: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Nombre de jours sans séance réalisée au-delà duquel un enseignement est en retard. */
const JOURS_RETARD = 14;

/**
 * Construit la structure de suivi d'un enseignement à partir de ses séances
 * réelles et de sa clôture anticipée éventuelle.
 *
 * Point d'entrée UNIQUE du suivi côté backend : les use-cases, le service
 * d'enseignements et les statistiques passent tous par cette fonction, ce qui
 * interdit l'apparition d'une deuxième logique de calcul.
 */
export function construireSuivi(enseignement: EnseignementSuiviLigne): SuiviEnseignement {
  const suivi = calculerSuivi(
    enseignement.volumePrevu,
    enseignement.seances,
    enseignement.clotureAnticipee,
  );

  const seancesRealisees = enseignement.seances.filter(
    (seance) => seance.statut === StatutSeanceEnum.REALISEE,
  );

  const derniereSeanceRealisee =
    seancesRealisees.length > 0
      ? seancesRealisees.reduce((latest, current) =>
          new Date(latest.dateSeance) > new Date(current.dateSeance) ? latest : current,
        ).dateSeance
      : null;

  return {
    id: enseignement.id,
    matiereId: enseignement.matiereId,
    enseignantId: enseignement.enseignantId,
    mentionId: enseignement.mentionId,
    cycle: enseignement.cycle,
    niveauId: enseignement.niveauId,
    parcours: enseignement.parcours,
    semestreId: enseignement.semestreId,
    anneeUniversitaireId:enseignement.anneeUniversitaireId,
    volumePrevu: enseignement.volumePrevu,
    matiere: enseignement.matiereId,
    enseignant: enseignement.enseignantId,
    mention: enseignement.mentionId,
    niveau: enseignement.niveauId,
    semestre: enseignement.semestreId,
    anneeUniversitaire: enseignement.anneeUniversitaireId,
    heuresRealisees: suivi.heuresRealisees,
    heuresRestantes: suivi.heuresRestantes,
    progression: suivi.progression,
    etat: suivi.etat,
    clotureAnticipee: suivi.clotureAnticipee,
    typeCloture: suivi.typeCloture,
    motifCloture: suivi.clotureAnticipee ? enseignement.motifCloture : null,
    dateCloture: suivi.clotureAnticipee ? enseignement.dateCloture : null,
    nombreSeancesRealisees: seancesRealisees.length,
    derniereSeanceRealisee,
    enRetard: estEnRetard(suivi.etat, derniereSeanceRealisee),
    createdAt: enseignement.createdAt,
    updatedAt: enseignement.updatedAt,
  };
}

/** Un enseignement en cours sans séance réalisée depuis plus de 14 jours est en retard. */
export function estEnRetard(etat: EtatEnseignement, derniereSeanceRealisee: Date | null): boolean {
  if (etat !== 'EN_COURS' || !derniereSeanceRealisee) {
    return false;
  }
  const jours = Math.ceil(
    Math.abs(new Date().getTime() - new Date(derniereSeanceRealisee).getTime()) / (1000 * 60 * 60 * 24),
  );
  return jours > JOURS_RETARD;
}

// Les enums métier sont définis dans le domaine (source de vérité unique).
import { EtatEnseignement, StatutSeance, TypeCloture } from '../domain/calcul-suivi';
export { EtatEnseignement, StatutSeance, TypeCloture } from '../domain/calcul-suivi';

export class Enseignement {
  id?: string;
  matiereId: string;
  enseignantId: string;
  mentionId: string;
  parcours: string;
  cycle: string;
  niveauId: string;
  semestreId: string;
  anneeUniversitaireId: string;
  volumePrevu: number;
  /** Clôture anticipée décidée par l'enseignant avec un motif obligatoire. */
  clotureAnticipee: boolean;
  motifCloture: string | null;
  dateCloture: Date | null;
  createdAt?: Date;
  updatedAt?: Date;

  seances: Seance[];
}

export interface Seance {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  enseignementId: string;
  dateSeance: Date;
  heureDebut: string;
  heureFin: string;
  duree: number;
  contenuEnseigne: string | null;
  statut: StatutSeance;
}

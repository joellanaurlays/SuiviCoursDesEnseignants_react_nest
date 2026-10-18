import { EtatEnseignement, StatutSeance, Cycle } from '../enums/types';

export interface Seance {
  id?: string;
  enseignementId: string;
  date: Date;
  heureDebut: string; // format 'HH:mm'
  heureFin: string; // format 'HH:mm'
  duree: number;
  contenuEnseigne?: string;
  statut: StatutSeance;
}

export interface Enseignement {
  id?: string;
  matiereId: string;
  enseignantId: string;
  mentionId: string;
  cycle: Cycle;
  niveauId: string;
  parcours: string;
  semestreId: string;
  anneeUniversitaireId: string;
  volumePrevu: number;
  
  // Relations
  seances?: Seance[];
}


export interface EnseignementStats {
  volumePrevu: number;
  heuresRealisees: number;
  progression: number; // en pourcentage, max 100
  etat: EtatEnseignement;
  nombreSeancesRealisees: number;
  derniereSeanceRealisee?: Date;
}

export interface HistoriqueSeance {
  date: Date;
  duree: number;
  contenuEnseigne?: string;
}

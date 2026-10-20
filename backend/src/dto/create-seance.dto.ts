import { DayOfWeek } from '../entities/creneau-horaire.entity';
import { SeanceStatut, SessionType } from '../entities/seance-planifiee.entity';

export interface CreateSeanceDto {
  emploiDuTempsId?: number;
  enseignementId: number;
  codeMatiere: string;
  matiereNom: string;
  typeSeance: SessionType;
  enseignantId: number;
  nomEnseignant: string;
  niveauId: number;
  codeNiveau: string;
  mentionNom: string;
  semestreNom?: string;
  salleId: number;
  nomSalle?: string;
  creneauId: number;
  jourSemaine: DayOfWeek;
  heureDebut: string;
  heureFin: string;
  dateSeance: string; // YYYY-MM-DD
  statut?: SeanceStatut;
  notes?: string;
  forceSaveWithConflict?: boolean;
}

export interface UpdateSeanceStatusDto {
  statut: SeanceStatut;
  notes?: string;
}

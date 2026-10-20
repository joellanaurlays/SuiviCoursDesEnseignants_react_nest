import { DayOfWeek } from '../entities/creneau-horaire.entity';

export interface CheckConflictDto {
  seanceId?: number; // Ignorer la séance en cours de modification
  salleId: number;
  enseignantId: number;
  niveauId: number;
  codeNiveau: string;
  mentionNom: string;
  dateSeance: string;
  creneauId: number;
  jourSemaine: DayOfWeek;
  heureDebut: string;
  heureFin: string;
  effectifPrevu?: number;
}

export type ConflictSeverity = 'ERREUR_BLOQUANTE' | 'AVERTISSEMENT';
export type ConflictType = 
  | 'ENSEIGNANT_OCCUPE' 
  | 'SALLE_OCCUPEE' 
  | 'NIVEAU_OCCUPE' 
  | 'CAPACITE_DEPASSEE' 
  | 'CONTRAINTE_VIOLEE';

export interface ConflictDetailDto {
  id: string;
  type: ConflictType;
  gravite: ConflictSeverity;
  titre: string;
  message: string;
  entitesEnConflit: {
    seanceIdExistante?: number;
    matiereConflit?: string;
    details?: string;
  };
  resolutionSuggeree?: string;
}

export interface ConflictResponseDto {
  hasConflict: boolean;
  hasBlockingError: boolean;
  canSave: boolean;
  conflicts: ConflictDetailDto[];
  alternativeRooms?: Array<{
    id: number;
    nom: string;
    capacite: number;
    typeSalle: string;
  }>;
}

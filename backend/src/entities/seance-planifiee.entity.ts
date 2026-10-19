import { DayOfWeek } from './creneau-horaire.entity';

export type SeanceStatut = 
  | 'BROUILLON' 
  | 'EN_CONFLIT' 
  | 'VALIDE' 
  | 'PLANIFIE' 
  | 'REALISE' 
  | 'REPROGRAMME' 
  | 'ANNULE';

export type SessionType = 'CM' | 'TD' | 'TP';

/**
 * Modélisation de l'entité SeancePlanifiee (TypeORM / PostgreSQL)
 * Table: 'seance_planifiee'
 * Fait le lien spatio-temporel entre l'enseignement, l'enseignant, la salle et le créneau.
 */
export class SeancePlanifieeEntity {
  id!: number;
  emploiDuTempsId!: number;
  enseignementId!: number;
  codeMatiere!: string;
  matiereNom!: string;
  typeSeance!: SessionType;
  enseignantId!: number;
  nomEnseignant!: string;
  niveauId!: number;
  codeNiveau!: string;
  mentionNom!: string;
  semestreNom!: string;
  salleId!: number;
  nomSalle!: string;
  creneauId!: number;
  jourSemaine!: DayOfWeek;
  heureDebut!: string;
  heureFin!: string;
  dateSeance!: string; // YYYY-MM-DD
  statut!: SeanceStatut;
  notes?: string;

  constructor(partial?: Partial<SeancePlanifieeEntity>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  isDraft(): boolean {
    return this.statut === 'BROUILLON';
  }

  isValidated(): boolean {
    return this.statut === 'VALIDE' || this.statut === 'PLANIFIE';
  }
}

export type RoomType = 'AMPHI' | 'SALLE_TP' | 'SALLE_TD' | 'LABO';
export type RoomStatus = 'ACTIF' | 'MAINTENANCE' | 'DESACTIVE';

export interface SalleEntity {
  id: number;
  nom: string;
  capacite: number;
  typeSalle: RoomType;
  batiment: string;
  equipements: string[];
  estDisponible: boolean;
  statut: RoomStatus;
  remarques?: string;
}

export type DayOfWeek = 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi';
export type TimeSlotPeriod = 'Matin' | 'Apres-midi';

export interface CreneauHoraireEntity {
  id: number;
  jourSemaine: DayOfWeek;
  heureDebut: string; // "08:00"
  heureFin: string;   // "10:00"
  dureeMinutes: number;
  plage: TimeSlotPeriod;
  libelle: string;
  actif: boolean;
}

export type AcademicLevel = 'L1' | 'L2' | 'L3' | 'M1' | 'M2';
export type MentionCode = 'Informatique' | 'Management' | 'ICM';

export interface EnseignementEntity {
  id: number;
  codeMatiere: string;
  nomMatiere: string;
  enseignantId: number;
  nomEnseignant: string;
  enseignantEmail?: string;
  niveauId: number;
  codeNiveau: AcademicLevel;
  mentionNom: MentionCode;
  semestreNom: string; // 'S1', 'S2', 'S3', 'S4', 'S5', 'S6'
  effectifEtudiants: number;
  volumeHoraireTotal: number; // ex: 30h
  heuresPlanifiees: number;
  heuresRealisees: number;
  typeSalleRequis: RoomType;
  couleurTag?: string;
}

export type SeanceStatut =
  | 'BROUILLON'
  | 'EN_CONFLIT'
  | 'VALIDE'
  | 'PLANIFIE'
  | 'REALISE'
  | 'REPROGRAMME'
  | 'ANNULE';

export type ConflictSeverity = 'ERREUR_BLOQUANTE' | 'AVERTISSEMENT';
export type ConflictType =
  | 'ENSEIGNANT_OCCUPE'
  | 'SALLE_OCCUPEE'
  | 'NIVEAU_OCCUPE'
  | 'CAPACITE_DEPASSEE'
  | 'CONTRAINTE_VIOLEE';

export interface ConflictDetail {
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

export interface SeancePlanifieeEntity {
  id: number;
  emploiDuTempsId: number;
  enseignementId: number;
  codeMatiere: string;
  matiereNom: string;
  typeSeance: 'CM' | 'TD' | 'TP';
  enseignantId: number;
  nomEnseignant: string;
  niveauId: number;
  codeNiveau: AcademicLevel;
  mentionNom: MentionCode;
  semestreNom: string;
  salleId: number;
  nomSalle: string;
  creneauId: number;
  jourSemaine: DayOfWeek;
  heureDebut: string;
  heureFin: string;
  dateSeance: string; // YYYY-MM-DD
  statut: SeanceStatut;
  conflits?: ConflictDetail[];
  notes?: string;
}

export interface EmploiDuTempsEntity {
  id: number;
  titre: string;
  semestreNom: string;
  mentionNom: MentionCode | 'Toutes';
  anneeUniversitaire: string;
  semaineDu: string; // date début semaine
  dateMiseAJour: string;
  estValide: boolean;
  estPublie: boolean;
  version: number;
}

export type ConstraintTargetType = 'ENSEIGNANT' | 'SALLE' | 'NIVEAU' | 'GLOBAL';
export type ConstraintPriority = 'BLOQUANTE' | 'PREFERENTIELLE';

export interface ContraintePlanificationEntity {
  id: number;
  titre: string;
  typeContrainte: ConstraintTargetType;
  niveauPriorite: ConstraintPriority;
  cibleId?: number;
  cibleNom: string;
  description: string;
  regle: {
    jourSemaine?: DayOfWeek;
    creneauId?: number;
    plageInterdite?: string;
    maxHeuresJour?: number;
    equipementExige?: string;
    typeSalleExige?: RoomType;
  };
  active: boolean;
}

export type UserRole =
  | 'CHEF_SCOLARITE'
  | 'ADMINISTRATEUR'
  | 'RESPONSABLE_MENTION'
  | 'ENSEIGNANT'
  | 'ETUDIANT';

export interface CurrentUserSession {
  id: number;
  nom: string;
  role: UserRole;
  mentionResponsable?: MentionCode;
  enseignantId?: number;
}

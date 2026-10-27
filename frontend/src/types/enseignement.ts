export type Cycle = 'LICENCE' | 'MASTER';

export type EtatEnseignement = 'NON_COMMENCE' | 'EN_COURS' | 'TERMINE';

export type StatutSeance = 'PLANIFIEE' | 'REALISEE' | 'ANNULEE';

/** Mode de clôture d'un enseignement terminé. */
export type TypeCloture = 'NORMALE' | 'ANTICIPEE';

/** Valeurs du filtre « clôture » du suivi. */
export type FiltreCloture = 'NORMALE' | 'ANTICIPEE';

export type UserRole =
  | 'ENSEIGNANT'
  | 'SCOLARITE'
  | 'RESPONSABLE_MENTION'
  | 'ADMINISTRATEUR';

export interface Enseignement {
  id: string;
  matiereId: string;
  enseignantId: string;
  mentionId: string;
  cycle: Cycle;
  niveauId: string;
  parcours: string;
  semestreId: string;
  anneeUniversitaireId: string;
  volumePrevu: number;
  createdAt: string;
  updatedAt: string;
}

export interface EnseignementAvecSuivi extends Enseignement {
  heuresRealisees: number;
  heuresRestantes: number;
  progression: number;
  etat: EtatEnseignement;
  matiere: string;
  enseignant: string;
  mention: string;
  niveau: string;
  semestre: string;
  anneeUniversitaire: string;
  seances?: Seance[];
}

export interface SuiviEnseignement {
  id: string;
  matiereId: string;
  enseignantId: string;
  mentionId: string;
  cycle: Cycle;
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
  /** Enseignement terminé avant le volume prévu, par l'enseignant lui-même. */
  clotureAnticipee: boolean;
  /** NORMALE / ANTICIPEE si l'enseignement est terminé, sinon null. */
  typeCloture: TypeCloture | null;
  /** Motif pédagogique de la clôture anticipée (null sinon). */
  motifCloture: string | null;
  /** Date de la clôture anticipée (null sinon). */
  dateCloture: string | null;
  nombreSeancesRealisees: number;
  derniereSeanceRealisee: string | null;
  enRetard: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Suivi enrichi du droit d'action, renvoyé par GET /enseignements/:id/cloture. */
export interface DetailCloture extends SuiviEnseignement {
  peutCloturer: boolean;
}

export interface Seance {
  id: string;
  enseignementId: string;
  dateSeance: string;
  heureDebut: string;
  heureFin: string;
  duree: number;
  contenuEnseigne: string | null;
  salle?: string | null;
  typeSeance?: string | null;
  statut: StatutSeance;
  createdAt: string;
  updatedAt: string;
  enseignement?: Enseignement;
  /**
   * Capacités calculées par le backend pour l'utilisateur courant.
   * Présentes uniquement sur le détail (GET /seances/:id) : le frontend ne
   * doit jamais s'y fier seul, le backend revalide chaque action.
   */
  peutRealiser?: boolean;
  peutAnnuler?: boolean;
  /** Correction exceptionnelle d'une séance déjà réalisée. */
  peutCorriger?: boolean;
}

/** Types d'action consignés dans le journal d'audit des séances. */
export type ActionAuditSeance =
  | 'CREATION'
  | 'DECLARATION_REALISEE'
  | 'REALISATION'
  | 'ANNULATION'
  | 'MODIFICATION'
  | 'CORRECTION'
  | 'SUPPRESSION';

/** Instantané des champs métier d'une séance dans le journal d'audit. */
export interface ValeursSeanceAudit {
  dateSeance?: string | null;
  heureDebut?: string | null;
  heureFin?: string | null;
  duree?: number | null;
  contenuEnseigne?: string | null;
  salle?: string | null;
  typeSeance?: string | null;
  statut?: StatutSeance | null;
}

export interface JournalAuditEntry {
  id: string;
  seanceId: string;
  enseignementId: string;
  utilisateurId: string;
  action: ActionAuditSeance;
  motif: string | null;
  statutAvant: StatutSeance | null;
  statutApres: StatutSeance | null;
  valeursAvant: ValeursSeanceAudit | null;
  valeursApres: ValeursSeanceAudit | null;
  enseignantId: string;
  mentionId: string;
  cycle: Cycle;
  parcours: string;
  createdAt: string;
}

export interface SuiviQuery {
  enseignant?: string;
  matiere?: string;
  mention?: string;
  parcours?: string;
  cycle?: Cycle;
  niveau?: string;
  semestre?: string;
  anneeUniversitaire?: string;
  etat?: EtatEnseignement;
  cloture?: FiltreCloture;
  search?: string;
}

export interface SuiviStatistiques {
  totaux: {
    enseignements: number;
    volumePrevu: number;
    heuresRealisees: number;
    heuresRestantes: number;
    progression: number;
  };
  etats: {
    nonCommences: number;
    enCours: number;
    termines: number;
  };
  clotures: {
    terminesParVolumeAtteint: number;
    terminesParClotureAnticipee: number;
  };
}

export interface CreateSeancePayload {
  enseignementId: string;
  dateSeance: string;
  heureDebut: string;
  heureFin: string;
  contenuEnseigne?: string;
  salle?: string;
  typeSeance?: string;
  statut?: StatutSeance;
}

/** Informations observées transmises lors de la réalisation d'une séance. */
export interface RealiserSeancePayload {
  dateSeance?: string;
  heureDebut?: string;
  heureFin?: string;
  contenuEnseigne?: string;
  salle?: string;
  typeSeance?: string;
}

/** Justification facultative de l'annulation (conservée dans le journal d'audit). */
export interface AnnulerSeancePayload {
  motif?: string;
}

/** Correction exceptionnelle d'une séance réalisée (motif tracé). */
export interface CorrigerSeancePayload {
  dateSeance?: string;
  heureDebut?: string;
  heureFin?: string;
  contenuEnseigne?: string;
  salle?: string;
  typeSeance?: string;
  motif?: string;
}

export interface DashboardResponse {
  stats: {
    totalEnseignements: number;
    totalSeancesRealisees: number;
    totalSeancesPreves: number;
    totalHeuresRealisees: number;
    totalVolumePrevu: number;
    averageProgression: number;
    /** Enseignements terminés parce que le volume prévu est atteint. */
    terminesParVolumeAtteint: number;
    /** Enseignements terminés avant le volume, par l'enseignant. */
    terminesParClotureAnticipee: number;
  };
  prochainesSeances: {
    id: string;
    matiereId: string;
    dateSeance: string;
    heureDebut: string;
    heureFin: string;
  }[];
  progressionParMatiere: {
    matiereId: string;
    progression: number;
  }[];
}

export interface ApiError {
  status: number;
  message: string;
}

/** Option de niveau avec son cycle associé. */
export interface NiveauOption {
  value: string;
  cycle: Cycle;
}

/** Option de semestre avec son niveau associé. */
export interface SemestreOption {
  value: string;
  niveau: string;
}

/** Champs verrouillés par le périmètre d'un responsable de parcours. */
export interface VerrousCreationEnseignement {
  cycle: Cycle | null;
  parcours: string | null;
  mention: string | null;
}

/** Référentiel complet alimentant le formulaire de création d'enseignement. */
export interface ReferentielCreationEnseignement {
  matieres: string[];
  enseignants: string[];
  mentions: string[];
  parcours: string[];
  cycles: Cycle[];
  niveaux: NiveauOption[];
  semestres: SemestreOption[];
  anneesUniversitaires: string[];
  verrous: VerrousCreationEnseignement;
}

/** Formulaire de création d'enseignement (champs saisis par l'utilisateur). */
export interface FormulaireCreationEnseignement {
  matiereId: string;
  enseignantId: string;
  mentionId: string;
  cycle: Cycle | '';
  niveauId: string;
  parcours: string;
  semestreId: string;
  anneeUniversitaireId: string;
  volumePrevu: string;
}

/** Erreurs de validation du formulaire de création. */
export type ErreursCreationEnseignement = Partial<
  Record<keyof FormulaireCreationEnseignement, string>
>;

/** Payload envoyé à l'API lors de la création d'un enseignement. */
export interface CreateEnseignementPayload {
  matiereId: string;
  enseignantId: string;
  mentionId: string;
  cycle: Cycle;
  niveauId: string;
  parcours: string;
  semestreId: string;
  anneeUniversitaireId: string;
  volumePrevu: number;
}

/** Parcours officiels de l'EMIT (dimension de responsabilité du suivi). */
export type Parcours = 'Informatique' | 'Management' | 'ICM';

export interface UserSession {
  userId: string;
  role: UserRole;
  mentionId?: string;
  cycles?: Cycle[];
  /** Parcours attribué au responsable de parcours (combiné au cycle). */
  parcours?: Parcours;
}

export interface RoleProfile {
  key: string;
  label: string;
  role: UserRole;
  userId: string;
  mentionId?: string;
  cycles?: Cycle[];
  parcours?: Parcours;
  description: string;
}
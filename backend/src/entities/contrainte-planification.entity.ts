import { DayOfWeek } from './creneau-horaire.entity.js';
import { RoomType } from './salle.entity.js';

export type ConstraintTargetType = 'ENSEIGNANT' | 'SALLE' | 'NIVEAU' | 'GLOBAL';
export type ConstraintPriority = 'BLOQUANTE' | 'PREFERENTIELLE';

export interface RuleDefinition {
  jourSemaine?: DayOfWeek;
  creneauId?: number;
  plageInterdite?: string;
  maxHeuresJour?: number;
  equipementExige?: string;
  typeSalleExige?: RoomType;
}

/**
 * Modélisation de l'entité ContraintePlanification (TypeORM / PostgreSQL)
 * Table: 'contrainte_planification'
 */
export class ContraintePlanificationEntity {
  id!: number;
  titre!: string;
  typeContrainte!: ConstraintTargetType;
  niveauPriorite!: ConstraintPriority;
  cibleId?: number;
  cibleNom!: string;
  description!: string;
  regle!: RuleDefinition;
  active!: boolean;

  constructor(partial?: Partial<ContraintePlanificationEntity>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  isBlocking(): boolean {
    return this.active && this.niveauPriorite === 'BLOQUANTE';
  }
}

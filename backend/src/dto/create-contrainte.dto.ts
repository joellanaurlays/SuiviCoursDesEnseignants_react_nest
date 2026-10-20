import { ConstraintPriority, ConstraintTargetType, RuleDefinition } from '../entities/contrainte-planification.entity';

export interface CreateContrainteDto {
  titre: string;
  typeContrainte: ConstraintTargetType;
  niveauPriorite: ConstraintPriority;
  cibleId?: number;
  cibleNom: string;
  description: string;
  regle?: RuleDefinition;
  active?: boolean;
}

export interface ToggleContrainteDto {
  active: boolean;
}

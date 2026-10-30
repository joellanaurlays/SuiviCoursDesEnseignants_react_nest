import { TypeCycle } from '../cycle/cycle.entity.js';

/**
 * Regles LMD de l'EMIT : un seul endroit decrit la structure standard.
 *   Licence : L1 (S1,S2)  L2 (S3,S4)  L3 (S5,S6)
 *   Master  : M1 (S7,S8)  M2 (S9,S10)
 */
export const NIVEAUX_PAR_CYCLE: Record<TypeCycle, string[]> = {
  [TypeCycle.LICENCE]: ['L1', 'L2', 'L3'],
  [TypeCycle.MASTER]: ['M1', 'M2'],
};

/** Plan complet, dans l'ordre : Licence puis Master. */
export const PLAN_STANDARD: { type: TypeCycle; niveaux: string[] }[] = [
  { type: TypeCycle.LICENCE, niveaux: NIVEAUX_PAR_CYCLE[TypeCycle.LICENCE] },
  { type: TypeCycle.MASTER, niveaux: NIVEAUX_PAR_CYCLE[TypeCycle.MASTER] },
];

const ORDRE_NIVEAUX = ['L1', 'L2', 'L3', 'M1', 'M2'];

/** Numeros de semestre d'un niveau : L1 -> [1,2], L2 -> [3,4], ... M2 -> [9,10]. */
export function semestresDuNiveau(libelle: string): number[] {
  const index = ORDRE_NIVEAUX.indexOf(libelle);
  if (index < 0) return [];
  return [index * 2 + 1, index * 2 + 2];
}

export function niveauxAutorises(type: string): string[] {
  return NIVEAUX_PAR_CYCLE[type as TypeCycle] ?? [];
}
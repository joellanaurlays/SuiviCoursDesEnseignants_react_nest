import { Cycle } from '@prisma/client';

export const PARCOURS_OFFICIELS = ['Informatique', 'Management', 'ICM'] as const;

export const CYCLES_OFFICIELS: Cycle[] = [Cycle.LICENCE, Cycle.MASTER];

export const NIVEAUX_PAR_CYCLE: Record<Cycle, string[]> = {
  [Cycle.LICENCE]: ['L1', 'L2', 'L3'],
  [Cycle.MASTER]: ['M1', 'M2'],
};

export const SEMESTRES_PAR_NIVEAU: Record<string, string[]> = {
  L1: ['S1', 'S2'],
  L2: ['S3', 'S4'],
  L3: ['S5', 'S6'],
  M1: ['S1', 'S2'],
  M2: ['S3', 'S4'],
};

export interface CoherenceAcademique {
  cycle: Cycle;
  niveauId: string;
  semestreId: string;
  anneeUniversitaireId: string;
}

export function anneeUniversitaireCourante(date: Date = new Date()): string {
  const annee = date.getFullYear();
  const debut = date.getMonth() >= 7 ? annee : annee - 1;
  return `${debut}-${debut + 1}`;
}

export function estAnneeUniversitaireValide(value: string): boolean {
  const correspondance = /^(\d{4})-(\d{4})$/.exec(value);
  if (!correspondance) {
    return false;
  }
  return Number(correspondance[2]) === Number(correspondance[1]) + 1;
}

export function estCycle(value: string): value is Cycle {
  return value === Cycle.LICENCE || value === Cycle.MASTER;
}

export function niveauCompatible(cycle: Cycle, niveauId: string): boolean {
  return NIVEAUX_PAR_CYCLE[cycle]?.includes(niveauId) ?? false;
}

export function semestreCompatible(niveauId: string, semestreId: string): boolean {
  return SEMESTRES_PAR_NIVEAU[niveauId]?.includes(semestreId) ?? false;
}

export function validerCoherenceAcademique(input: CoherenceAcademique): string | null {
  if (!niveauCompatible(input.cycle, input.niveauId)) {
    return `Le niveau ${input.niveauId} n'est pas compatible avec le cycle ${input.cycle}.`;
  }
  if (!semestreCompatible(input.niveauId, input.semestreId)) {
    return `Le semestre ${input.semestreId} n'est pas compatible avec le niveau ${input.niveauId}.`;
  }
  if (!estAnneeUniversitaireValide(input.anneeUniversitaireId)) {
    return "L'année universitaire doit respecter le format AAAA-AAAA avec deux années consécutives.";
  }
  return null;
}
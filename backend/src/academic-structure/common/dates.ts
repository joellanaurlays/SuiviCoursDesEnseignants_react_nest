/** Utilitaires de dates ISO (AAAA-MM-JJ) calcules en UTC : aucun decalage de fuseau horaire. */

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function addMonths(iso: string, months: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Fin d'une annee universitaire commencant a `debut` : 12 mois moins un jour. */
export function finAnnee(debut: string): string {
  return addDays(addMonths(debut, 12), -1);
}

/** "2025-10-01" -> "2025-2026". */
export function libelleAnnee(debut: string): string {
  const y = Number(debut.slice(0, 4));
  return `${y}-${y + 1}`;
}

/** Debut par defaut : 1er octobre de l'annee universitaire en cours (rentree). */
export function debutParDefaut(now = new Date()): string {
  const y = now.getUTCMonth() >= 8 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  return `${y}-10-01`;
}

/** Dates d'un semestre : le 1er (impair) couvre les 6 premiers mois, le 2e (pair) les 6 suivants. */
export function datesSemestre(debutAnnee: string, numero: number) {
  const second = numero % 2 === 0;
  const debut = second ? addMonths(debutAnnee, 6) : debutAnnee;
  const fin = second ? finAnnee(debutAnnee) : addDays(addMonths(debutAnnee, 6), -1);
  return { dateDebut: debut, dateFin: fin };
}
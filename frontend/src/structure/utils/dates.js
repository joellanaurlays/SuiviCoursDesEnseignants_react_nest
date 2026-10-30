// Utilitaires de calendrier (dates ISO AAAA-MM-JJ, calculees en UTC : pas de decalage de fuseau).
// Les regles sont les memes que dans le backend (common/dates.ts).

export function isIsoDate(v) {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

/** Debut par defaut : 1er octobre de l'annee universitaire en cours. */
export function debutParDefaut(now = new Date()) {
  const y = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${y}-10-01`;
}

/** "2026-10-01" -> "2026-2027". */
export function libelleAnnee(debut) {
  if (!isIsoDate(debut)) return '';
  const y = Number(debut.slice(0, 4));
  return `${y}-${y + 1}`;
}

/** "2026-10-01" -> "1 oct. 2026". */
export function formatDate(iso) {
  if (!isIsoDate(iso)) return '';
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatPeriode(debut, fin) {
  return debut && fin ? `${formatDate(debut)} → ${formatDate(fin)}` : '';
}

/** Structure LMD standard (miroir de academic-rules.ts). */
export const PLAN_STANDARD = [
  { type: 'Licence', niveaux: [['L1', [1, 2]], ['L2', [3, 4]], ['L3', [5, 6]]] },
  { type: 'Master', niveaux: [['M1', [7, 8]], ['M2', [9, 10]]] },
];

/** Liste d'annees universitaires proposees : valeur = 1er octobre (AAAA-10-01), libelle = "AAAA-AAAA". */
export function anneeOptions(from = 2020, to = 2040) {
  const out = [];
  for (let y = from; y <= to; y++) out.push({ value: `${y}-10-01`, label: `${y}-${y + 1}` });
  return out;
}
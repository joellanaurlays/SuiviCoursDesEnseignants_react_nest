import { Transform } from 'class-transformer';

// Petits mots qui restent en minuscules (sauf en premier mot) : de, du, des, en, et, la...
const PETITS_MOTS = new Set([
  'de', 'du', 'des', 'd', 'en', 'et', 'la', 'le', 'les', 'l', 'au', 'aux', 'à', 'un', 'une',
  'sur', 'sous', 'pour', 'par', 'avec', 'dans', 'ou',
]);

/** Retire les chiffres et met une majuscule au debut de chaque mot (sauf les petits mots). */
export function formatNomMatiere(value: string): string {
  const nettoye = value.replace(/\d/g, '').replace(/\s{2,}/g, ' ').replace(/^\s+/, '');
  return nettoye
    .split(' ')
    .map((mot, i) => {
      if (!mot) return mot;
      const bas = mot.toLowerCase();
      if (i > 0 && PETITS_MOTS.has(bas)) return bas;
      if (i > 0 && /^[dl]['’]/i.test(mot)) return mot.charAt(0).toLowerCase() + mot.slice(1);
      return mot.charAt(0).toUpperCase() + mot.slice(1);
    })
    .join(' ');
}

export const CapitalizeWords = () =>
  Transform(({ value }) => (typeof value === 'string' ? formatNomMatiere(value.trim()) : value));
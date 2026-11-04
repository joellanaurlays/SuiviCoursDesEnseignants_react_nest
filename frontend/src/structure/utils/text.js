// Mise en forme des noms de matieres : pas de chiffres, majuscule au debut de chaque mot,
// sauf les petits mots (de, du, des, en, et, la...) qui restent en minuscules (sauf en premier mot).
const PETITS_MOTS = new Set([
  'de', 'du', 'des', 'd', 'en', 'et', 'la', 'le', 'les', 'l', 'au', 'aux', 'à', 'un', 'une',
  'sur', 'sous', 'pour', 'par', 'avec', 'dans', 'ou',
]);

export function formatNomMatiere(value) {
  const nettoye = String(value).replace(/\d/g, '').replace(/\s{2,}/g, ' ').replace(/^\s+/, '');
  return nettoye
    .split(' ')
    .map((mot, i) => {
      if (!mot) return mot;
      const bas = mot.toLowerCase();
      if (i > 0 && PETITS_MOTS.has(bas)) return bas; // de, du, en...
      if (i > 0 && /^[dl]['’]/i.test(mot)) return mot.charAt(0).toLowerCase() + mot.slice(1); // d'application
      return mot.charAt(0).toUpperCase() + mot.slice(1);
    })
    .join(' ');
}
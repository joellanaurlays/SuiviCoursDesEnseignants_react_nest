import { ActionAuditSeance, ValeursSeanceAudit } from '../types/enseignement';

/** Libellé lisible d'une action du journal d'audit. */
const LIBELLES: Record<ActionAuditSeance, string> = {
  CREATION: 'Création',
  DECLARATION_REALISEE: 'Déclaration réalisée',
  REALISATION: 'Réalisation',
  ANNULATION: 'Annulation',
  MODIFICATION: 'Modification',
  CORRECTION: 'Correction',
  SUPPRESSION: 'Suppression',
};

export function libelleAction(action: ActionAuditSeance): string {
  return LIBELLES[action] ?? action;
}

/** Indique si l'action comporte des changements de valeurs à afficher. */
export function aDesChangements(action: ActionAuditSeance): boolean {
  return (
    action === 'MODIFICATION' ||
    action === 'CORRECTION' ||
    action === 'REALISATION' ||
    action === 'ANNULATION' ||
    action === 'DECLARATION_REALISEE'
  );
}

const LABELS_CHAMPS: Record<keyof ValeursSeanceAudit, string> = {
  dateSeance: 'Date',
  heureDebut: 'Heure début',
  heureFin: 'Heure fin',
  duree: 'Durée',
  contenuEnseigne: 'Contenu',
  statut: 'Statut',
};

function formaterValeur(champ: keyof ValeursSeanceAudit, valeur: unknown): string {
  if (valeur === null || valeur === undefined || valeur === '') {
    return '—';
  }
  if (champ === 'dateSeance') {
    const date = new Date(valeur as string);
    return Number.isNaN(date.getTime())
      ? String(valeur)
      : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  if (champ === 'duree') {
    const heures = Number(valeur);
    if (Number.isNaN(heures)) return String(valeur);
    const h = Math.floor(heures);
    const m = Math.round((heures - h) * 60);
    return m === 0 ? `${h}h00` : `${h}h${String(m).padStart(2, '0')}`;
  }
  return String(valeur);
}

export interface LigneChangement {
  label: string;
  avant: string;
  apres: string;
}

/** Transforme les instantanés avant/après en lignes « champ : avant → après ». */
export function lignesChangements(
  avant: ValeursSeanceAudit | null,
  apres: ValeursSeanceAudit | null,
): LigneChangement[] {
  const cles = new Set<keyof ValeursSeanceAudit>();
  if (avant) (Object.keys(avant) as (keyof ValeursSeanceAudit)[]).forEach((k) => cles.add(k));
  if (apres) (Object.keys(apres) as (keyof ValeursSeanceAudit)[]).forEach((k) => cles.add(k));

  return Array.from(cles).map((champ) => ({
    label: LABELS_CHAMPS[champ] ?? champ,
    avant: formaterValeur(champ, avant?.[champ]),
    apres: formaterValeur(champ, apres?.[champ]),
  }));
}

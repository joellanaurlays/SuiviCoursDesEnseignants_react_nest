import { StatutSeance } from '../../types/enseignement';

const LABELS: Record<StatutSeance, string> = {
  REALISEE: 'Réalisée',
  PLANIFIEE: 'Planifiée',
  ANNULEE: 'Annulée',
};

const STYLES: Record<StatutSeance, { classes: string; dot: string }> = {
  REALISEE: {
    classes: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  PLANIFIEE: {
    classes: 'bg-[#CAF0F8] text-[#03045E] ring-1 ring-inset ring-[#90E0EF]',
    dot: 'bg-[#00B4D8]',
  },
  ANNULEE: {
    classes: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
    dot: 'bg-rose-500',
  },
};

/**
 * Pastille de statut d'une séance (PLANIFIEE, REALISEE, ANNULEE).
 *
 * Le libellé provient du domaine : le composant n'invente aucun statut et
 * retombe proprement sur la valeur brute si elle est inconnue.
 */
export function SeanceStatutBadge({ statut }: { statut: StatutSeance }) {
  const style = STYLES[statut] ?? STYLES.PLANIFIEE;

  return (
    <span className={`emit-chip ${style.classes}`} title={LABELS[statut]}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {LABELS[statut] ?? statut}
    </span>
  );
}

export function formatSeanceStatut(statut: StatutSeance): string {
  return LABELS[statut] ?? statut;
}

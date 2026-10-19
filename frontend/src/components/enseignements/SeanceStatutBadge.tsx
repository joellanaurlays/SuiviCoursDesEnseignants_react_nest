import { StatutSeance } from '../../types/enseignement';

const LABELS: Record<StatutSeance, string> = {
  REALISEE: 'Réalisée',
  PLANIFIEE: 'Planifiée',
  ANNULEE: 'Annulée',
};

const COLORS: Record<StatutSeance, string> = {
  REALISEE: 'bg-green-100 text-green-700',
  PLANIFIEE: 'bg-gray-100 text-gray-700',
  ANNULEE: 'bg-red-100 text-red-700',
};

export function SeanceStatutBadge({ statut }: { statut: StatutSeance }) {
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${COLORS[statut] ?? COLORS.PLANIFIEE}`}>
      {LABELS[statut] ?? statut}
    </span>
  );
}

export function formatSeanceStatut(statut: StatutSeance): string {
  return LABELS[statut] ?? statut;
}
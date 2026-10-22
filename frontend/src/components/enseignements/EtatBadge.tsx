interface EtatBadgeProps {
  etat: string;
}

const ETATS: Record<string, { label: string; classes: string; dot: string }> = {
  NON_COMMENCE: {
    label: 'Non commencé',
    classes: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
    dot: 'bg-slate-400',
  },
  EN_COURS: {
    label: 'En cours',
    classes: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
    dot: 'bg-amber-500',
  },
  TERMINE: {
    label: 'Terminé',
    classes: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    dot: 'bg-emerald-500',
  },
};

/**
 * Pastille d'état d'un enseignement.
 *
 * Les trois états sont ceux du domaine (NON_COMMENCE, EN_COURS, TERMINE) :
 * ce composant ne fait que les rendre lisibles, sans jamais les recalculer.
 */
export function EtatBadge({ etat }: EtatBadgeProps) {
  const config = ETATS[etat] ?? {
    label: etat,
    classes: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
    dot: 'bg-slate-400',
  };

  return (
    <span className={`emit-chip ${config.classes}`}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

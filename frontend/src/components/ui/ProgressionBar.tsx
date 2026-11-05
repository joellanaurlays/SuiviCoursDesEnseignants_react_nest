interface ProgressionBarProps {
  progression: number;
  showLabel?: boolean;
  labelRight?: boolean;
  /** Hauteur de la barre : `sm` pour les tableaux, `md` pour les cartes. */
  size?: 'sm' | 'md' | 'lg';
  /** Affiche une valeur arrondie à l'entier (défaut : telle que fournie). */
  round?: boolean;
}

/**
 * Barre de progression.
 *
 * La valeur est bornée entre 0 et 100 : les agrégats du backend sont déjà
 * cohérents, ce garde-fou évite simplement qu'un arrondi en amont ne
 * déborde visuellement du gabarit.
 *
 * La couleur suit l'avancement : bleu EMIT tant que la progression est
 * partielle, vert une fois l'enseignement terminé.
 */
export function ProgressionBar({
  progression,
  showLabel = false,
  labelRight = false,
  size = 'md',
  round = false,
}: ProgressionBarProps) {
  const clamped = Math.min(Math.max(progression, 0), 100);
  const displayed = round ? Math.round(clamped) : clamped;

  const heights: Record<NonNullable<ProgressionBarProps['size']>, string> = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-2.5',
  };

  const isComplete = clamped >= 100;

  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-full min-w-16 overflow-hidden rounded-full bg-slate-200 ${heights[size]}`}
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isComplete
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
              : 'bg-gradient-to-r from-[#0077B6] to-[#00B4D8]'
          }`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span
          className={`text-xs font-bold ${isComplete ? 'text-emerald-600' : 'text-[#03045E]'} ${
            labelRight ? 'w-12 text-right' : ''
          }`}
        >
          {displayed}%
        </span>
      )}
    </div>
  );
}

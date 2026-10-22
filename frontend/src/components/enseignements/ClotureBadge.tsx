import { TypeCloture } from '../../types/enseignement';

/**
 * Badge du mode de clôture d'un enseignement.
 * Affiche uniquement ce qui est utile : une clôture anticipée est signalée
 * explicitement, une clôture normale n'ajoute pas de badge.
 */
export function ClotureBadge({ typeCloture }: { typeCloture: TypeCloture | null }) {
  if (typeCloture === 'ANTICIPEE') {
    return (
      <span className="emit-chip bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-violet-500" />
        Anticipée
      </span>
    );
  }

  if (typeCloture === 'NORMALE') {
    return (
      <span className="emit-chip bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        Volume atteint
      </span>
    );
  }

  return <span className="text-xs text-slate-400">—</span>;
}

import { Loader2 } from 'lucide-react';

/**
 * État de chargement du module Suivi des enseignements.
 *
 * L'indicateur est centré dans une zone dédiée pour éviter que le texte ne
 * flotte sur le fond gris de l'application pendant le chargement.
 */
export function LoadingState({ label = 'Chargement en cours...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16" role="status" aria-live="polite">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#CAF0F8] text-[#0077B6]">
        <Loader2 className="animate-spin" size={22} aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-slate-500">{label}</p>
    </div>
  );
}

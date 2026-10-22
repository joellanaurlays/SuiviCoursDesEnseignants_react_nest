import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

/**
 * État d'erreur du module Suivi des enseignements.
 *
 * Le message d'erreur métier est affiché tel quel (message du backend ou
 * « Impossible de charger… ») : ce composant ne l'altère pas.
 */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 px-6 py-14 text-center"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-rose-600 shadow-sm">
        <AlertCircle size={24} aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-bold text-rose-800">Une erreur est survenue</p>
        <p className="mx-auto mt-1 max-w-lg text-sm text-rose-700">{message}</p>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className="emit-btn-danger mt-1">
          <RefreshCw size={14} aria-hidden="true" />
          Réessayer
        </button>
      )}
    </div>
  );
}

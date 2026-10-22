import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  message: string;
  /** Précision affichée sous le message (aide contextuelle). */
  hint?: string;
  /** Action facultative proposée à l'utilisateur. */
  action?: React.ReactNode;
}

/**
 * État vide : aucune donnée ne correspond aux critères ou au périmètre.
 *
 * Le message métier est transmis tel quel par l'appelant afin que chaque
 * écran puisse expliquer pourquoi la liste est vide (filtres, périmètre de
 * l'utilisateur, absence de séances...).
 */
export function EmptyState({ message, hint, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Inbox size={26} aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-600">{message}</p>
        {hint && <p className="mx-auto mt-1 max-w-md text-xs text-slate-400">{hint}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { AlertTriangle, Flag, X } from 'lucide-react';
import { ProgressionBar } from '../ui/ProgressionBar';

interface ClotureModalProps {
  open: boolean;
  matiere: string;
  volumePrevu: number;
  heuresRealisees: number;
  progression: number;
  onCancel: () => void;
  onConfirm: (motif: string) => Promise<void>;
}

const MOTIF_MIN = 5;

/**
 * Confirmation de la clôture anticipée d'un enseignement.
 * Le motif est obligatoire : le bouton de confirmation reste désactivé tant
 * qu'il est vide. La progression affichée reste celle des heures réelles —
 * la clôture ne la modifie pas.
 */
export function ClotureModal({
  open,
  matiere,
  volumePrevu,
  heuresRealisees,
  progression,
  onCancel,
  onConfirm,
}: ClotureModalProps) {
  const [motif, setMotif] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMotif('');
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  /** Fermeture au clavier (Échap) sauf pendant l'enregistrement. */
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, submitting, onCancel]);

  if (!open) {
    return null;
  }

  const motifValide = motif.trim().length >= MOTIF_MIN;

  const handleConfirm = async () => {
    if (!motifValide || submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(motif.trim());
    } catch (e) {
      setError((e as { message?: string }).message ?? "La clôture n'a pas pu être enregistrée.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-[#03045E]/40 backdrop-blur-sm"
        onClick={submitting ? undefined : onCancel}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cloture-titre"
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#CAF0F8] text-[#03045E]" aria-hidden="true">
              <Flag size={18} />
            </span>
            <div>
              <p className="emit-eyebrow">Enseignement</p>
              <h2 id="cloture-titre" className="mt-0.5 text-lg font-extrabold text-[#03045E]">
                Clôture anticipée
              </h2>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={submitting}
            aria-label="Fermer"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="rounded-2xl border border-[#90E0EF] bg-[#CAF0F8] px-4 py-3">
            <p className="text-sm font-bold text-[#03045E]">{matiere}</p>
            <p className="mt-1 text-sm text-slate-700">
              {heuresRealisees}h réalisées sur {volumePrevu}h prévues — la progression reste à{' '}
              <span className="font-bold text-[#03045E]">{progression}%</span> et ne sera pas modifiée.
            </p>
            <div className="mt-3">
              <ProgressionBar progression={progression} showLabel size="md" />
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p>
              L&apos;enseignement passera à l&apos;état <strong>Terminé</strong>. Cette action est
              définitive.
            </p>
          </div>

          <div>
            <label htmlFor="cloture-motif" className="emit-label">
              Motif <span className="text-rose-600">*</span>
            </label>
            <textarea
              id="cloture-motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              rows={4}
              autoFocus
              placeholder="Le contenu prévu dans le programme a été entièrement traité."
              className="emit-input min-h-[100px]"
              aria-invalid={motif.length > 0 && !motifValide}
            />
            <p className="mt-1 text-xs text-slate-500">
              {motifValide
                ? 'Motif enregistré avec la clôture.'
                : `Le motif est obligatoire (${MOTIF_MIN} caractères minimum).`}
            </p>
          </div>

          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button onClick={onCancel} disabled={submitting} className="emit-btn-ghost">
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!motifValide || submitting}
            className="emit-btn-primary"
          >
            <Flag size={15} aria-hidden="true" />
            {submitting ? 'Clôture en cours...' : 'Confirmer la clôture'}
          </button>
        </div>
      </div>
    </div>
  );
}

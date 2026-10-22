import { useEffect, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#03045E]/50" onClick={submitting ? undefined : onCancel} />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="cloture-titre"
                className="relative w-full max-w-lg bg-white rounded-xl border border-gray-200 shadow-xl"
            >
                <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
                    <h2 id="cloture-titre" className="text-xl font-bold text-[#03045E]">
                        Clôture anticipée de l'enseignement
                    </h2>
                    <button
                        onClick={onCancel}
                        disabled={submitting}
                        aria-label="Fermer"
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div className="bg-emit-ice border border-emit-sky rounded-lg px-4 py-3">
                        <p className="font-medium text-[#03045E]">{matiere}</p>
                        <p className="text-sm text-gray-600 mt-1">
                            {heuresRealisees}h réalisées sur {volumePrevu}h prévues — la progression reste à{' '}
                            <span className="font-semibold">{progression}%</span> et ne sera pas modifiée.
                        </p>
                    </div>

                    <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                        <p>
                            L'enseignement passera à l'état <strong>Terminé</strong>. Cette action est
                            définitive.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="cloture-motif" className="block text-sm font-medium text-gray-700 mb-1">
                            Motif <span className="text-red-600">*</span>
                        </label>
                        <textarea
                            id="cloture-motif"
                            value={motif}
                            onChange={(e) => setMotif(e.target.value)}
                            rows={4}
                            autoFocus
                            placeholder="Le contenu prévu dans le programme a été entièrement traité."
                            className="block w-full px-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-[#00B4D8] focus:border-[#00B4D8] sm:text-sm rounded-md"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {motifValide
                                ? 'Motif enregistré avec la clôture.'
                                : `Le motif est obligatoire (${MOTIF_MIN} caractères minimum).`}
                        </p>
                    </div>

                    {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={onCancel}
                        disabled={submitting}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!motifValide || submitting}
                        className="px-4 py-2 bg-[#0077B6] text-white rounded-md text-sm font-medium hover:bg-[#03045E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Clôture en cours...' : 'Confirmer la clôture'}
                    </button>
                </div>
            </div>
        </div>
    );
}

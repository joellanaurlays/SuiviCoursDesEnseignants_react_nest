import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Pencil, X, XCircle } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { seanceService } from '../../services/seance.service';
import { Seance } from '../../types/enseignement';
import { formatDate, formatDuree, formatHoraire } from '../../utils/format';
import { SeanceStatutBadge } from './SeanceStatutBadge';
import { HistoriqueSeance } from './HistoriqueSeance';

interface SeanceDetailModalProps {
  seanceId: string;
  onClose: () => void;
  /** Appelé après une réalisation/annulation réussie pour rafraîchir la liste. */
  onChanged?: () => void;
}

type Mode = 'detail' | 'realiser' | 'annuler' | 'corriger';

const CONTENU_MIN = 3;

function toDateInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 py-2">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="font-medium text-[#03045E] text-right text-sm">
        {value || <span className="italic text-gray-400">Non renseigné</span>}
      </span>
    </div>
  );
}

/**
 * Détail d'une séance. Tous les utilisateurs autorisés peuvent la consulter.
 * Seul l'enseignant responsable d'une séance PLANIFIEE voit les actions de
 * réalisation et d'annulation — le backend revalide de toute façon chaque
 * action et renvoie 403 le cas échéant.
 */
export function SeanceDetailModal({ seanceId, onClose, onChanged }: SeanceDetailModalProps) {
  const { headers } = useAuth();
  const [seance, setSeance] = useState<Seance | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('detail');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Formulaire de réalisation : informations réellement observées.
  const [dateSeance, setDateSeance] = useState('');
  const [heureDebut, setHeureDebut] = useState('');
  const [heureFin, setHeureFin] = useState('');
  const [contenuEnseigne, setContenuEnseigne] = useState('');
  const [motifAnnulation, setMotifAnnulation] = useState('');
  const [motifCorrection, setMotifCorrection] = useState('');

  const charger = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const detail = await seanceService.getById(seanceId, headers);
      setSeance(detail);
      setDateSeance(toDateInput(detail.dateSeance));
      setHeureDebut(detail.heureDebut);
      setHeureFin(detail.heureFin);
      setContenuEnseigne(detail.contenuEnseigne ?? '');
    } catch (e) {
      const err = e as { status?: number; message?: string };
      setLoadError(
        err.status === 403
          ? "Vous n'êtes pas autorisé à consulter cette séance."
          : err.message ?? 'Impossible de charger le détail de la séance.',
      );
    } finally {
      setLoading(false);
    }
  }, [seanceId, headers]);

  useEffect(() => {
    setMode('detail');
    setActionError(null);
    setMotifAnnulation('');
    setMotifCorrection('');
    charger();
  }, [charger]);

  const confirmerRealisation = async () => {
    if (!seance) return;
    if (heureFin <= heureDebut) {
      setActionError("L'heure de fin doit être postérieure à l'heure de début.");
      return;
    }
    if (contenuEnseigne.trim().length < CONTENU_MIN) {
      setActionError('Le contenu enseigné est obligatoire pour marquer la séance comme réalisée.');
      return;
    }

    setSubmitting(true);
    setActionError(null);
    try {
      await seanceService.realiser(
        seance.id,
        {
          dateSeance: dateSeance ? new Date(dateSeance).toISOString() : undefined,
          heureDebut,
          heureFin,
          contenuEnseigne: contenuEnseigne.trim(),
        },
        headers,
      );
      setMode('detail');
      onChanged?.();
      setRefreshKey((k) => k + 1);
      await charger();
    } catch (e) {
      setActionError((e as { message?: string }).message ?? "La réalisation n'a pas pu être enregistrée.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmerAnnulation = async () => {
    if (!seance) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await seanceService.annuler(
        seance.id,
        { motif: motifAnnulation.trim() || undefined },
        headers,
      );
      setMode('detail');
      onChanged?.();
      setRefreshKey((k) => k + 1);
      await charger();
    } catch (e) {
      setActionError((e as { message?: string }).message ?? "L'annulation n'a pas pu être enregistrée.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmerCorrection = async () => {
    if (!seance) return;
    if (heureFin <= heureDebut) {
      setActionError("L'heure de fin doit être postérieure à l'heure de début.");
      return;
    }
    if (contenuEnseigne.trim().length < CONTENU_MIN) {
      setActionError('Le contenu enseigné est obligatoire.');
      return;
    }

    setSubmitting(true);
    setActionError(null);
    try {
      await seanceService.corriger(
        seance.id,
        {
          dateSeance: dateSeance ? new Date(dateSeance).toISOString() : undefined,
          heureDebut,
          heureFin,
          contenuEnseigne: contenuEnseigne.trim(),
          motif: motifCorrection.trim() || undefined,
        },
        headers,
      );
      setMode('detail');
      onChanged?.();
      setRefreshKey((k) => k + 1);
      await charger();
    } catch (e) {
      setActionError((e as { message?: string }).message ?? "La correction n'a pas pu être enregistrée.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:border-[#00B4D8] focus:ring-1 focus:ring-[#00B4D8]';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#03045E]/50" onClick={submitting ? undefined : onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="seance-detail-titre"
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-xl"
      >
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <h2 id="seance-detail-titre" className="text-xl font-bold text-[#03045E]">
            Détail de la séance
          </h2>
          <button
            onClick={onClose}
            disabled={submitting}
            aria-label="Fermer"
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-center text-gray-500">Chargement du détail...</div>
        ) : loadError || !seance ? (
          <div className="px-6 py-8">
            <p className="text-sm text-red-600 font-semibold">{loadError ?? 'Séance introuvable.'}</p>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-5">
            {/* Détails */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-[#03045E]">
                  {seance.enseignement?.matiereId ?? '—'}
                </p>
                <SeanceStatutBadge statut={seance.statut} />
              </div>
              <InfoRow label="Enseignant responsable" value={seance.enseignement?.enseignantId} />
              <InfoRow label="Date" value={formatDate(seance.dateSeance)} />
              <InfoRow label="Horaires prévus" value={formatHoraire(seance.heureDebut, seance.heureFin)} />
              <InfoRow label="Durée prévue" value={formatDuree(seance.duree)} />
              {seance.statut === 'REALISEE' && (
                <InfoRow label="Durée réalisée" value={formatDuree(seance.duree)} />
              )}
              <InfoRow label="Contenu enseigné" value={seance.contenuEnseigne} />
              <InfoRow label="Créée le" value={formatDate(seance.createdAt)} />
              <InfoRow label="Dernière modification" value={formatDate(seance.updatedAt)} />
            </div>

            {actionError && (
              <p className="text-sm text-red-600 font-semibold" role="alert">
                {actionError}
              </p>
            )}

            {/* Mode détail : actions éventuelles */}
            {mode === 'detail' && (seance.peutRealiser || seance.peutAnnuler || seance.peutCorriger) && (
              <div className="flex flex-col sm:flex-row gap-3 border-t border-gray-100 pt-4">
                {seance.peutRealiser && (
                  <button
                    onClick={() => {
                      setActionError(null);
                      setMode('realiser');
                    }}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-[#0077B6] text-white rounded-md text-sm font-medium hover:bg-[#03045E] transition-colors"
                  >
                    <CheckCircle2 size={16} className="mr-2" />
                    Marquer comme réalisée
                  </button>
                )}
                {seance.peutCorriger && (
                  <button
                    onClick={() => {
                      setActionError(null);
                      setMode('corriger');
                    }}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-[#0077B6] text-[#0077B6] rounded-md text-sm font-medium hover:bg-emit-ice transition-colors"
                  >
                    <Pencil size={16} className="mr-2" />
                    Corriger la séance
                  </button>
                )}
                {seance.peutAnnuler && (
                  <button
                    onClick={() => {
                      setActionError(null);
                      setMode('annuler');
                    }}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-red-300 text-red-700 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
                  >
                    <XCircle size={16} className="mr-2" />
                    Annuler la séance
                  </button>
                )}
              </div>
            )}

            {/* Formulaire de réalisation */}
            {mode === 'realiser' && (
              <div className="border-t border-gray-100 pt-4 space-y-4">
                <div className="flex items-center gap-2 text-[#0077B6] bg-emit-ice border border-emit-sky rounded-md px-3 py-2 text-sm">
                  <Clock size={16} className="text-[#0077B6]" />
                  <span>Confirmez les informations réellement observées.</span>
                </div>

                <div>
                  <label className={labelClass}>Date effective *</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={dateSeance}
                    onChange={(e) => setDateSeance(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Heure début *</label>
                    <input
                      type="time"
                      className={inputClass}
                      value={heureDebut}
                      onChange={(e) => setHeureDebut(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Heure fin *</label>
                    <input
                      type="time"
                      className={inputClass}
                      value={heureFin}
                      onChange={(e) => setHeureFin(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Contenu enseigné *</label>
                  <textarea
                    className={`${inputClass} min-h-[100px]`}
                    value={contenuEnseigne}
                    onChange={(e) => setContenuEnseigne(e.target.value)}
                    disabled={submitting}
                    placeholder="Contenu réellement traité durant la séance..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setMode('detail')}
                    disabled={submitting}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={confirmerRealisation}
                    disabled={submitting}
                    className="px-4 py-2 bg-[#0077B6] text-white rounded-md text-sm font-medium hover:bg-[#03045E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Enregistrement...' : 'Confirmer la réalisation'}
                  </button>
                </div>
              </div>
            )}

            {/* Confirmation d'annulation */}
            {mode === 'annuler' && (
              <div className="border-t border-gray-100 pt-4 space-y-4">
                <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <p>
                    La séance sera marquée <strong>Annulée</strong>, ne comptera aucune heure
                    réalisée et restera visible dans l'historique.
                  </p>
                </div>

                <div>
                  <label className={labelClass}>Justification (facultative)</label>
                  <textarea
                    className={`${inputClass} min-h-[80px]`}
                    value={motifAnnulation}
                    onChange={(e) => setMotifAnnulation(e.target.value)}
                    disabled={submitting}
                    placeholder="Motif de l'annulation..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setMode('detail')}
                    disabled={submitting}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={confirmerAnnulation}
                    disabled={submitting}
                    className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Annulation...' : "Confirmer l'annulation"}
                  </button>
                </div>
              </div>
            )}

            {/* Formulaire de correction exceptionnelle */}
            {mode === 'corriger' && (
              <div className="border-t border-gray-100 pt-4 space-y-4">
                <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <p>
                    Cette séance est déjà <strong>réalisée</strong>. Toute correction est une
                    opération exceptionnelle : les valeurs avant/après et le motif sont conservés
                    dans l'historique.
                  </p>
                </div>

                <div>
                  <label className={labelClass}>Date effective</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={dateSeance}
                    onChange={(e) => setDateSeance(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Heure début</label>
                    <input
                      type="time"
                      className={inputClass}
                      value={heureDebut}
                      onChange={(e) => setHeureDebut(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Heure fin</label>
                    <input
                      type="time"
                      className={inputClass}
                      value={heureFin}
                      onChange={(e) => setHeureFin(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Contenu enseigné</label>
                  <textarea
                    className={`${inputClass} min-h-[80px]`}
                    value={contenuEnseigne}
                    onChange={(e) => setContenuEnseigne(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className={labelClass}>Motif de la correction</label>
                  <textarea
                    className={`${inputClass} min-h-[60px]`}
                    value={motifCorrection}
                    onChange={(e) => setMotifCorrection(e.target.value)}
                    disabled={submitting}
                    placeholder="Pourquoi cette correction ?"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setMode('detail')}
                    disabled={submitting}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={confirmerCorrection}
                    disabled={submitting}
                    className="px-4 py-2 bg-[#0077B6] text-white rounded-md text-sm font-medium hover:bg-[#03045E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Enregistrement...' : 'Enregistrer la correction'}
                  </button>
                </div>
              </div>
            )}

            {/* Historique d'audit */}
            <HistoriqueSeance seanceId={seance.id} refreshKey={refreshKey} />
          </div>
        )}
      </div>
    </div>
  );
}

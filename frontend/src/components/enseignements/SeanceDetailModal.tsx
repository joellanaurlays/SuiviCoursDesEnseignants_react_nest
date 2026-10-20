import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Pencil, X, XCircle } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { seanceService } from '../../services/seance.service';
import { Seance } from '../../types/enseignement';
import { formatDate, formatDuree, formatHoraire } from '../../utils/format';
import {
  CONTENU_MIN,
  ErreursRealisation,
  OPTIONS_TYPE_SEANCE,
  PLACEHOLDER_SALLE,
  validerRealisation,
} from '../../utils/seance-form-options';
import { SeanceStatutBadge } from './SeanceStatutBadge';
import { HistoriqueSeance } from './HistoriqueSeance';

interface SeanceDetailModalProps {
  seanceId: string;
  onClose: () => void;
  /** Appelé après une réalisation/annulation réussie pour rafraîchir la liste. */
  onChanged?: () => void;
}

type Mode = 'detail' | 'realiser' | 'annuler' | 'corriger';

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
      <span className="font-medium text-[#0a0a32] text-right text-sm">
        {value || <span className="italic text-gray-400">Non renseigné</span>}
      </span>
    </div>
  );
}

/** Message d'erreur affiché sous un champ du formulaire. */
function ChampErreur({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-xs text-red-600" role="alert">
      {message}
    </p>
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
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ErreursRealisation>({});
  const [refreshKey, setRefreshKey] = useState(0);

  // Formulaire de réalisation : informations réellement observées.
  const [dateSeance, setDateSeance] = useState('');
  const [heureDebut, setHeureDebut] = useState('');
  const [heureFin, setHeureFin] = useState('');
  const [contenuEnseigne, setContenuEnseigne] = useState('');
  const [salle, setSalle] = useState('');
  const [typeSeance, setTypeSeance] = useState('');
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
      setSalle(detail.salle ?? '');
      setTypeSeance(detail.typeSeance ?? '');
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

  /** Efface l'erreur d'un champ dès que l'enseignant le modifie. */
  const effacerErreur = (champ: keyof ErreursRealisation) => {
    setFieldErrors((prev) => ({ ...prev, [champ]: undefined }));
  };

  /** Passe en mode formulaire en réinitialisant les messages. */
  const ouvrirMode = (nouveauMode: Mode) => {
    setActionError(null);
    setActionSuccess(null);
    setFieldErrors({});
    setMode(nouveauMode);
  };

  const confirmerRealisation = async () => {
    if (!seance) return;

    // Validation locale AVANT tout appel API : salle et type sont
    // obligatoires, les erreurs s'affichent sous chaque champ concerné.
    const erreurs = validerRealisation({
      dateSeance,
      heureDebut,
      heureFin,
      contenuEnseigne,
      salle,
      typeSeance,
    });
    setFieldErrors(erreurs);
    if (Object.values(erreurs).some(Boolean)) {
      setActionError(null);
      return;
    }

    setSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await seanceService.realiser(
        seance.id,
        {
          dateSeance: dateSeance ? new Date(dateSeance).toISOString() : undefined,
          heureDebut,
          heureFin,
          contenuEnseigne: contenuEnseigne.trim(),
          salle: salle.trim(),
          typeSeance,
        },
        headers,
      );
      setMode('detail');
      setActionSuccess('La séance a bien été marquée comme réalisée.');
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
    setActionSuccess(null);
    try {
      await seanceService.annuler(
        seance.id,
        { motif: motifAnnulation.trim() || undefined },
        headers,
      );
      setMode('detail');
      setActionSuccess('La séance a bien été annulée.');
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
    setActionSuccess(null);
    try {
      await seanceService.corriger(
        seance.id,
        {
          dateSeance: dateSeance ? new Date(dateSeance).toISOString() : undefined,
          heureDebut,
          heureFin,
          contenuEnseigne: contenuEnseigne.trim(),
          salle: salle.trim() || undefined,
          typeSeance: typeSeance || undefined,
          motif: motifCorrection.trim() || undefined,
        },
        headers,
      );
      setMode('detail');
      setActionSuccess('La correction a bien été enregistrée.');
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
    'w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff]';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0a0a32]/50" onClick={submitting ? undefined : onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="seance-detail-titre"
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-xl"
      >
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <h2 id="seance-detail-titre" className="text-xl font-bold text-[#0a0a32]">
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
                <p className="font-semibold text-[#0a0a32]">
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
              <InfoRow label="Salle" value={seance.salle} />
              <InfoRow label="Type de séance" value={seance.typeSeance} />
              <InfoRow label="Créée le" value={formatDate(seance.createdAt)} />
              <InfoRow label="Dernière modification" value={formatDate(seance.updatedAt)} />
            </div>

            {actionError && (
              <p className="text-sm text-red-600 font-semibold" role="alert">
                {actionError}
              </p>
            )}

            {actionSuccess && mode === 'detail' && (
              <p className="text-sm text-green-700 font-semibold" role="status">
                {actionSuccess}
              </p>
            )}

            {/* Mode détail : actions éventuelles */}
            {mode === 'detail' && (seance.peutRealiser || seance.peutAnnuler || seance.peutCorriger) && (
              <div className="flex flex-col sm:flex-row gap-3 border-t border-gray-100 pt-4">
                {seance.peutRealiser && (
                  <button
                    onClick={() => ouvrirMode('realiser')}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-[#0088aa] text-white rounded-md text-sm font-medium hover:bg-[#007799] transition-colors"
                  >
                    <CheckCircle2 size={16} className="mr-2" />
                    Marquer comme réalisée
                  </button>
                )}
                {seance.peutCorriger && (
                  <button
                    onClick={() => ouvrirMode('corriger')}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-[#0088aa] text-[#006688] rounded-md text-sm font-medium hover:bg-cyan-50 transition-colors"
                  >
                    <Pencil size={16} className="mr-2" />
                    Corriger la séance
                  </button>
                )}
                {seance.peutAnnuler && (
                  <button
                    onClick={() => ouvrirMode('annuler')}
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
                <div className="flex items-center gap-2 text-[#006688] bg-cyan-50 border border-cyan-100 rounded-md px-3 py-2 text-sm">
                  <Clock size={16} className="text-[#0088aa]" />
                  <span>Confirmez les informations réellement observées.</span>
                </div>

                {/* Récapitulatif de la séance concernée */}
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                  <p className="font-semibold text-[#0a0a32]">
                    {seance.enseignement?.matiereId ?? '—'}
                  </p>
                  <p className="text-gray-600">
                    Prévu le {formatDate(seance.dateSeance)} ·{' '}
                    {formatHoraire(seance.heureDebut, seance.heureFin)} · Durée prévue{' '}
                    {formatDuree(seance.duree)}
                  </p>
                </div>

                <div>
                  <label className={labelClass}>Date effective *</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={dateSeance}
                    onChange={(e) => {
                      setDateSeance(e.target.value);
                      effacerErreur('dateSeance');
                    }}
                    disabled={submitting}
                  />
                  <ChampErreur message={fieldErrors.dateSeance} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Heure début *</label>
                    <input
                      type="time"
                      className={inputClass}
                      value={heureDebut}
                      onChange={(e) => {
                        setHeureDebut(e.target.value);
                        effacerErreur('heureDebut');
                      }}
                      disabled={submitting}
                    />
                    <ChampErreur message={fieldErrors.heureDebut} />
                  </div>
                  <div>
                    <label className={labelClass}>Heure fin *</label>
                    <input
                      type="time"
                      className={inputClass}
                      value={heureFin}
                      onChange={(e) => {
                        setHeureFin(e.target.value);
                        effacerErreur('heureFin');
                      }}
                      disabled={submitting}
                    />
                    <ChampErreur message={fieldErrors.heureFin} />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Salle *</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={salle}
                    onChange={(e) => {
                      setSalle(e.target.value);
                      effacerErreur('salle');
                    }}
                    disabled={submitting}
                    placeholder={PLACEHOLDER_SALLE}
                    aria-invalid={Boolean(fieldErrors.salle)}
                  />
                  <ChampErreur message={fieldErrors.salle} />
                </div>

                <div>
                  <label className={labelClass}>Type de séance *</label>
                  <select
                    className={inputClass}
                    value={typeSeance}
                    onChange={(e) => {
                      setTypeSeance(e.target.value);
                      effacerErreur('typeSeance');
                    }}
                    disabled={submitting}
                    aria-invalid={Boolean(fieldErrors.typeSeance)}
                  >
                    <option value="">-- Sélectionner --</option>
                    {OPTIONS_TYPE_SEANCE.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChampErreur message={fieldErrors.typeSeance} />
                </div>

                <div>
                  <label className={labelClass}>Contenu enseigné *</label>
                  <textarea
                    className={`${inputClass} min-h-[100px]`}
                    value={contenuEnseigne}
                    onChange={(e) => {
                      setContenuEnseigne(e.target.value);
                      effacerErreur('contenuEnseigne');
                    }}
                    disabled={submitting}
                    placeholder="Contenu réellement traité durant la séance..."
                    aria-invalid={Boolean(fieldErrors.contenuEnseigne)}
                  />
                  <ChampErreur message={fieldErrors.contenuEnseigne} />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => ouvrirMode('detail')}
                    disabled={submitting}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={confirmerRealisation}
                    disabled={submitting}
                    className="px-4 py-2 bg-[#0088aa] text-white rounded-md text-sm font-medium hover:bg-[#007799] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <label className={labelClass}>Salle</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={salle}
                    onChange={(e) => setSalle(e.target.value)}
                    disabled={submitting}
                    placeholder={PLACEHOLDER_SALLE}
                  />
                </div>

                <div>
                  <label className={labelClass}>Type de séance</label>
                  <select
                    className={inputClass}
                    value={typeSeance}
                    onChange={(e) => setTypeSeance(e.target.value)}
                    disabled={submitting}
                  >
                    <option value="">-- Sélectionner --</option>
                    {OPTIONS_TYPE_SEANCE.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
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
                    className="px-4 py-2 bg-[#0088aa] text-white rounded-md text-sm font-medium hover:bg-[#007799] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

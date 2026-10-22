import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Pencil,
  Save,
  X,
  XCircle,
} from 'lucide-react';
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
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="shrink-0 text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-semibold text-[#03045E]">
        {value || <span className="italic font-normal text-slate-400">Non renseigné</span>}
      </span>
    </div>
  );
}

/** Message d'erreur affiché sous un champ du formulaire. */
function ChampErreur({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-xs font-semibold text-rose-600" role="alert">
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

  /** Fermeture au clavier (Échap) sauf pendant un enregistrement. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, submitting]);

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

  const inputClass = 'emit-input';
  const labelClass = 'emit-label';

  const optionType = (
    <>
      <option value="">-- Sélectionner --</option>
      {OPTIONS_TYPE_SEANCE.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-[#03045E]/40 backdrop-blur-sm"
        onClick={submitting ? undefined : onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="seance-detail-titre"
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl"
      >
        {/* En-tête */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="emit-eyebrow">Séance</p>
            <h2 id="seance-detail-titre" className="mt-0.5 truncate text-xl font-extrabold text-[#03045E]">
              Détail de la séance
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {seance && <SeanceStatutBadge statut={seance.statut} />}
            <button
              onClick={onClose}
              disabled={submitting}
              aria-label="Fermer"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-14 text-center text-sm text-slate-500">Chargement du détail...</div>
        ) : loadError || !seance ? (
          <div className="px-6 py-10">
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700" role="alert">
              {loadError ?? 'Séance introuvable.'}
            </p>
          </div>
        ) : (
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            {/* Récapitulatif */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-extrabold text-[#03045E]">
                    {seance.enseignement?.matiereId ?? '—'}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatDate(seance.dateSeance)} · {formatHoraire(seance.heureDebut, seance.heureFin)} ·{' '}
                    {formatDuree(seance.duree)}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1 rounded-xl bg-white px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-200">
                  <Clock size={13} aria-hidden="true" />
                  {formatDuree(seance.duree)}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                <InfoRow label="Enseignant responsable" value={seance.enseignement?.enseignantId} />
                <InfoRow label="Date" value={formatDate(seance.dateSeance)} />
                <InfoRow label="Horaires prévus" value={formatHoraire(seance.heureDebut, seance.heureFin)} />
                <InfoRow label="Durée prévue" value={formatDuree(seance.duree)} />
                {seance.statut === 'REALISEE' && (
                  <InfoRow label="Durée réalisée" value={formatDuree(seance.duree)} />
                )}
                <InfoRow
                  label="Salle"
                  value={
                    seance.salle && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={13} aria-hidden="true" />
                        {seance.salle}
                      </span>
                    )
                  }
                />
                <InfoRow label="Type de séance" value={seance.typeSeance} />
                <InfoRow label="Créée le" value={formatDate(seance.createdAt)} />
                <InfoRow label="Dernière modification" value={formatDate(seance.updatedAt)} />
              </div>

              <div className="mt-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-inset ring-slate-200">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Contenu enseigné
                </p>
                <p className="mt-0.5 text-sm text-slate-700">
                  {seance.contenuEnseigne || <span className="italic text-slate-400">Non renseigné</span>}
                </p>
              </div>
            </div>

            {actionError && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700" role="alert">
                {actionError}
              </p>
            )}

            {actionSuccess && mode === 'detail' && (
              <p className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700" role="status">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                {actionSuccess}
              </p>
            )}

            {/* Mode détail : actions éventuelles */}
            {mode === 'detail' && (seance.peutRealiser || seance.peutAnnuler || seance.peutCorriger) && (
              <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row">
                {seance.peutRealiser && (
                  <button
                    onClick={() => ouvrirMode('realiser')}
                    className="emit-btn-primary flex-1"
                  >
                    <CheckCircle2 size={15} aria-hidden="true" />
                    Marquer comme réalisée
                  </button>
                )}
                {seance.peutCorriger && (
                  <button
                    onClick={() => ouvrirMode('corriger')}
                    className="emit-btn-outline flex-1"
                  >
                    <Pencil size={15} aria-hidden="true" />
                    Corriger la séance
                  </button>
                )}
                {seance.peutAnnuler && (
                  <button
                    onClick={() => ouvrirMode('annuler')}
                    className="emit-btn-danger-outline flex-1"
                  >
                    <XCircle size={15} aria-hidden="true" />
                    Annuler la séance
                  </button>
                )}
              </div>
            )}

            {/* Formulaire de réalisation */}
            {mode === 'realiser' && (
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 rounded-xl border border-[#90E0EF] bg-[#CAF0F8] px-3 py-2 text-sm text-[#03045E]">
                  <Clock size={16} className="shrink-0 text-[#0077B6]" aria-hidden="true" />
                  <span>Confirmez les informations réellement observées.</span>
                </div>

                <div>
                  <label className={labelClass} htmlFor="realiser-date">Date effective *</label>
                  <input
                    id="realiser-date"
                    type="date"
                    className={inputClass}
                    value={dateSeance}
                    onChange={(e) => {
                      setDateSeance(e.target.value);
                      effacerErreur('dateSeance');
                    }}
                    disabled={submitting}
                    aria-invalid={Boolean(fieldErrors.dateSeance)}
                  />
                  <ChampErreur message={fieldErrors.dateSeance} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="realiser-debut">Heure début *</label>
                    <input
                      id="realiser-debut"
                      type="time"
                      className={inputClass}
                      value={heureDebut}
                      onChange={(e) => {
                        setHeureDebut(e.target.value);
                        effacerErreur('heureDebut');
                      }}
                      disabled={submitting}
                      aria-invalid={Boolean(fieldErrors.heureDebut)}
                    />
                    <ChampErreur message={fieldErrors.heureDebut} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="realiser-fin">Heure fin *</label>
                    <input
                      id="realiser-fin"
                      type="time"
                      className={inputClass}
                      value={heureFin}
                      onChange={(e) => {
                        setHeureFin(e.target.value);
                        effacerErreur('heureFin');
                      }}
                      disabled={submitting}
                      aria-invalid={Boolean(fieldErrors.heureFin)}
                    />
                    <ChampErreur message={fieldErrors.heureFin} />
                  </div>
                </div>

                <div>
                  <label className={labelClass} htmlFor="realiser-salle">Salle *</label>
                  <input
                    id="realiser-salle"
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
                  <label className={labelClass} htmlFor="realiser-type">Type de séance *</label>
                  <select
                    id="realiser-type"
                    className={inputClass}
                    value={typeSeance}
                    onChange={(e) => {
                      setTypeSeance(e.target.value);
                      effacerErreur('typeSeance');
                    }}
                    disabled={submitting}
                    aria-invalid={Boolean(fieldErrors.typeSeance)}
                  >
                    {optionType}
                  </select>
                  <ChampErreur message={fieldErrors.typeSeance} />
                </div>

                <div>
                  <label className={labelClass} htmlFor="realiser-contenu">Contenu enseigné *</label>
                  <textarea
                    id="realiser-contenu"
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

                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => ouvrirMode('detail')}
                    disabled={submitting}
                    className="emit-btn-ghost"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={confirmerRealisation}
                    disabled={submitting}
                    className="emit-btn-primary"
                  >
                    <CheckCircle2 size={15} aria-hidden="true" />
                    {submitting ? 'Enregistrement...' : 'Confirmer la réalisation'}
                  </button>
                </div>
              </div>
            )}

            {/* Confirmation d'annulation */}
            {mode === 'annuler' && (
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <p>
                    La séance sera marquée <strong>Annulée</strong>, ne comptera aucune heure
                    réalisée et restera visible dans l&apos;historique.
                  </p>
                </div>

                <div>
                  <label className={labelClass} htmlFor="annuler-motif">Justification (facultative)</label>
                  <textarea
                    id="annuler-motif"
                    className={`${inputClass} min-h-[80px]`}
                    value={motifAnnulation}
                    onChange={(e) => setMotifAnnulation(e.target.value)}
                    disabled={submitting}
                    placeholder="Motif de l'annulation..."
                  />
                </div>

                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setMode('detail')}
                    disabled={submitting}
                    className="emit-btn-ghost"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={confirmerAnnulation}
                    disabled={submitting}
                    className="emit-btn-danger"
                  >
                    <XCircle size={15} aria-hidden="true" />
                    {submitting ? 'Annulation...' : "Confirmer l'annulation"}
                  </button>
                </div>
              </div>
            )}

            {/* Formulaire de correction exceptionnelle */}
            {mode === 'corriger' && (
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <p>
                    Cette séance est déjà <strong>réalisée</strong>. Toute correction est une
                    opération exceptionnelle : les valeurs avant/après et le motif sont conservés
                    dans l&apos;historique.
                  </p>
                </div>

                <div>
                  <label className={labelClass} htmlFor="corriger-date">Date effective</label>
                  <input
                    id="corriger-date"
                    type="date"
                    className={inputClass}
                    value={dateSeance}
                    onChange={(e) => setDateSeance(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="corriger-debut">Heure début</label>
                    <input
                      id="corriger-debut"
                      type="time"
                      className={inputClass}
                      value={heureDebut}
                      onChange={(e) => setHeureDebut(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="corriger-fin">Heure fin</label>
                    <input
                      id="corriger-fin"
                      type="time"
                      className={inputClass}
                      value={heureFin}
                      onChange={(e) => setHeureFin(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass} htmlFor="corriger-salle">Salle</label>
                  <input
                    id="corriger-salle"
                    type="text"
                    className={inputClass}
                    value={salle}
                    onChange={(e) => setSalle(e.target.value)}
                    disabled={submitting}
                    placeholder={PLACEHOLDER_SALLE}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="corriger-type">Type de séance</label>
                  <select
                    id="corriger-type"
                    className={inputClass}
                    value={typeSeance}
                    onChange={(e) => setTypeSeance(e.target.value)}
                    disabled={submitting}
                  >
                    {optionType}
                  </select>
                </div>

                <div>
                  <label className={labelClass} htmlFor="corriger-contenu">Contenu enseigné</label>
                  <textarea
                    id="corriger-contenu"
                    className={`${inputClass} min-h-[80px]`}
                    value={contenuEnseigne}
                    onChange={(e) => setContenuEnseigne(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="corriger-motif">Motif de la correction</label>
                  <textarea
                    id="corriger-motif"
                    className={`${inputClass} min-h-[60px]`}
                    value={motifCorrection}
                    onChange={(e) => setMotifCorrection(e.target.value)}
                    disabled={submitting}
                    placeholder="Pourquoi cette correction ?"
                  />
                </div>

                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setMode('detail')}
                    disabled={submitting}
                    className="emit-btn-ghost"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={confirmerCorrection}
                    disabled={submitting}
                    className="emit-btn-primary"
                  >
                    <Save size={15} aria-hidden="true" />
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

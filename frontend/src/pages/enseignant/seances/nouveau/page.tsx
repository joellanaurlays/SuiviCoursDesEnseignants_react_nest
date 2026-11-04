import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../../../components/Layout';
import { ArrowLeft, CalendarClock, CheckCircle2, Info, Save, Timer } from 'lucide-react';
import { useAuth } from '../../../../auth/AuthContext';
import { enseignementService } from '../../../../services/enseignement.service';
import { seanceService } from '../../../../services/seance.service';
import { EnseignementAvecSuivi, StatutSeance } from '../../../../types/enseignement';
import { OPTIONS_TYPE_SEANCE, PLACEHOLDER_SALLE } from '../../../../utils/seance-form-options';

export default function DeclarerSeance() {
  const navigate = useNavigate();
  const { headers } = useAuth();

  const [enseignements, setEnseignements] = useState<EnseignementAvecSuivi[]>([]);
  const [chargementEnseignements, setChargementEnseignements] = useState(true);
  const [enseignementId, setEnseignementId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [heureDebut, setHeureDebut] = useState('08:30');
  const [heureFin, setHeureFin] = useState('10:00');
  const [contenu, setContenu] = useState('');
  const [salle, setSalle] = useState('');
  const [typeSeance, setTypeSeance] = useState('');
  const [statut, setStatut] = useState<StatutSeance>('REALISEE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setChargementEnseignements(true);
    enseignementService
      .list(headers)
      .then((data) => {
        if (cancelled) return;
        setEnseignements(data);
        if (data.length > 0) {
          setEnseignementId(data[0].id);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Impossible de charger vos enseignements.');
      })
      .finally(() => {
        if (!cancelled) setChargementEnseignements(false);
      });
    return () => {
      cancelled = true;
    };
  }, [headers]);

  const calculateDuration = () => {
    if (!heureDebut || !heureFin) return '0h 0m';
    const [h1, m1] = heureDebut.split(':').map(Number);
    const [h2, m2] = heureFin.split(':').map(Number);
    const diff = h2 * 60 + m2 - (h1 * 60 + m1);
    if (diff < 0) return '0h 0m';
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}h ${m}m`;
  };

  const handleEnregistrer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enseignementId) {
      setError('Veuillez sélectionner une matière.');
      return;
    }
    if (heureFin <= heureDebut) {
      setError("L'heure de fin doit être postérieure à l'heure de début.");
      return;
    }
    if (statut === 'REALISEE' && contenu.trim().length === 0) {
      setError('Le contenu enseigné est obligatoire pour déclarer une séance réalisée.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await seanceService.create(
        {
          enseignementId,
          dateSeance: new Date(date).toISOString(),
          heureDebut,
          heureFin,
          contenuEnseigne: contenu,
          salle: salle.trim() || undefined,
          typeSeance: typeSeance || undefined,
          statut,
        },
        headers,
      );
      navigate('/enseignant/seances');
    } catch (err) {
      const message = (err as { message?: string }).message;
      setError(message ?? 'Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'emit-input';
  const labelClass = 'emit-label';

  const enseignementSelectionne = enseignements.find((e) => e.id === enseignementId);

  return (
    <Layout>
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <button
            onClick={() => navigate('/enseignant/seances')}
            className="inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm font-semibold text-[#0077B6] transition hover:text-[#03045E]"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Mes séances
          </button>
          <div className="mt-3">
            <p className="emit-eyebrow">Espace enseignant</p>
            <h1 className="emit-title mt-1">Déclarer une séance</h1>
            <p className="emit-subtitle mt-1">
              Heures réalisées, progression et état sont recalculés automatiquement par le backend.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700" role="alert">
            {error}
          </div>
        )}

        {chargementEnseignements ? (
          <div className="emit-card p-10 text-center text-sm text-slate-500">
            Chargement de vos enseignements...
          </div>
        ) : enseignements.length === 0 ? (
          <div className="emit-card p-10 text-center">
            <p className="text-sm font-semibold text-[#03045E]">Aucun enseignement ne vous est affecté.</p>
            <p className="mt-1 text-sm text-slate-500">Vous ne pouvez pas déclarer de séance.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <form onSubmit={handleEnregistrer} className="emit-card space-y-5 p-6 lg:col-span-2">
              <div>
                <label className={labelClass} htmlFor="decl-matiere">Matière d&apos;enseignement *</label>
                <select
                  id="decl-matiere"
                  value={enseignementId}
                  onChange={(e) => setEnseignementId(e.target.value)}
                  className={inputClass}
                  required
                >
                  <option value="" disabled>
                    Sélectionner une matière
                  </option>
                  {enseignements.map((ens) => (
                    <option key={ens.id} value={ens.id}>
                      {ens.matiere} ({ens.niveau} - {ens.parcours})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass} htmlFor="decl-date">Date de la séance *</label>
                <input
                  id="decl-date"
                  type="date"
                  className={inputClass}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="decl-debut">Heure début *</label>
                  <input
                    id="decl-debut"
                    type="time"
                    className={inputClass}
                    value={heureDebut}
                    onChange={(e) => setHeureDebut(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="decl-fin">Heure fin *</label>
                  <input
                    id="decl-fin"
                    type="time"
                    className={inputClass}
                    value={heureFin}
                    onChange={(e) => setHeureFin(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-[#90E0EF] bg-[#CAF0F8] px-3 py-2.5 text-sm text-[#03045E]">
                <Info size={16} className="shrink-0 text-[#0077B6]" aria-hidden="true" />
                <span>
                  Durée calculée automatiquement :{' '}
                  <span className="font-bold">{calculateDuration()}</span>
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="decl-salle">Salle</label>
                  <input
                    id="decl-salle"
                    type="text"
                    className={inputClass}
                    placeholder={PLACEHOLDER_SALLE}
                    value={salle}
                    onChange={(e) => setSalle(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="decl-type">Type de séance</label>
                  <select
                    id="decl-type"
                    value={typeSeance}
                    onChange={(e) => setTypeSeance(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">-- Sélectionner --</option>
                    {OPTIONS_TYPE_SEANCE.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="decl-statut">Statut de la séance</label>
                <select
                  id="decl-statut"
                  value={statut}
                  onChange={(e) => setStatut(e.target.value as StatutSeance)}
                  className={inputClass}
                >
                  <option value="REALISEE">Réalisée (comptabilisée dans les heures)</option>
                  <option value="PLANIFIEE">Planifiée (programmée, non comptabilisée)</option>
                </select>
              </div>

              <div>
                <label className={labelClass} htmlFor="decl-contenu">
                  Contenu enseigné {statut === 'REALISEE' ? '*' : '(facultatif pour une séance planifiée)'}
                </label>
                <textarea
                  id="decl-contenu"
                  className={`${inputClass} min-h-[130px]`}
                  placeholder="Décrivez le contenu abordé durant cette séance..."
                  value={contenu}
                  onChange={(e) => setContenu(e.target.value)}
                  required={statut === 'REALISEE'}
                />
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/enseignant/seances')}
                  disabled={loading}
                  className="emit-btn-ghost"
                >
                  Annuler
                </button>
                <button type="submit" disabled={loading} className="emit-btn-primary">
                  <Save size={15} aria-hidden="true" />
                  {loading ? 'Enregistrement...' : 'Enregistrer la séance'}
                </button>
              </div>
            </form>

            <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
              <div className="emit-card p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#CAF0F8] text-[#03045E]" aria-hidden="true">
                    <CalendarClock size={17} />
                  </span>
                  <h2 className="text-sm font-bold text-[#03045E]">Aperçu de la séance</h2>
                </div>
                <dl className="space-y-2 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate-500">Matière</dt>
                    <dd className="text-right font-semibold text-[#03045E]">
                      {enseignementSelectionne?.matiere ?? '—'}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate-500">Date</dt>
                    <dd className="text-right font-semibold text-[#03045E]">
                      {date ? new Date(date).toLocaleDateString('fr-FR') : '—'}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate-500">Horaire</dt>
                    <dd className="inline-flex items-center gap-1 text-right font-semibold text-[#03045E]">
                      <Timer size={13} aria-hidden="true" />
                      {heureDebut} - {heureFin}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate-500">Durée</dt>
                    <dd className="text-right font-semibold text-[#03045E]">{calculateDuration()}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate-500">Statut</dt>
                    <dd
                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold ${
                        statut === 'REALISEE'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      <CheckCircle2 size={12} aria-hidden="true" />
                      {statut === 'REALISEE' ? 'Réalisée' : 'Planifiée'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-[#90E0EF] bg-[#CAF0F8]/60 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-[#03045E]">Rappel</p>
                <p className="mt-1 text-sm text-slate-700">
                  Une séance <strong>réalisée</strong> est comptabilisée dans les heures et la
                  progression. Une séance <strong>planifiée</strong> reste programmée.
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </Layout>
  );
}

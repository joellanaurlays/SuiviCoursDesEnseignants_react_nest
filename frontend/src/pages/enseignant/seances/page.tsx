import { useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../../components/Layout';
import { CalendarDays, ChevronDown, ListChecks, Plus, Search } from 'lucide-react';
import { useAuth } from '../../../auth/AuthContext';
import { seanceService } from '../../../services/seance.service';
import { LoadingState } from '../../../components/ui/LoadingState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SeanceStatutBadge } from '../../../components/enseignements/SeanceStatutBadge';
import { SeanceDetailModal } from '../../../components/enseignements/SeanceDetailModal';
import { Seance } from '../../../types/enseignement';
import { formatDate, formatDuree, formatHoraire } from '../../../utils/format';

export default function EnseignantSeancesPage() {
  const navigate = useNavigate();
  const { headers } = useAuth();
  const [seances, setSeances] = useState<Seance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [matiere, setMatiere] = useState('');
  const [statut, setStatut] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const charger = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    seanceService
      .getAll(headers)
      .then((d) => {
        if (!cancelled) setSeances(d);
      })
      .catch((e: { message?: string }) => {
        if (!cancelled) setError(e.message ?? 'Impossible de charger les séances.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [headers]);

  useEffect(() => charger(), [charger]);

  const matieres = useMemo(
    () => Array.from(new Set(seances.map((s) => s.enseignement?.matiereId ?? '—'))).sort(),
    [seances],
  );

  const statusSummary = useMemo<{ planifiee: number; realisee: number; annulee: number }>(() => {
    const summary = { planifiee: 0, realisee: 0, annulee: 0 };
    seances.forEach((s) => {
      switch (s.statut) {
        case 'PLANIFIEE':
          summary.planifiee++;
          break;
        case 'REALISEE':
          summary.realisee++;
          break;
        case 'ANNULEE':
          summary.annulee++;
          break;
      }
    });
    return summary;
  }, [seances]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return seances.filter((seance) => {
      const matchMatiere = !matiere || (seance.enseignement?.matiereId ?? '') === matiere;
      const matchStatut = !statut || seance.statut === statut;
      const matchSearch =
        !q ||
        (seance.enseignement?.matiereId ?? '').toLowerCase().includes(q) ||
        (seance.contenuEnseigne ?? '').toLowerCase().includes(q);
      return matchMatiere && matchStatut && matchSearch;
    });
  }, [seances, matiere, statut, search]);

  const nbFiltres = [search.trim(), matiere, statut].filter(Boolean).length;

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="emit-eyebrow">Espace enseignant</p>
          <h1 className="emit-title mt-1">Mes séances</h1>
          <p className="emit-subtitle mt-1">Déclarez, consultez et suivez vos séances de cours.</p>
        </div>
        <button
          onClick={() => navigate('/enseignant/seances/nouveau')}
          className="emit-btn-primary w-fit"
        >
          <Plus size={16} aria-hidden="true" />
          Déclarer une séance
        </button>
      </div>

      {/* Résumé des statuts (apport de l'équipe, restitué dans le design EMIT). */}
      {(statusSummary.planifiee > 0 || statusSummary.realisee > 0 || statusSummary.annulee > 0) && (
        <div className="mb-4 flex flex-col gap-2 text-xs font-medium sm:flex-row">
          <span className="emit-chip bg-[#CAF0F8] text-[#03045E] ring-1 ring-inset ring-[#90E0EF]">
            {statusSummary.planifiee} planifiée
          </span>
          <span className="emit-chip bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
            {statusSummary.realisee} réalisée
          </span>
          <span className="emit-chip bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200">
            {statusSummary.annulee} annulée
          </span>
        </div>
      )}

      {loading ? (
        <LoadingState label="Chargement des séances..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 bg-slate-50/60 p-4">
            <div className="relative min-w-56 flex-1 basis-56">
              <label htmlFor="ens-recherche" className="emit-label">
                Recherche
              </label>
              <div className="relative">
                <Search
                  size={16}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="ens-recherche"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Matière, contenu..."
                  className="emit-input pl-9"
                />
              </div>
            </div>

            <div className="min-w-40 flex-1 basis-40">
              <label htmlFor="ens-matiere" className="emit-label">
                Matière
              </label>
              <div className="relative">
                <select
                  id="ens-matiere"
                  value={matiere}
                  onChange={(e) => setMatiere(e.target.value)}
                  className="emit-input appearance-none pr-9"
                >
                  <option value="">Toutes</option>
                  {matieres.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            <div className="min-w-40 flex-1 basis-40">
              <label htmlFor="ens-statut" className="emit-label">
                Statut
              </label>
              <div className="relative">
                <select
                  id="ens-statut"
                  value={statut}
                  onChange={(e) => setStatut(e.target.value)}
                  className="emit-input appearance-none pr-9"
                >
                  <option value="">Tous</option>
                  <option value="REALISEE">Réalisée</option>
                  <option value="PLANIFIEE">Planifiée</option>
                  <option value="ANNULEE">Annulée</option>
                </select>
                <ChevronDown
                  size={16}
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            {nbFiltres > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setMatiere('');
                  setStatut('');
                }}
                className="emit-btn-ghost"
              >
                Réinitialiser
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 pb-2 text-sm font-semibold text-slate-500">
                <ListChecks size={15} aria-hidden="true" className="text-[#0077B6]" />
                {filtered.length} séance(s)
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead className="emit-table-head">
                <tr>
                  <th scope="col" className="emit-table-th">Date</th>
                  <th scope="col" className="emit-table-th">Matière</th>
                  <th scope="col" className="emit-table-th">Type</th>
                  <th scope="col" className="emit-table-th">Horaire</th>
                  <th scope="col" className="emit-table-th">Salle</th>
                  <th scope="col" className="emit-table-th">Durée</th>
                  <th scope="col" className="emit-table-th">Statut</th>
                  <th scope="col" className="emit-table-th">Contenu enseigné</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((seance) => (
                  <tr
                    key={seance.id}
                    onClick={() => setSelectedId(seance.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedId(seance.id);
                      }
                    }}
                    tabIndex={0}
                    aria-label={`Voir le détail de la séance du ${formatDate(seance.dateSeance)}`}
                    className="cursor-pointer transition-colors hover:bg-[#CAF0F8]/40 focus:bg-[#CAF0F8]/60 focus:outline-none"
                  >
                    <td className="emit-table-td whitespace-nowrap font-medium text-slate-700">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={14} className="text-slate-400" aria-hidden="true" />
                        {formatDate(seance.dateSeance)}
                      </span>
                    </td>
                    <td className="emit-table-td whitespace-nowrap font-bold text-[#03045E]">
                      {seance.enseignement?.matiereId ?? '—'}
                    </td>
                    <td className="emit-table-td whitespace-nowrap text-slate-500">
                      {seance.typeSeance || <span className="italic text-slate-400">—</span>}
                    </td>
                    <td className="emit-table-td whitespace-nowrap text-slate-500">
                      {formatHoraire(seance.heureDebut, seance.heureFin)}
                    </td>
                    <td className="emit-table-td whitespace-nowrap text-slate-500">
                      {seance.salle || <span className="italic text-slate-400">—</span>}
                    </td>
                    <td className="emit-table-td whitespace-nowrap text-slate-500">{formatDuree(seance.duree)}</td>
                    <td className="emit-table-td">
                      <SeanceStatutBadge statut={seance.statut} />
                    </td>
                    <td className="emit-table-td max-w-sm text-slate-500">
                      {seance.contenuEnseigne || <span className="italic text-slate-400">Non renseigné</span>}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState
                        message="Aucune séance trouvée."
                        hint="Déclarez votre première séance ou ajustez les filtres."
                        action={
                          <button
                            onClick={() => navigate('/enseignant/seances/nouveau')}
                            className="emit-btn-primary"
                          >
                            <Plus size={15} aria-hidden="true" />
                            Déclarer une séance
                          </button>
                        }
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedId && (
        <SeanceDetailModal
          seanceId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={charger}
        />
      )}
    </Layout>
  );
}

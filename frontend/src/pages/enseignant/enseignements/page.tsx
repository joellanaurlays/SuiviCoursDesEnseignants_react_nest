import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../../../components/Layout';
import { FilterBar, FilterField } from '../../../components/enseignements/FilterBar';
import { SuiviStatCards } from '../../../components/enseignements/SuiviStatCards';
import { LoadingState } from '../../../components/ui/LoadingState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ProgressionBar } from '../../../components/ui/ProgressionBar';
import { EtatBadge } from '../../../components/enseignements/EtatBadge';
import { useAuth } from '../../../auth/AuthContext';
import { suiviService } from '../../../services/suivi.service';
import {
  SuiviEnseignement,
  SuiviQuery,
  SuiviStatistiques,
  EtatEnseignement,
  Cycle,
  FiltreCloture,
} from '../../../types/enseignement';

function tagClasses(cycle?: string) {
  return cycle === 'MASTER'
    ? 'bg-[#03045E] text-white'
    : 'bg-[#CAF0F8] text-[#03045E]';
}

function distinct(options: string[]): { value: string; label: string }[] {
  return Array.from(new Set(options)).sort().map((value) => ({ value, label: value }));
}

export default function EnseignantEnseignementsPage() {
  const { headers } = useAuth();
  const [fullData, setFullData] = useState<SuiviEnseignement[]>([]);
  const [enseignements, setEnseignements] = useState<SuiviEnseignement[]>([]);
  const [stats, setStats] = useState<SuiviStatistiques | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<SuiviQuery>({});

  // Le périmètre (ses propres enseignements) est imposé par le backend à partir
  // du rôle authentifié : l'enseignant ne peut jamais consulter ceux d'un autre.
  const applyFilters = useCallback(
    async (filters: SuiviQuery) => {
      setLoading(true);
      setError(null);
      setApplied(filters);
      try {
        const [data, statistiques] = await Promise.all([
          suiviService.list(filters, headers),
          suiviService.statistiques(filters, headers),
        ]);
        setEnseignements(data);
        setStats(statistiques);
      } catch (e) {
        setError((e as { message?: string }).message ?? 'Impossible de charger les enseignements.');
        setEnseignements([]);
        setStats(null);
      } finally {
        setLoading(false);
      }
    },
    [headers],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    suiviService
      .list({}, headers)
      .then((all) => {
        if (!cancelled) setFullData(all);
      })
      .catch(() => {
        if (!cancelled) setFullData([]);
      });

    Promise.all([suiviService.list({}, headers), suiviService.statistiques({}, headers)])
      .then(([data, statistiques]) => {
        if (cancelled) return;
        setEnseignements(data);
        setStats(statistiques);
      })
      .catch((e: { message?: string }) => {
        if (!cancelled) {
          setError(e.message ?? 'Impossible de charger les enseignements.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [headers]);

  const fields: FilterField[] = [
    { key: 'matiere', label: 'Matière', options: distinct(fullData.map((e) => e.matiere)) },
    { key: 'mention', label: 'Mention', options: distinct(fullData.map((e) => e.mention)) },
    { key: 'parcours', label: 'Parcours', options: distinct(fullData.map((e) => e.parcours)) },
    { key: 'cycle', label: 'Cycle', options: distinct(fullData.map((e) => e.cycle)) },
    { key: 'niveau', label: 'Niveau', options: distinct(fullData.map((e) => e.niveau)) },
    { key: 'semestre', label: 'Semestre', options: distinct(fullData.map((e) => e.semestre)) },
    {
      key: 'anneeUniversitaire',
      label: 'Année univ.',
      options: distinct(fullData.map((e) => e.anneeUniversitaire)),
    },
    {
      key: 'etat',
      label: 'État',
      options: [
        { value: 'NON_COMMENCE', label: 'Non commencé' },
        { value: 'EN_COURS', label: 'En cours' },
        { value: 'TERMINE', label: 'Terminé' },
      ],
    },
  ];

  const handleFiltersChange = (filters: Record<string, string>) => {
    applyFilters({
      matiere: filters.matiere || undefined,
      mention: filters.mention || undefined,
      parcours: filters.parcours || undefined,
      cycle: (filters.cycle as Cycle) || undefined,
      niveau: filters.niveau || undefined,
      semestre: filters.semestre || undefined,
      anneeUniversitaire: filters.anneeUniversitaire || undefined,
      etat: (filters.etat as EtatEnseignement) || undefined,
      cloture: (filters.cloture as FiltreCloture) || undefined,
      search: applied.search,
    });
  };

  const handleSearch = (term: string) => {
    applyFilters({ ...applied, search: term || undefined });
  };

  return (
    <Layout>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="emit-eyebrow">Espace enseignant</p>
            <h1 className="emit-title mt-1">Mes enseignements</h1>
          </div>
          <span className="inline-flex w-fit items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 shadow-sm">
            {enseignements.length} affiché(s) sur {fullData.length}
          </span>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={() => applyFilters(applied)} />
        ) : (
          <>
            <SuiviStatCards stats={stats} loading={loading} />

            <FilterBar
              fields={fields}
              filters={{
                matiere: applied.matiere ?? '',
                mention: applied.mention ?? '',
                parcours: applied.parcours ?? '',
                cycle: applied.cycle ?? '',
                niveau: applied.niveau ?? '',
                semestre: applied.semestre ?? '',
                anneeUniversitaire: applied.anneeUniversitaire ?? '',
                etat: applied.etat ?? '',
              }}
              onFiltersChange={handleFiltersChange}
              onSearch={handleSearch}
              searchValue={applied.search ?? ''}
              onReset={() => applyFilters({})}
            />

            {loading ? (
              <LoadingState label="Chargement des enseignements..." />
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {enseignements.map((ens) => (
                  <Link
                    to={`/enseignant/enseignements/${ens.id}`}
                    key={ens.id}
                    className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#90E0EF] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-xl font-bold text-[#03045E]">{ens.matiere}</h2>
                        <p className="mt-1 text-sm text-slate-500">
                          {ens.mention} · {ens.parcours}
                        </p>
                      </div>
                      <EtatBadge etat={ens.etat} />
                    </div>

                    <div className="mb-6 flex flex-wrap gap-2">
                      <span className={`rounded-lg px-2 py-1 text-xs font-bold ${tagClasses(ens.cycle)}`}>
                        {ens.cycle}
                      </span>
                      <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                        {ens.niveau}
                      </span>
                      <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                        {ens.semestre}
                      </span>
                      <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                        {ens.anneeUniversitaire}
                      </span>
                    </div>

                    <div className="mb-6 grid grid-cols-3 gap-4 text-center">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Prévu</p>
                        <p className="text-lg font-extrabold text-[#03045E]">{ens.volumePrevu}h</p>
                      </div>
                      <div className="rounded-xl border border-[#90E0EF] bg-[#CAF0F8] px-2 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-[#0077B6]">Réalisé</p>
                        <p className="text-lg font-extrabold text-[#03045E]">{ens.heuresRealisees}h</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Reste</p>
                        <p className="text-lg font-extrabold text-[#03045E]">{ens.heuresRestantes}h</p>
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-end justify-between">
                        <span className="text-sm text-slate-500">Progression</span>
                        <span className="text-sm font-bold text-[#03045E]">{ens.progression}%</span>
                      </div>
                      <ProgressionBar progression={ens.progression} />
                    </div>
                  </Link>
                ))}
                {enseignements.length === 0 && (
                  <div className="col-span-full">
                    <EmptyState message="Aucun enseignement ne correspond à vos critères." />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

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
  return cycle === 'MASTER' ? 'bg-[#03045E] text-white' : 'bg-gray-100 text-gray-700';
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
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h1 className="text-3xl font-bold text-[#03045E]">Mes enseignements</h1>
          <span className="text-sm text-gray-500">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {enseignements.map((ens) => (
                  <Link
                    to={`/enseignant/enseignements/${ens.id}`}
                    key={ens.id}
                    className="block bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-[#03045E]">{ens.matiere}</h2>
                        <p className="text-sm text-gray-500 mt-1">
                          {ens.mention} · {ens.parcours}
                        </p>
                      </div>
                      <EtatBadge etat={ens.etat} />
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${tagClasses(ens.cycle)}`}>
                        {ens.cycle}
                      </span>
                      <span className="text-xs px-2 py-1 rounded font-medium bg-gray-100 text-gray-700">
                        {ens.niveau}
                      </span>
                      <span className="text-xs px-2 py-1 rounded font-medium bg-gray-100 text-gray-700">
                        {ens.semestre}
                      </span>
                      <span className="text-xs px-2 py-1 rounded font-medium bg-gray-100 text-gray-700">
                        {ens.anneeUniversitaire}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                      <div>
                        <p className="text-xs text-gray-500">Prévu</p>
                        <p className="font-bold text-[#03045E]">{ens.volumePrevu}h</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Réalisé</p>
                        <p className="font-bold text-[#0077B6]">{ens.heuresRealisees}h</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Reste</p>
                        <p className="font-bold text-[#03045E]">{ens.heuresRestantes}h</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-sm text-gray-500">Progression</span>
                        <span className="text-sm font-bold">{ens.progression}%</span>
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

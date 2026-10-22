import { useCallback, useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { FilterBar, FilterField } from '../../components/enseignements/FilterBar';
import { EnseignementTable } from '../../components/enseignements/EnseignementTable';
import { SuiviStatCards } from '../../components/enseignements/SuiviStatCards';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useAuth } from '../../auth/AuthContext';
import { suiviService } from '../../services/suivi.service';
import {
  SuiviEnseignement,
  SuiviQuery,
  SuiviStatistiques,
  EtatEnseignement,
  Cycle,
  FiltreCloture,
} from '../../types/enseignement';

interface SuiviListPageProps {
  title: string;
  intro?: string;
  detailBasePath: string;
  hideMention?: boolean;
  hideParcours?: boolean;
  fixedCycle?: string;
}

function distinct(options: string[]): { value: string; label: string }[] {
  return Array.from(new Set(options)).sort().map((value) => ({ value, label: value }));
}

export function SuiviListPage({
  title,
  intro,
  detailBasePath,
  hideMention = false,
  hideParcours = false,
  fixedCycle,
}: SuiviListPageProps) {
  const { headers } = useAuth();
  const [fullData, setFullData] = useState<SuiviEnseignement[]>([]);
  const [rows, setRows] = useState<SuiviEnseignement[]>([]);
  const [stats, setStats] = useState<SuiviStatistiques | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<SuiviQuery>({});

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
        setRows(data);
        setStats(statistiques);
      } catch (e) {
        setError((e as { message?: string }).message ?? 'Impossible de charger les enseignements.');
        setRows([]);
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
        if (cancelled) return;
        setFullData(all);
      })
      .catch(() => {
        if (!cancelled) setFullData([]);
      });

    Promise.all([suiviService.list({}, headers), suiviService.statistiques({}, headers)])
      .then(([data, statistiques]) => {
        if (cancelled) return;
        setRows(data);
        setStats(statistiques);
      })
      .catch((e) => {
        if (!cancelled) {
          setError((e as { message?: string }).message ?? 'Impossible de charger les enseignements.');
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
    { key: 'enseignant', label: 'Enseignant', options: distinct(fullData.map((e) => e.enseignant)) },
    { key: 'matiere', label: 'Matière', options: distinct(fullData.map((e) => e.matiere)) },
    ...(hideMention
      ? []
      : [{ key: 'mention', label: 'Mention', options: distinct(fullData.map((e) => e.mention)) } as FilterField]),
    // Le parcours est masqué pour un responsable : son périmètre est déjà
    // verrouillé sur un seul parcours côté backend.
    ...(hideParcours
      ? []
      : [{ key: 'parcours', label: 'Parcours', options: distinct(fullData.map((e) => e.parcours)) } as FilterField]),
    ...(fixedCycle
      ? []
      : [{ key: 'cycle', label: 'Cycle', options: distinct(fullData.map((e) => e.cycle)) } as FilterField]),
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
    {
      key: 'cloture',
      label: 'Clôture',
      options: [
        { value: 'NORMALE', label: 'Volume atteint' },
        { value: 'ANTICIPEE', label: 'Anticipée' },
      ],
    },
  ];

  const handleFiltersChange = (filters: Record<string, string>) => {
    applyFilters({
      enseignant: filters.enseignant || undefined,
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
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-2 border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold text-[#03045E]">{title}</h1>
            {intro && <p className="text-sm text-gray-500 mt-1">{intro}</p>}
          </div>
          <span className="text-sm text-gray-500">{rows.length} affiché(s) sur {fullData.length}</span>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={() => applyFilters(applied)} />
        ) : (
          <>
            <SuiviStatCards stats={stats} loading={loading} />

            <FilterBar
              fields={fields}
              filters={{
                enseignant: applied.enseignant ?? '',
                matiere: applied.matiere ?? '',
                mention: applied.mention ?? '',
                parcours: applied.parcours ?? '',
                cycle: applied.cycle ?? '',
                niveau: applied.niveau ?? '',
                semestre: applied.semestre ?? '',
                anneeUniversitaire: applied.anneeUniversitaire ?? '',
                etat: applied.etat ?? '',
                cloture: applied.cloture ?? '',
              }}
              onFiltersChange={handleFiltersChange}
              onSearch={handleSearch}
              searchValue={applied.search ?? ''}
              onReset={() => applyFilters({})}
            />

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {loading ? (
                <LoadingState label="Application des filtres..." />
              ) : (
                <EnseignementTable enseignement={rows} detailBasePath={detailBasePath} />
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

import { useEffect, useState } from 'react';
import { Layout } from '../../../components/Layout';
import { StatCard } from '../../../components/ui/StatCard';
import { LoadingState } from '../../../components/ui/LoadingState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ProgressionBar } from '../../../components/ui/ProgressionBar';
import { useAuth } from '../../../auth/AuthContext';
import { dashboardService } from '../../../services/dashboard.service';
import { DashboardResponse } from '../../../types/enseignement';
import { formatDate } from '../../../utils/format';
import { CalendarClock, Info } from 'lucide-react';

export default function EnseignantDashboard() {
  const { session, headers } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    dashboardService
      .get(session.userId, headers)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e: { message?: string }) => {
        if (!cancelled) setError(e.message ?? 'Impossible de charger le tableau de bord.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session.userId, headers]);

  return (
    <Layout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="emit-eyebrow">Espace enseignant</p>
          <h1 className="emit-title mt-1">Tableau de bord</h1>
          <p className="emit-subtitle mt-1">Vue d&apos;ensemble de vos enseignements et de votre progression.</p>
        </div>

        {loading ? (
          <LoadingState label="Chargement du tableau de bord..." />
        ) : error ? (
          <ErrorState message={error} />
        ) : !data ? (
          <EmptyState message="Aucune donnée disponible." />
        ) : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Enseignements" value={data.stats.totalEnseignements} tone="primary" icon={<CalendarClock size={18} />} />
              <StatCard label="Séances réalisées" value={data.stats.totalSeancesRealisees} tone="info" />
              <StatCard label="Heures réalisées" value={`${data.stats.totalHeuresRealisees}h`} tone="success" accent />
              <StatCard label="Progression moyenne" value={`${Math.round(data.stats.averageProgression)}%`} tone="primary" />
            </div>

            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <StatCard
                label="Terminés (volume atteint)"
                value={data.stats.terminesParVolumeAtteint}
                tone="success"
              />
              <StatCard
                label="Clôtures anticipées"
                value={data.stats.terminesParClotureAnticipee}
                tone="warning"
                accent
              />
              <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <Info size={18} className="mt-0.5 shrink-0 text-[#0077B6]" aria-hidden="true" />
                <p className="text-xs text-slate-500">
                  Une clôture anticipée termine l&apos;enseignement sans atteindre le volume : la
                  progression affichée reste celle des heures réellement réalisées.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#CAF0F8] text-[#03045E]" aria-hidden="true">
                    <CalendarClock size={17} />
                  </span>
                  <h2 className="text-lg font-bold text-[#03045E]">Prochaines séances</h2>
                </div>
                {data.prochainesSeances.length > 0 ? (
                  <div className="space-y-3">
                    {data.prochainesSeances.map((seance) => (
                      <div key={seance.id} className="rounded-xl border-l-4 border-[#00B4D8] bg-[#CAF0F8]/50 px-4 py-3">
                        <p className="font-bold text-[#03045E]">{seance.matiereId}</p>
                        <p className="mt-0.5 text-sm text-slate-500">
                          {formatDate(seance.dateSeance)} · {seance.heureDebut} - {seance.heureFin}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="Aucune séance planifiée." />
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                <h2 className="mb-4 text-lg font-bold text-[#03045E]">Progression par matière</h2>
                {data.progressionParMatiere.length > 0 ? (
                  <div className="space-y-5">
                    {data.progressionParMatiere.map((prog, index) => (
                      <div key={`${prog.matiereId}-${index}`}>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-semibold text-[#03045E]">{prog.matiereId}</span>
                          <span className="text-sm font-bold text-slate-600">{prog.progression}%</span>
                        </div>
                        <ProgressionBar progression={prog.progression} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="Aucune donnée de progression." />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
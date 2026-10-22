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
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold text-[#03045E]">Tableau de bord</h1>
        </div>

        {loading ? (
          <LoadingState label="Chargement du tableau de bord..." />
        ) : error ? (
          <ErrorState message={error} />
        ) : !data ? (
          <EmptyState message="Aucune donnée disponible." />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard label="Enseignements" value={data.stats.totalEnseignements} />
              <StatCard label="Séances réalisées" value={data.stats.totalSeancesRealisees} />
              <StatCard label="Heures réalisées" value={`${data.stats.totalHeuresRealisees}h`} accent />
              <StatCard label="Progression moyenne" value={`${Math.round(data.stats.averageProgression)}%`} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard
                label="Terminés (volume atteint)"
                value={data.stats.terminesParVolumeAtteint}
              />
              <StatCard
                label="Clôtures anticipées"
                value={data.stats.terminesParClotureAnticipee}
                accent
              />
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-3">
                <Info size={18} className="text-gray-400 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-500">
                  Une clôture anticipée termine l'enseignement sans atteindre le volume : la
                  progression affichée reste celle des heures réellement réalisées.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarClock size={20} className="text-[#0077B6]" />
                  <h2 className="text-lg font-bold text-[#03045E]">Prochaines séances</h2>
                </div>
                {data.prochainesSeances.length > 0 ? (
                  <div className="space-y-4">
                    {data.prochainesSeances.map((seance) => (
                      <div key={seance.id} className="border-l-4 border-[#00B4D8] bg-emit-ice/50 p-4 rounded-r-lg">
                        <p className="font-medium text-[#03045E]">{seance.matiereId}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(seance.dateSeance)} · {seance.heureDebut} - {seance.heureFin}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="Aucune séance planifiée." />
                )}
              </div>

              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#03045E] mb-4">Progression par matière</h2>
                {data.progressionParMatiere.length > 0 ? (
                  <div className="space-y-6">
                    {data.progressionParMatiere.map((prog, index) => (
                      <div key={`${prog.matiereId}-${index}`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-[#03045E]">{prog.matiereId}</span>
                          <span className="text-sm font-medium text-gray-600">{prog.progression}%</span>
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
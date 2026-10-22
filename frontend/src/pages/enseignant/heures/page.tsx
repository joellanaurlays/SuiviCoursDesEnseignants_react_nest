import { useEffect, useState } from 'react';
import { Layout } from '../../../components/Layout';
import { EtatBadge } from '../../../components/enseignements/EtatBadge';
import { ProgressionBar } from '../../../components/ui/ProgressionBar';
import { StatCard } from '../../../components/ui/StatCard';
import { LoadingState } from '../../../components/ui/LoadingState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useAuth } from '../../../auth/AuthContext';
import { suiviService } from '../../../services/suivi.service';
import { SuiviEnseignement } from '../../../types/enseignement';
import { progressionMoyennePonderee, totalHeures, totalVolume } from '../../../utils/format';

export default function EnseignantHeuresPage() {
  const { headers } = useAuth();
  const [data, setData] = useState<SuiviEnseignement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    suiviService
      .list({}, headers)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e: { message?: string }) => {
        if (!cancelled) setError(e.message ?? 'Impossible de charger les heures.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [headers]);

  const totalPrevu = totalVolume(data);
  const totalRealise = totalHeures(data);
  const totalRestant = totalPrevu - Math.min(totalRealise, totalPrevu);
  const progressionGlobale = progressionMoyennePonderee(data);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold text-[#03045E]">Heures réalisées & Progression</h1>
        </div>

        {loading ? (
          <LoadingState label="Chargement des heures..." />
        ) : error ? (
          <ErrorState message={error} />
        ) : data.length === 0 ? (
          <EmptyState message="Aucun enseignement affecté." />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard label="Heures prévues" value={`${totalPrevu}h`} />
              <StatCard label="Heures réalisées" value={`${totalRealise}h`} accent />
              <StatCard label="Heures restantes" value={`${totalRestant}h`} />
              <StatCard label="Progression globale" value={`${progressionGlobale}%`} />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-xl font-bold text-[#03045E]">Détail par enseignement</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-gray-500 text-sm border-b border-gray-100">
                      <th className="px-6 py-4 font-medium">Matière</th>
                      <th className="px-6 py-4 font-medium text-right">Prévu</th>
                      <th className="px-6 py-4 font-medium text-right">Réalisé</th>
                      <th className="px-6 py-4 font-medium text-right">Reste</th>
                      <th className="px-6 py-4 font-medium">Progression</th>
                      <th className="px-6 py-4 font-medium">État</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{item.matiere}</td>
                        <td className="px-6 py-4 text-right text-gray-600">{item.volumePrevu}h</td>
                        <td className="px-6 py-4 text-right font-medium text-[#0077B6]">{item.heuresRealisees}h</td>
                        <td className="px-6 py-4 text-right text-gray-600">{item.heuresRestantes}h</td>
                        <td className="px-6 py-4 w-44">
                          <ProgressionBar progression={item.progression} showLabel />
                        </td>
                        <td className="px-6 py-4">
                          <EtatBadge etat={item.etat} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
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
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="mb-2">
          <p className="emit-eyebrow">Espace enseignant</p>
          <h1 className="emit-title mt-1">Heures réalisées &amp; progression</h1>
          <p className="emit-subtitle mt-1">Synthèse des volumes horaires de vos enseignements.</p>
        </div>

        {loading ? (
          <LoadingState label="Chargement des heures..." />
        ) : error ? (
          <ErrorState message={error} />
        ) : data.length === 0 ? (
          <EmptyState message="Aucun enseignement affecté." />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <StatCard label="Heures prévues" value={`${totalPrevu}h`} tone="info" />
              <StatCard label="Heures réalisées" value={`${totalRealise}h`} tone="success" accent />
              <StatCard label="Heures restantes" value={`${totalRestant}h`} tone="warning" />
              <StatCard label="Progression globale" value={`${progressionGlobale}%`} tone="primary" />
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <h2 className="text-xl font-bold text-[#03045E]">Détail par enseignement</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="emit-table-head">
                    <tr>
                      <th scope="col" className="emit-table-th">Matière</th>
                      <th scope="col" className="emit-table-th text-right">Prévu</th>
                      <th scope="col" className="emit-table-th text-right">Réalisé</th>
                      <th scope="col" className="emit-table-th text-right">Reste</th>
                      <th scope="col" className="emit-table-th">Progression</th>
                      <th scope="col" className="emit-table-th">État</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.map((item) => (
                      <tr key={item.id} className="transition-colors hover:bg-[#CAF0F8]/40">
                        <td className="emit-table-td font-bold text-[#03045E]">{item.matiere}</td>
                        <td className="emit-table-td text-right text-slate-600">{item.volumePrevu}h</td>
                        <td className="emit-table-td text-right font-bold text-[#0077B6]">{item.heuresRealisees}h</td>
                        <td className="emit-table-td text-right text-slate-600">{item.heuresRestantes}h</td>
                        <td className="emit-table-td w-44">
                          <ProgressionBar progression={item.progression} showLabel />
                        </td>
                        <td className="emit-table-td">
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
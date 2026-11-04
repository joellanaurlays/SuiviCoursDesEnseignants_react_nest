import { useCallback, useEffect, useMemo, useState } from 'react';
import { Layout } from '../../components/Layout';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alerte, alerteService } from '../../services/alerte.service';
import { Search } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { formatDate } from '../../utils/format';

interface AlertesListPageProps {
  title: string;
}

export default function EnseignantAlertesPage({ title }: AlertesListPageProps) {
  const { headers } = useAuth();
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const charger = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    alerteService
      .getAll(headers)
      .then((d) => {
        if (!cancelled) setAlertes(d);
      })
      .catch((e) => {
        if (!cancelled) setError((e as { message?: string }).message ?? 'Impossible de charger les alertes.');
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
    () => Array.from(new Set(alertes.map((a) => a.typeAlerte))).sort(),
    [alertes],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return alertes.filter((alerte) => {
      const matchType = !q || alerte.typeAlerte.toLowerCase().includes(q);
      const matchSearch =
        !q || (alerte.message ?? '').toLowerCase().includes(q) || (alerte.examenId ?? '').toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [alertes, search]);

  const inputClass =
    'block pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-[#00e5ff] focus:border-[#00e5ff] sm:text-sm rounded-md bg-white';

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold text-[#0a0a32]">{title}</h1>
          </div>
          <span className="text-sm text-gray-500 filtered-badge">{filtered.length} alerte(s) affichée(s)</span>
        </div>

        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par type ou message..."
            className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff]"
          />
        </div>

        <select className={inputClass}>
          <option value="">Type d'alerte : Toutes</option>
          {matieres.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
            {/* Filtres déjà affichés ci-dessus */}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-gray-500 text-sm border-b border-gray-100">
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Message</th>
                  <th className="px-6 py-4 font-medium">Examen</th>
                  <th className="px-6 py-4 font-medium">Créée le</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filtered.map((alerte) => (
                  <tr key={alerte.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {alerte.typeAlerte}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {alerte.message || 'Non spécifié'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {alerte.examenId || '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {formatDate(alerte.createdAt)}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState message="Aucune alerte trouvée." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
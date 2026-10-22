import { useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../../components/Layout';
import { Plus, Search } from 'lucide-react';
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

  const selectClass =
    'block px-3 py-2 pr-10 text-base border border-gray-300 focus:outline-none focus:ring-[#00e5ff] focus:border-[#00e5ff] sm:text-sm rounded-md bg-white';

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold text-[#0a0a32]">Mes séances</h1>

        {/* Résumé des statuts */}
        {(statusSummary.planifiee > 0 || statusSummary.realisee > 0 || statusSummary.annulee > 0) && (
          <div className="flex flex-col sm:flex-row gap-2 text-xs font-medium">
            <div
              className={`px-2 py-1 rounded ${statusSummary.planifiee > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-500'}`}
            >
              {statusSummary.planifiee} planifiée
            </div>
            <div
              className={`px-2 py-1 rounded ${statusSummary.realisee > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-500'}`}
            >
              {statusSummary.realisee} réalisée
            </div>
            <div
              className={`px-2 py-1 rounded ${statusSummary.annulee > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-200 text-gray-500'}`}
            >
              {statusSummary.annulee} annulée
            </div>
          </div>
        )}

        <button
          onClick={() => navigate('/enseignant/seances/nouveau')}
          className="bg-[#0088aa] text-white px-4 py-2 rounded-md flex items-center space-x-2 text-sm hover:bg-[#007799] transition-colors font-medium"
        >
          <Plus size={16} />
          <span>Déclarer une séance</span>
        </button>
      </div>

      {loading ? (
        <LoadingState label="Chargement des séances..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-56">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une matière, un contenu..."
                className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff]"
              />
            </div>
            <select value={matiere} onChange={(e) => setMatiere(e.target.value)} className={selectClass}>
              <option value="">Matière : Toutes</option>
              {matieres.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select value={statut} onChange={(e) => setStatut(e.target.value)} className={selectClass}>
              <option value="">Statut : Tous</option>
              <option value="REALISEE">Réalisée</option>
              <option value="PLANIFIEE">Planifiée</option>
              <option value="ANNULEE">Annulée</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-gray-500 text-sm border-b border-gray-100">
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Matière</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Horaire</th>
                  <th className="px-6 py-4 font-medium">Salle</th>
                  <th className="px-6 py-4 font-medium">Durée</th>
                  <th className="px-6 py-4 font-medium">Statut</th>
                  <th className="px-6 py-4 font-medium">Contenu enseigné</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filtered.map((seance) => (
                  <tr
                    key={seance.id}
                    onClick={() => setSelectedId(seance.id)}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{formatDate(seance.dateSeance)}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {seance.enseignement?.matiereId ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">—</td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {formatHoraire(seance.heureDebut, seance.heureFin)}
                    </td>
                    <td className="px-6 py-4 text-gray-500">—</td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{formatDuree(seance.duree)}</td>
                    <td className="px-6 py-4">
                      <SeanceStatutBadge statut={seance.statut} />
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {seance.contenuEnseigne || <span className="italic text-gray-400">Non renseigné</span>}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState message="Aucune séance trouvée." />
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

import { Seance } from '../../types/enseignement';
import { formatDate, formatDuree, formatHoraire } from '../../utils/format';
import { EmptyState } from '../ui/EmptyState';
import { SeanceStatutBadge } from './SeanceStatutBadge';

interface SeanceTableProps {
  seances: Seance[];
  showMatiere?: boolean;
  actionColumn?: (seance: Seance) => React.ReactNode;
  emptyMessage?: string;
}

export function SeanceTable({
  seances,
  showMatiere = false,
  actionColumn,
  emptyMessage = 'Aucune séance enregistrée.',
}: SeanceTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-gray-500 text-sm border-b border-gray-100">
            <th className="px-6 py-4 font-medium">Date</th>
            {showMatiere && <th className="px-6 py-4 font-medium">Matière</th>}
            <th className="px-6 py-4 font-medium">Horaire</th>
            <th className="px-6 py-4 font-medium">Durée</th>
            <th className="px-6 py-4 font-medium">Statut</th>
            <th className="px-6 py-4 font-medium">Contenu enseigné</th>
            {actionColumn && <th className="px-6 py-4 font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody className="text-sm">
          {seances.map((seance) => (
            <tr key={seance.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{formatDate(seance.dateSeance)}</td>
              {showMatiere && (
                <td className="px-6 py-4 font-medium text-gray-800">
                  {seance.enseignement?.matiereId ?? '—'}
                </td>
              )}
              <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                {formatHoraire(seance.heureDebut, seance.heureFin)}
              </td>
              <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{formatDuree(seance.duree)}</td>
              <td className="px-6 py-4">
                <SeanceStatutBadge statut={seance.statut} />
              </td>
              <td className="px-6 py-4 text-gray-600">
                {seance.contenuEnseigne || <span className="italic text-gray-400">Non renseigné</span>}
              </td>
              {actionColumn && <td className="px-6 py-4">{actionColumn(seance)}</td>}
            </tr>
          ))}
          {seances.length === 0 && (
            <tr>
              <td colSpan={showMatiere ? 7 : 6}>
                <EmptyState message={emptyMessage} />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
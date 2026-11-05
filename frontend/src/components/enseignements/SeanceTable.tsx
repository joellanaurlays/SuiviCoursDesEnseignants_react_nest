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

/**
 * Tableau des séances d'un enseignement.
 *
 * Le rendu reste volontairement sobre : il est utilisé dans les pages de
 * consultation (scolarité, responsable, administration) où l'objectif est de
 * lire vite, pas d'agir.
 */
export function SeanceTable({
  seances,
  showMatiere = false,
  actionColumn,
  emptyMessage = 'Aucune séance enregistrée.',
}: SeanceTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead className="emit-table-head">
          <tr>
            <th scope="col" className="emit-table-th">Date</th>
            {showMatiere && <th scope="col" className="emit-table-th">Matière</th>}
            <th scope="col" className="emit-table-th">Horaire</th>
            <th scope="col" className="emit-table-th">Durée</th>
            <th scope="col" className="emit-table-th">Statut</th>
            <th scope="col" className="emit-table-th">Contenu enseigné</th>
            {actionColumn && <th scope="col" className="emit-table-th text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {seances.map((seance) => (
            <tr key={seance.id} className="transition-colors hover:bg-[#CAF0F8]/40">
              <td className="emit-table-td whitespace-nowrap font-medium text-slate-700">
                {formatDate(seance.dateSeance)}
              </td>
              {showMatiere && (
                <td className="emit-table-td whitespace-nowrap font-bold text-[#03045E]">
                  {seance.enseignement?.matiereId ?? '—'}
                </td>
              )}
              <td className="emit-table-td whitespace-nowrap text-slate-500">
                {formatHoraire(seance.heureDebut, seance.heureFin)}
              </td>
              <td className="emit-table-td whitespace-nowrap text-slate-500">{formatDuree(seance.duree)}</td>
              <td className="emit-table-td">
                <SeanceStatutBadge statut={seance.statut} />
              </td>
              <td className="emit-table-td max-w-sm text-slate-500">
                {seance.contenuEnseigne || <span className="italic text-slate-400">Non renseigné</span>}
              </td>
              {actionColumn && <td className="emit-table-td text-right">{actionColumn(seance)}</td>}
            </tr>
          ))}
          {seances.length === 0 && (
            <tr>
              <td colSpan={actionColumn ? (showMatiere ? 7 : 6) : showMatiere ? 6 : 5}>
                <EmptyState message={emptyMessage} />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

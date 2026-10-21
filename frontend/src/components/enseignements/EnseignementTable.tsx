import { Link } from 'react-router-dom';
import { SuiviEnseignement } from '../../types/enseignement';
import { ProgressionBar } from '../ui/ProgressionBar';
import { EmptyState } from '../ui/EmptyState';
import { EtatBadge } from './EtatBadge';
import { ClotureBadge } from './ClotureBadge';

interface EnseignementTableProps {
  enseignement: SuiviEnseignement[];
  detailBasePath: string;
  emptyMessage?: string;
}

export function EnseignementTable({
  enseignement,
  detailBasePath,
  emptyMessage = 'Aucun enseignement ne correspond à vos critères.',
}: EnseignementTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="text-gray-500 text-sm border-b border-gray-100">
          <tr>
            <th className="px-4 py-4 font-medium">Matière</th>
            <th className="px-4 py-4 font-medium">Enseignant</th>
            <th className="px-4 py-4 font-medium">Mention</th>
            <th className="px-4 py-4 font-medium">Parcours</th>
            <th className="px-4 py-4 font-medium">Cycle</th>
            <th className="px-4 py-4 font-medium">Niveau</th>
            <th className="px-4 py-4 font-medium">Semestre</th>
            <th className="px-4 py-4 font-medium">Année univ.</th>
            <th className="px-4 py-4 font-medium text-right">Prévu</th>
            <th className="px-4 py-4 font-medium text-right">Réalisé</th>
            <th className="px-4 py-4 font-medium text-right">Reste</th>
            <th className="px-4 py-4 font-medium">Progression</th>
            <th className="px-4 py-4 font-medium">État</th>
            <th className="px-4 py-4 font-medium">Clôture</th>
            <th className="px-4 py-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {enseignement.map((ens) => (
            <tr key={ens.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-4 font-medium text-gray-900">{ens.matiere}</td>
              <td className="px-4 py-4 text-gray-700">{ens.enseignant}</td>
              <td className="px-4 py-4 text-gray-600">{ens.mention}</td>
              <td className="px-4 py-4 text-gray-600">{ens.parcours}</td>
              <td className="px-4 py-4 text-gray-600">{ens.cycle}</td>
              <td className="px-4 py-4 text-gray-600">{ens.niveau}</td>
              <td className="px-4 py-4 text-gray-600">{ens.semestre}</td>
              <td className="px-4 py-4 text-gray-600">{ens.anneeUniversitaire}</td>
              <td className="px-4 py-4 text-right text-gray-700">{ens.volumePrevu}h</td>
              <td className="px-4 py-4 text-right font-medium text-[#0088aa]">{ens.heuresRealisees}h</td>
              <td className="px-4 py-4 text-right text-gray-600">{ens.heuresRestantes}h</td>
              <td className="px-4 py-4 w-40">
                <ProgressionBar progression={ens.progression} showLabel />
              </td>
              <td className="px-4 py-4">
                <EtatBadge etat={ens.etat} />
                {ens.enRetard && <span className="text-xs text-red-600 font-semibold ml-1">En retard</span>}
              </td>
              <td className="px-4 py-4">
                <ClotureBadge typeCloture={ens.typeCloture} />
              </td>
              <td className="px-4 py-4">
                <Link
                  to={`${detailBasePath}/${ens.id}`}
                  className="text-[#0088aa] hover:text-[#006688] hover:underline font-medium"
                >
                  Détail
                </Link>
              </td>
            </tr>
          ))}
          {enseignement.length === 0 && (
            <tr>
              <td colSpan={15}>
                <EmptyState message={emptyMessage} />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
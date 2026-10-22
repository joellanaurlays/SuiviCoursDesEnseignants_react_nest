import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
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

/**
 * Tableau des enseignements suivis.
 *
 * Le tableau est volontairement large (structure académique complète) et
 * reste horizontalement défilable sur petits écrans : aucune colonne
 * d'information n'est masquée, afin que la lecture reste identique quel que
 * soit l'appareil.
 */
export function EnseignementTable({
  enseignement,
  detailBasePath,
  emptyMessage = 'Aucun enseignement ne correspond à vos critères.',
}: EnseignementTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">
          Liste des enseignements suivis, avec heures prévues, réalisées, restantes et progression.
        </caption>
        <thead className="emit-table-head">
          <tr>
            <th scope="col" className="emit-table-th">Matière</th>
            <th scope="col" className="emit-table-th">Enseignant</th>
            <th scope="col" className="emit-table-th">Mention</th>
            <th scope="col" className="emit-table-th">Parcours</th>
            <th scope="col" className="emit-table-th">Cycle</th>
            <th scope="col" className="emit-table-th">Niveau</th>
            <th scope="col" className="emit-table-th">Semestre</th>
            <th scope="col" className="emit-table-th">Année univ.</th>
            <th scope="col" className="emit-table-th text-right">Prévu</th>
            <th scope="col" className="emit-table-th text-right">Réalisé</th>
            <th scope="col" className="emit-table-th text-right">Reste</th>
            <th scope="col" className="emit-table-th w-44">Progression</th>
            <th scope="col" className="emit-table-th">État</th>
            <th scope="col" className="emit-table-th">Clôture</th>
            <th scope="col" className="emit-table-th text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {enseignement.map((ens) => (
            <tr key={ens.id} className="group transition-colors hover:bg-[#CAF0F8]/40">
              <td className="emit-table-td font-bold text-[#03045E]">{ens.matiere}</td>
              <td className="emit-table-td whitespace-nowrap">{ens.enseignant}</td>
              <td className="emit-table-td whitespace-nowrap text-slate-500">{ens.mention}</td>
              <td className="emit-table-td whitespace-nowrap text-slate-500">{ens.parcours}</td>
              <td className="emit-table-td whitespace-nowrap text-slate-500">{ens.cycle}</td>
              <td className="emit-table-td whitespace-nowrap text-slate-500">{ens.niveau}</td>
              <td className="emit-table-td whitespace-nowrap text-slate-500">{ens.semestre}</td>
              <td className="emit-table-td whitespace-nowrap text-slate-500">{ens.anneeUniversitaire}</td>
              <td className="emit-table-td whitespace-nowrap text-right font-medium text-slate-600">
                {ens.volumePrevu}h
              </td>
              <td className="emit-table-td whitespace-nowrap text-right font-bold text-[#0077B6]">
                {ens.heuresRealisees}h
              </td>
              <td className="emit-table-td whitespace-nowrap text-right font-medium text-slate-600">
                {ens.heuresRestantes}h
              </td>
              <td className="emit-table-td">
                <ProgressionBar progression={ens.progression} showLabel size="sm" />
              </td>
              <td className="emit-table-td">
                <div className="flex flex-wrap items-center gap-1.5">
                  <EtatBadge etat={ens.etat} />
                  {ens.enRetard && (
                    <span className="emit-chip bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200">
                      En retard
                    </span>
                  )}
                </div>
              </td>
              <td className="emit-table-td">
                <ClotureBadge typeCloture={ens.typeCloture} />
              </td>
              <td className="emit-table-td text-right">
                <Link
                  to={`${detailBasePath}/${ens.id}`}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#0077B6] transition hover:bg-[#CAF0F8] hover:text-[#03045E]"
                >
                  Détail
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              </td>
            </tr>
          ))}
          {enseignement.length === 0 && (
            <tr>
              <td colSpan={15}>
                <EmptyState
                  message={emptyMessage}
                  hint="Modifiez ou réinitialisez les filtres pour élargir la recherche."
                />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

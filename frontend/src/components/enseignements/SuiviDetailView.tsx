import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Seance, SuiviEnseignement } from '../../types/enseignement';
import { formatDuree } from '../../utils/format';
import { EtatBadge } from './EtatBadge';
import { ClotureBadge } from './ClotureBadge';
import { SeanceStatutBadge } from './SeanceStatutBadge';
import { ProgressionBar } from '../ui/ProgressionBar';
import { EmptyState } from '../ui/EmptyState';

interface SuiviDetailViewProps {
  enseignement: SuiviEnseignement;
  seances: Seance[];
  backLabel: string;
  backLink: string;
  /** Rendu de l'action « Clôturer l'enseignement » (enseignant titulaire uniquement). */
  actionCloture?: React.ReactNode;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-gray-100 pb-2">
      <span className="text-gray-500">{label}</span>
      <span className="font-bold text-[#03045E] text-right">{value}</span>
    </div>
  );
}

function StatBlock({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`p-4 rounded-lg border ${accent ? 'bg-emit-ice border-emit-sky' : 'bg-gray-50 border-gray-100'}`}>
      <p className={`text-xs uppercase tracking-wider font-semibold ${accent ? 'text-emit-navy' : 'text-gray-500'}`}>
        {label}
      </p>
      <p className="font-bold text-2xl mt-1 text-[#03045E]">{value}</p>
    </div>
  );
}

export function SuiviDetailView({ enseignement, seances, backLabel, backLink, actionCloture }: SuiviDetailViewProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link
          to={backLink}
          className="inline-flex items-center text-sm font-medium text-[#0077B6] hover:text-[#0077B6] mb-4"
        >
          <ArrowLeft size={16} className="mr-1" /> {backLabel}
        </Link>
        <div className="flex justify-between items-center border-b pb-4">
          <h1 className="text-3xl font-bold text-[#03045E]">Détail de l'enseignement</h1>
          <span className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium">
            Année : {enseignement.anneeUniversitaire}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Fiche d'enseignement */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#03045E]">Fiche d'enseignement</h2>
              <EtatBadge etat={enseignement.etat} />
            </div>
            <div className="space-y-4">
              <InfoRow label="Matière" value={enseignement.matiere} />
              <InfoRow label="Enseignant" value={enseignement.enseignant} />
              <InfoRow label="Mention" value={enseignement.mention} />
              <InfoRow label="Parcours" value={enseignement.parcours} />
              <InfoRow label="Cycle" value={enseignement.cycle} />
              <InfoRow label="Niveau" value={enseignement.niveau} />
              <InfoRow label="Semestre" value={enseignement.semestre} />
              <InfoRow label="Année universitaire" value={enseignement.anneeUniversitaire} />
              <InfoRow label="Volume prévu" value={`${enseignement.volumePrevu}h`} />
            </div>
          </div>

          {/* Historique des séances */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-[#03045E] mb-6">Historique des séances</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Horaire</th>
                    <th className="px-4 py-3 font-medium">Durée</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                    <th className="px-4 py-3 font-medium">Contenu enseigné</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {seances.map((seance) => (
                    <tr key={seance.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                        {new Date(seance.dateSeance).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {seance.heureDebut} - {seance.heureFin}
                      </td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{formatDuree(seance.duree)}</td>
                      <td className="px-4 py-3">
                        <SeanceStatutBadge statut={seance.statut} />
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {seance.contenuEnseigne || <span className="italic text-gray-400">Non renseigné</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {seances.length === 0 && <EmptyState message="Aucune séance enregistrée pour cet enseignement." />}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Suivi des heures */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-[#03045E] mb-4">Suivi des heures</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatBlock label="Volume prévu" value={`${enseignement.volumePrevu}h`} />
              <StatBlock label="Heures réalisées" value={`${enseignement.heuresRealisees}h`} accent />
              <StatBlock label="Heures restantes" value={`${enseignement.heuresRestantes}h`} />
              <StatBlock label="Progression" value={`${enseignement.progression}%`} />
            </div>
            <div className="mt-4">
              <ProgressionBar progression={enseignement.progression} showLabel />
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
              <span className="text-gray-500 text-sm">État</span>
              <EtatBadge etat={enseignement.etat} />
            </div>
            {actionCloture && <div className="mt-5 border-t border-gray-100 pt-4">{actionCloture}</div>}
          </div>

          {/* Clôture anticipée */}
          {enseignement.clotureAnticipee && (
            <div className="bg-white rounded-xl border border-purple-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-[#03045E]">Clôture anticipée</h2>
                <ClotureBadge typeCloture={enseignement.typeCloture} />
              </div>
              <div className="space-y-2">
                <InfoRow label="Motif" value={enseignement.motifCloture || 'Non renseigné'} />
                <InfoRow
                  label="Date de clôture"
                  value={
                    enseignement.dateCloture
                      ? new Date(enseignement.dateCloture).toLocaleDateString('fr-FR')
                      : '—'
                  }
                />
              </div>
              <p className="text-xs text-gray-500 mt-3">
                La progression ci-dessus reste celle des heures réellement réalisées : la clôture
                anticipée ne l'a pas modifiée.
              </p>
            </div>
          )}

          {/* Résumé */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-[#03045E] mb-4">Séances réalisées</h2>
            <p className="text-sm text-gray-600">
              {enseignement.nombreSeancesRealisees} séance(s) réalisée(s)
              {enseignement.derniereSeanceRealisee &&
                ` · dernier cours le ${new Date(enseignement.derniereSeanceRealisee).toLocaleDateString('fr-FR')}`}
            </p>
            {enseignement.enRetard && (
              <p className="text-sm text-red-600 font-semibold mt-2">
                ⚠ Aucune séance réalisée depuis plus de 14 jours
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
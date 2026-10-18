import { StatCard } from '../ui/StatCard';
import { ProgressionBar } from '../ui/ProgressionBar';
import { SuiviStatistiques } from '../../types/enseignement';

interface SuiviStatCardsProps {
  stats: SuiviStatistiques | null;
  loading?: boolean;
}

/**
 * Cartes d'indicateurs du suivi des enseignements.
 *
 * Les agrégats proviennent exclusivement de GET /suivi/statistiques, calculé
 * côté backend sur le périmètre de l'utilisateur et sur les filtres actifs :
 * ils correspondent donc toujours aux lignes affichées, sans fuite de données
 * entre enseignants, mentions ou cycles.
 */
export function SuiviStatCards({ stats, loading = false }: SuiviStatCardsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-pulse"
          >
            <div className="h-3 w-20 bg-gray-200 rounded mb-4" />
            <div className="h-8 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const { totaux, etats } = stats;

  return (
    <>
      <div
        className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 ${
          loading ? 'opacity-60 transition-opacity' : ''
        }`}
      >
        <StatCard label="Enseignements" value={totaux.enseignements} />
        <StatCard label="Heures prévues" value={`${totaux.volumePrevu}h`} />
        <StatCard label="Heures réalisées" value={`${totaux.heuresRealisees}h`} accent />
        <StatCard label="Heures restantes" value={`${totaux.heuresRestantes}h`} />
        <StatCard label="Progression globale" value={`${totaux.progression}%`}>
          <ProgressionBar progression={totaux.progression} />
        </StatCard>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-between">
          <span className="text-sm text-gray-600 font-medium">Non commencés</span>
          <span className="text-lg font-bold text-gray-700">{etats.nonCommences}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-between">
          <span className="text-sm text-gray-600 font-medium">En cours</span>
          <span className="text-lg font-bold text-yellow-600">{etats.enCours}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-between">
          <span className="text-sm text-gray-600 font-medium">Terminés</span>
          <span className="text-lg font-bold text-green-600">{etats.termines}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-between">
          <span className="text-sm text-gray-600 font-medium">Clôtures anticipées</span>
          <span className="text-lg font-bold text-purple-600">
            {stats.clotures.terminesParClotureAnticipee}
          </span>
        </div>
      </div>
    </>
  );
}

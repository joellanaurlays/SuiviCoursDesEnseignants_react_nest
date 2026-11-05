import { useSyncExternalStore } from 'react';
import { AlertTriangle, FlaskConical } from 'lucide-react';
import {
  getPreviewStatus,
  subscribePreviewStatus,
} from './localPreview';

/**
 * Bandeau de prévisualisation locale.
 *
 * Il rend visible, en permanence, le fait que :
 *  - l'identité affichée est une identité de DÉMONSTRATION ;
 *  - les données affichées peuvent venir du jeu de démonstration ;
 *  - aucune action n'est enregistrée dans PostgreSQL.
 *
 * Le bandeau n'est rendu QUE si le mode est actif (DEV + variable dédiée) :
 * en usage normal, il n'apparaît jamais.
 */
export function LocalPreviewBanner() {
  const status = useSyncExternalStore(subscribePreviewStatus, getPreviewStatus);

  if (!status.enabled) return null;

  const source =
    status.source === 'reelle'
      ? 'Données réelles servies par l’API'
      : status.source === 'demonstration'
        ? 'Données de DÉMONSTRATION (jeu fictif local)'
        : 'Source de données inconnue';

  return (
    <div
      role="status"
      data-testid="local-preview-banner"
      className="bg-amber-50 border-b border-amber-300 text-amber-900 px-8 py-2 text-sm flex items-start gap-2"
    >
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-semibold flex items-center gap-2">
          <FlaskConical size={14} className="text-amber-600" aria-hidden="true" />
          Mode prévisualisation local — identité de démonstration
        </p>
        <p className="text-amber-800">
          {source}. Les actions (déclarer, réaliser, annuler, corriger) sont simulées en mémoire et ne
          sont jamais enregistrées dans PostgreSQL.
        </p>
        {status.apiError && (
          <p className="text-amber-700 italic">
            API réelle indisponible : {status.apiError}
          </p>
        )}
        {status.apiEmpty && !status.apiError && (
          <p className="text-amber-700 italic">
            L’API réelle est joignable mais ne renvoie aucune séance pour l’identité de démonstration
            (le backend filtre les séances sur l’enseignant connecté) : le jeu de démonstration est
            affiché.
          </p>
        )}
      </div>
    </div>
  );
}

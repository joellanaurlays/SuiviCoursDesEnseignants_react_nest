import { useCallback, useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { seanceService } from '../../services/seance.service';
import { JournalAuditEntry } from '../../types/enseignement';
import { formatDateTime } from '../../utils/format';
import { aDesChangements, libelleAction, lignesChangements } from '../../utils/audit-format';
import { SeanceStatutBadge } from './SeanceStatutBadge';

interface HistoriqueSeanceProps {
  seanceId: string;
  /** Recharge l'historique quand cette valeur change (après une action). */
  refreshKey?: number;
}

export function HistoriqueSeance({ seanceId, refreshKey = 0 }: HistoriqueSeanceProps) {
  const { headers } = useAuth();
  const [entrees, setEntrees] = useState<JournalAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await seanceService.getHistorique(seanceId, headers);
      setEntrees(data);
    } catch (e) {
      setError((e as { message?: string }).message ?? "Impossible de charger l'historique.");
    } finally {
      setLoading(false);
    }
  }, [seanceId, headers]);

  useEffect(() => {
    charger();
  }, [charger, refreshKey]);

  return (
    <div className="border-t border-gray-100 pt-4">
      <div className="flex items-center gap-2 mb-3">
        <History size={16} className="text-[#0088aa]" />
        <h3 className="font-semibold text-[#0a0a32] text-sm">Historique des actions</h3>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Chargement de l'historique...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : entrees.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Aucune action enregistrée.</p>
      ) : (
        <ol className="space-y-3">
          {entrees.map((entree) => (
            <li key={entree.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-[#0a0a32] text-sm">
                  {libelleAction(entree.action)}
                </span>
                <span className="text-xs text-gray-500">{formatDateTime(entree.createdAt)}</span>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                <span>
                  Par <strong className="text-[#0a0a32]">{entree.utilisateurId}</strong>
                </span>
                {(entree.statutAvant || entree.statutApres) && (
                  <span className="inline-flex items-center gap-1">
                    {entree.statutAvant ? <SeanceStatutBadge statut={entree.statutAvant} /> : '—'}
                    <span className="text-gray-400">→</span>
                    {entree.statutApres ? <SeanceStatutBadge statut={entree.statutApres} /> : '—'}
                  </span>
                )}
              </div>

              {entree.motif && (
                <p className="mt-1 text-xs text-gray-600">
                  <span className="text-gray-400">Motif :</span> {entree.motif}
                </p>
              )}

              {aDesChangements(entree.action) && (
                <ul className="mt-2 space-y-0.5">
                  {lignesChangements(entree.valeursAvant, entree.valeursApres).map((ligne) => (
                    <li key={ligne.label} className="text-xs text-gray-600">
                      <span className="text-gray-400">{ligne.label} :</span>{' '}
                      <span className="text-gray-500 line-through">{ligne.avant}</span>{' '}
                      <span className="text-gray-400">→</span>{' '}
                      <span className="text-[#0a0a32]">{ligne.apres}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

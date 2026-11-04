import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, History } from 'lucide-react';
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
    <section className="border-t border-slate-100 pt-5" aria-label="Historique des actions">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#CAF0F8] text-[#03045E]" aria-hidden="true">
          <History size={15} />
        </span>
        <div>
          <h3 className="text-sm font-bold text-[#03045E]">Historique des actions</h3>
          {!loading && !error && entrees.length > 0 && (
            <p className="text-xs text-slate-500">{entrees.length} action(s) enregistrée(s)</p>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Chargement de l&apos;historique...</p>
      ) : error ? (
        <p className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700" role="alert">
          <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : entrees.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm italic text-slate-400">
          Aucune action enregistrée.
        </p>
      ) : (
        <ol className="relative space-y-3 border-l-2 border-slate-100 pl-4">
          {entrees.map((entree) => (
            <li key={entree.id} className="relative">
              <span
                className="absolute -left-[21px] top-3 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#0077B6]"
                aria-hidden="true"
              />
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold text-[#03045E]">
                    {libelleAction(entree.action)}
                  </span>
                  <span className="text-xs text-slate-500">{formatDateTime(entree.createdAt)}</span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span>
                    Par <strong className="text-[#03045E]">{entree.utilisateurId}</strong>
                  </span>
                  {(entree.statutAvant || entree.statutApres) && (
                    <span className="inline-flex items-center gap-1">
                      {entree.statutAvant ? <SeanceStatutBadge statut={entree.statutAvant} /> : <span className="text-slate-400">—</span>}
                      <span className="text-slate-400" aria-hidden="true">→</span>
                      {entree.statutApres ? <SeanceStatutBadge statut={entree.statutApres} /> : <span className="text-slate-400">—</span>}
                    </span>
                  )}
                </div>

                {entree.motif && (
                  <p className="mt-1 text-xs text-slate-600">
                    <span className="text-slate-400">Motif :</span> {entree.motif}
                  </p>
                )}

                {aDesChangements(entree.action) && (
                  <ul className="mt-2 space-y-0.5">
                    {lignesChangements(entree.valeursAvant, entree.valeursApres).map((ligne) => (
                      <li key={ligne.label} className="text-xs text-slate-600">
                        <span className="text-slate-400">{ligne.label} :</span>{' '}
                        <span className="text-slate-500 line-through">{ligne.avant}</span>{' '}
                        <span className="text-slate-400" aria-hidden="true">→</span>{' '}
                        <span className="font-medium text-[#03045E]">{ligne.apres}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

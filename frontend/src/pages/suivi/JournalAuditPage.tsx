import { useCallback, useEffect, useMemo, useState } from 'react';
import { Layout } from '../../components/Layout';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { ChevronDown, ScrollText, Search } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { auditService } from '../../services/audit.service';
import { ActionAuditSeance, JournalAuditEntry } from '../../types/enseignement';
import { formatDateTime } from '../../utils/format';
import { SeanceStatutBadge } from '../../components/enseignements/SeanceStatutBadge';
import { libelleAction, lignesChangements } from '../../utils/audit-format';

interface JournalAuditPageProps {
  title?: string;
  intro?: string;
}

const ACTIONS: ActionAuditSeance[] = [
  'CREATION',
  'DECLARATION_REALISEE',
  'REALISATION',
  'ANNULATION',
  'MODIFICATION',
  'CORRECTION',
  'SUPPRESSION',
];

/**
 * Consultation du journal d'audit des séances. Le périmètre (enseignant,
 * responsable de parcours, scolarité, administrateur) est appliqué côté
 * backend : cette page n'affiche que les actions autorisées pour l'utilisateur.
 */
export function JournalAuditPage({
  title = "Journal d'audit",
  intro = 'Traçabilité des actions réalisées sur les séances.',
}: JournalAuditPageProps) {
  const { headers } = useAuth();
  const [entrees, setEntrees] = useState<JournalAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');

  const charger = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    auditService
      .getAll({ limit: 300 }, headers)
      .then((data) => {
        if (!cancelled) setEntrees(data);
      })
      .catch((e: { message?: string }) => {
        if (!cancelled) setError(e.message ?? "Impossible de charger le journal d'audit.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [headers]);

  useEffect(() => charger(), [charger]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entrees.filter((e) => {
      const matchAction = !action || e.action === action;
      const matchSearch =
        !q ||
        e.utilisateurId.toLowerCase().includes(q) ||
        e.seanceId.toLowerCase().includes(q) ||
        (e.motif ?? '').toLowerCase().includes(q);
      return matchAction && matchSearch;
    });
  }, [entrees, action, search]);

  return (
    <Layout>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="emit-eyebrow">Traçabilité</p>
            <h1 className="emit-title mt-1">{title}</h1>
            {intro && <p className="emit-subtitle mt-1">{intro}</p>}
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 shadow-sm">
            <ScrollText size={15} aria-hidden="true" className="text-[#0077B6]" />
            {filtered.length} entrée(s)
          </span>
        </div>

        {loading ? (
          <LoadingState label="Chargement du journal..." />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 bg-slate-50/60 p-4">
              <div className="relative min-w-56 flex-1 basis-56">
                <label htmlFor="audit-recherche" className="emit-label">
                  Recherche
                </label>
                <div className="relative">
                  <Search
                    size={16}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="audit-recherche"
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Utilisateur, séance, motif..."
                    className="emit-input pl-9"
                  />
                </div>
              </div>

              <div className="min-w-48 flex-1 basis-48">
                <label htmlFor="audit-action" className="emit-label">
                  Action
                </label>
                <div className="relative">
                  <select
                    id="audit-action"
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className="emit-input appearance-none pr-9"
                  >
                    <option value="">Toutes</option>
                    {ACTIONS.map((a) => (
                      <option key={a} value={a}>
                        {libelleAction(a)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>

              {(search.trim() || action) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setAction('');
                  }}
                  className="emit-btn-ghost"
                >
                  Réinitialiser
                </button>
              )}
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                message="Aucune action trouvée."
                hint="Ajustez la recherche ou le filtre d'action."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {filtered.map((e) => (
                  <li key={e.id} className="px-5 py-4 transition-colors hover:bg-[#CAF0F8]/25 sm:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[#03045E]">{libelleAction(e.action)}</span>
                      <span className="text-xs text-slate-500">{formatDateTime(e.createdAt)}</span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-600">
                      <span>
                        Par <strong className="text-[#03045E]">{e.utilisateurId}</strong>
                      </span>
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-500">
                        Séance {e.seanceId.slice(0, 8)}
                      </span>
                      <span className="text-slate-400">
                        {e.parcours} · {e.cycle}
                      </span>
                      {(e.statutAvant || e.statutApres) && (
                        <span className="inline-flex items-center gap-1">
                          {e.statutAvant ? <SeanceStatutBadge statut={e.statutAvant} /> : <span className="text-slate-400">—</span>}
                          <span className="text-slate-400" aria-hidden="true">→</span>
                          {e.statutApres ? <SeanceStatutBadge statut={e.statutApres} /> : <span className="text-slate-400">—</span>}
                        </span>
                      )}
                    </div>

                    {e.motif && (
                      <p className="mt-1 text-xs text-slate-600">
                        <span className="text-slate-400">Motif :</span> {e.motif}
                      </p>
                    )}

                    {lignesChangements(e.valeursAvant, e.valeursApres).length > 0 && (
                      <ul className="mt-1.5 space-y-0.5 rounded-lg bg-slate-50 px-3 py-2">
                        {lignesChangements(e.valeursAvant, e.valeursApres).map((ligne) => (
                          <li key={ligne.label} className="text-xs text-slate-600">
                            <span className="text-slate-400">{ligne.label} :</span>{' '}
                            <span className="text-slate-500 line-through">{ligne.avant}</span>{' '}
                            <span className="text-slate-400" aria-hidden="true">→</span>{' '}
                            <span className="font-medium text-[#03045E]">{ligne.apres}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

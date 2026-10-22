import { useCallback, useEffect, useMemo, useState } from 'react';
import { Layout } from '../../components/Layout';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { Search } from 'lucide-react';
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
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold text-[#03045E]">{title}</h1>
            {intro && <p className="text-sm text-gray-500 mt-1">{intro}</p>}
          </div>
          <span className="text-sm text-gray-500">{filtered.length} entrée(s)</span>
        </div>

        {loading ? (
          <LoadingState label="Chargement du journal..." />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-56">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un utilisateur, une séance, un motif..."
                  className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#00B4D8] focus:ring-1 focus:ring-[#00B4D8]"
                />
              </div>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="block px-3 py-2 pr-10 text-base border border-gray-300 focus:outline-none focus:ring-[#00B4D8] focus:border-[#00B4D8] sm:text-sm rounded-md bg-white"
              >
                <option value="">Action : toutes</option>
                {ACTIONS.map((a) => (
                  <option key={a} value={a}>
                    {libelleAction(a)}
                  </option>
                ))}
              </select>
            </div>

            {filtered.length === 0 ? (
              <EmptyState message="Aucune action trouvée." />
            ) : (
              <ul className="divide-y divide-gray-100">
                {filtered.map((e) => (
                  <li key={e.id} className="px-6 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-[#03045E] text-sm">
                        {libelleAction(e.action)}
                      </span>
                      <span className="text-xs text-gray-500">{formatDateTime(e.createdAt)}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                      <span>
                        Par <strong className="text-[#03045E]">{e.utilisateurId}</strong>
                      </span>
                      <span className="text-gray-400">Séance {e.seanceId.slice(0, 8)}</span>
                      <span className="text-gray-400">
                        {e.parcours} · {e.cycle}
                      </span>
                      {(e.statutAvant || e.statutApres) && (
                        <span className="inline-flex items-center gap-1">
                          {e.statutAvant ? <SeanceStatutBadge statut={e.statutAvant} /> : '—'}
                          <span className="text-gray-400">→</span>
                          {e.statutApres ? <SeanceStatutBadge statut={e.statutApres} /> : '—'}
                        </span>
                      )}
                    </div>
                    {e.motif && (
                      <p className="mt-1 text-xs text-gray-600">
                        <span className="text-gray-400">Motif :</span> {e.motif}
                      </p>
                    )}
                    <ul className="mt-1 space-y-0.5">
                      {lignesChangements(e.valeursAvant, e.valeursApres).map((ligne) => (
                        <li key={ligne.label} className="text-xs text-gray-600">
                          <span className="text-gray-400">{ligne.label} :</span>{' '}
                          <span className="text-gray-500 line-through">{ligne.avant}</span>{' '}
                          <span className="text-gray-400">→</span>{' '}
                          <span className="text-[#03045E]">{ligne.apres}</span>
                        </li>
                      ))}
                    </ul>
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

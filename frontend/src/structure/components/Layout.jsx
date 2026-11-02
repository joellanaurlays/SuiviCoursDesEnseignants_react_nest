import { Link, NavLink, useLocation } from 'react-router-dom';
import { BASE } from '../config/paths.js';
import { useAuth } from '../../context/AuthContext.jsx';

const tabClass = ({ isActive }) => `tab${isActive ? ' active' : ''}`;

// Onglets : vue complete, puis un onglet par cycle (Licence / Master).
const VUE_TABS = [
  { label: 'Vue arborescente', cycle: null },
  { label: 'Licence', cycle: 'Licence' },
  { label: 'Master', cycle: 'Master' },
];

/** Mise en page identique au module Emploi du temps : bandeau bleu marine + onglets. */
export default function Layout({ children }) {
  const { user } = useAuth();
  const { pathname, search } = useLocation();
  const currentCycle = new URLSearchParams(search).get('cycle')
  const onTree = pathname.endsWith('/arborescence');
  return (
    <div className="app-shell">
      <header className="sa-header">
        <div className="sa-header-inner">
          <div className="sa-header-top">
            <div className="sa-brand">
              <div className="sa-logo" aria-hidden="true">E</div>
              <div>
                <div className="sa-brand-line">
                  EMIT
                  <span className="sa-chip">Université de Fianarantsoa</span>
                  <span className="sa-chip outline">Structure académique</span>
                </div>
                <div className="sa-brand-sub">
                  Suivi des Enseignements — Mention → Cycle → Niveau → Année → Semestre → Matière
                </div>
              </div>
            </div>
            <div className="sa-header-right">
              <NavLink to="/" className="sa-ghost">← Retour à l'application</NavLink>
              {user?.role && <span className="sa-user">{String(user.role).replace('_', ' ')}</span>}
            </div>
          </div>
          <nav className="sa-tabs" aria-label="Navigation principale">
            <NavLink to={BASE} end className={tabClass}>Tableau de bord</NavLink>
            {VUE_TABS.map((t) => (
              <Link
                key={t.label}
                to={t.cycle ? `${BASE}/arborescence?cycle=${t.cycle}` : `${BASE}/arborescence`}
                className={`tab${onTree && currentCycle === t.cycle ? ' active' : ''}`}
              >
                {t.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="main" id="contenu">
        {children}
      </main>
    </div>
  );
}
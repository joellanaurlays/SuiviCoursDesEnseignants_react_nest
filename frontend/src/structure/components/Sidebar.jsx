import { NavLink } from 'react-router-dom';
import { entities, navOrder } from '../config/entities.jsx';
import { BASE } from '../config/paths.js';

const linkClass = ({ isActive }) => (isActive ? 'active' : '');

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="tag">EMIT · Suivi des enseignants</span>
        <h1>Structure académique</h1>
      </div>

      <nav className="sidebar-nav" aria-label="Navigation principale">
        <NavLink to={BASE} end className={linkClass}>
          <span className="dot" />
          Tableau de bord
        </NavLink>
        <NavLink to={`${BASE}/arborescence`} className={linkClass}>
          <span className="dot" />
          Vue arborescente
        </NavLink>

        <div className="nav-section">Gérer</div>
        {navOrder.map((key, i) => (
          <NavLink key={key} to={`${BASE}/${key}`} className={linkClass}>
            <span className="step">{i + 1}</span>
            {entities[key].label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/" className="back-link">
          ← Retour à l'application
        </NavLink>
        Hiérarchie : Mention → Cycle → Niveau → Année universitaire → Semestre → Matière.
      </div>
    </aside>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { entities, navOrder, statsKey } from '../config/entities.jsx';
import { BASE } from '../config/paths.js';

const chainColors = ['var(--navy)', 'var(--blue)', 'var(--cyan)', 'var(--light)', 'var(--blue)', 'var(--navy)'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/structure/stats')
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.userMessage));
  }, []);

  const isEmpty = stats && stats.mentions === 0;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">Module 3 · EMIT</div>
          <h2>Tableau de bord</h2>
          <p>
            Vue d'ensemble de la structure académique : de la mention jusqu'aux matières enseignées
            à chaque semestre.
          </p>
        </div>
        <Link className="btn-primary" to={`${BASE}/arborescence`}>
          Voir l'arborescence
        </Link>
      </div>

      {error && (
        <div className="form-error" role="alert" style={{ marginBottom: 20 }}>
          {error}
        </div>
      )}

      <div className="stat-grid">
        {navOrder.map((key, i) => (
          <Link className="stat-card" key={key} to={`${BASE}/${key}`}>
            <span className="stat-step">{i + 1}</span>
            <div className="value">{stats ? stats[statsKey[key]] : '…'}</div>
            <div className="label">{entities[key].label}</div>
          </Link>
        ))}
        <div className="stat-card stat-accent">
          <div className="value">{stats ? `${stats.volumeHoraireTotal} h` : '…'}</div>
          <div className="label">Volume horaire total</div>
        </div>
      </div>

      <div className="hierarchy">
        <h3>Hiérarchie du domaine</h3>
        <div className="hierarchy-chain">
          {navOrder.map((key, i) => (
            <span key={key} className="chain-item">
              {i > 0 && (
                <span className="arrow" aria-hidden="true">
                  →
                </span>
              )}
              <Link
                to={`${BASE}/${key}`}
                className="node"
                style={{ background: chainColors[i], color: i === 3 ? 'var(--navy)' : undefined }}
              >
                {entities[key].singular}
              </Link>
            </span>
          ))}
        </div>
        <p className="hierarchy-note">
          Chaque élément dépend de celui qui le précède : créez-les dans cet ordre. Supprimer un élément
          supprime aussi tout ce qui lui est rattaché.
        </p>
      </div>

      {isEmpty && (
        <div className="hierarchy start-card">
          <h3>Pour commencer</h3>
          <ol>
            <li>
              Créez une <Link to={`${BASE}/mentions`}>mention</Link> (ex : Informatique).
            </li>
            <li>
              Ajoutez-lui un <Link to={`${BASE}/cycles`}>cycle</Link> (Licence ou Master).
            </li>
            <li>
              Définissez les <Link to={`${BASE}/niveaux`}>niveaux</Link> (L1, L2…), puis leurs{' '}
              <Link to={`${BASE}/annees-universitaires`}>années universitaires</Link>.
            </li>
            <li>
              Ajoutez les <Link to={`${BASE}/semestres`}>semestres</Link> et enfin les{' '}
              <Link to={`${BASE}/matieres`}>matières</Link>.
            </li>
          </ol>
        </div>
      )}
    </>
  );
}

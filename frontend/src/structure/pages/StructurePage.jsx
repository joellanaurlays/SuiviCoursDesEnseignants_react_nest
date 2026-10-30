import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { BASE } from '../config/paths.js';

function Node({ level, title, meta, children, defaultOpen = false, forceOpen }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <details className={`tree-node level-${level}`} open={forceOpen ?? defaultOpen} key={String(forceOpen)}>
      <summary>
        <span className="tree-title">{title}</span>
        {meta && <span className="tree-meta">{meta}</span>}
      </summary>
      {hasChildren ? <div className="tree-children">{children}</div> : <div className="tree-empty">Aucun élément</div>}
    </details>
  );
}

const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;

export default function StructurePage() {
  const [tree, setTree] = useState(null);
  const [error, setError] = useState('');
  const [forceOpen, setForceOpen] = useState(undefined);

  useEffect(() => {
    api
      .get('/structure/tree')
      .then((res) => setTree(res.data))
      .catch((err) => setError(err.userMessage));
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">Structure académique</div>
          <h2>Vue arborescente</h2>
          <p>Toute la hiérarchie en un coup d'œil : Mention → Cycle → Niveau → Année → Semestre → Matières.</p>
        </div>
        <div className="row-actions">
          <button className="btn-secondary" onClick={() => setForceOpen(true)}>
            Tout déplier
          </button>
          <button className="btn-secondary" onClick={() => setForceOpen(false)}>
            Tout replier
          </button>
        </div>
      </div>

      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      {!tree && !error && (
        <div className="table-card" aria-busy="true">
          <div className="skeleton-list">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton" />
            ))}
          </div>
        </div>
      )}

      {tree && tree.length === 0 && (
        <div className="table-card">
          <div className="empty-state">
            <strong>Aucune donnée</strong>
            Commencez par créer une <Link to={`${BASE}/mentions`}>mention</Link>.
          </div>
        </div>
      )}

      {tree && tree.length > 0 && (
        <div className="tree">
          {tree.map((m) => (
            <Node key={m.id} level={1} title={m.nom} meta={plural(m.cycles.length, 'cycle')} defaultOpen forceOpen={forceOpen}>
              {m.cycles.map((c) => (
                <Node key={c.id} level={2} title={c.type} meta={plural(c.niveaux.length, 'niveau')} defaultOpen forceOpen={forceOpen}>
                  {c.niveaux.map((n) => (
                    <Node
                      key={n.id}
                      level={3}
                      title={n.libelle}
                      meta={plural(n.anneesUniversitaires.length, 'année')}
                      defaultOpen
                      forceOpen={forceOpen}
                    >
                      {n.anneesUniversitaires.map((a) => (
                        <Node
                          key={a.id}
                          level={4}
                          title={a.libelle}
                          meta={plural(a.semestres.length, 'semestre')}
                          defaultOpen
                          forceOpen={forceOpen}
                        >
                          {a.semestres.map((s) => (
                            <Node
                              key={s.id}
                              level={5}
                              title={`Semestre ${s.numero}`}
                              meta={plural(s.matieres.length, 'matière')}
                              defaultOpen
                              forceOpen={forceOpen}
                            >
                              <ul className="subject-list">
                                {s.matieres.map((mat) => (
                                  <li key={mat.id}>
                                    <span>{mat.nom}</span>
                                    <span className="pill">{mat.volumeHoraire} h</span>
                                  </li>
                                ))}
                              </ul>
                            </Node>
                          ))}
                        </Node>
                      ))}
                    </Node>
                  ))}
                </Node>
              ))}
            </Node>
          ))}
        </div>
      )}
    </>
  );
}

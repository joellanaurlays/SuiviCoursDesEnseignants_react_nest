import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { entities } from '../config/entities.jsx';
import EntityDrawer from '../components/EntityDrawer';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { useCanEdit } from '../hooks/useCanEdit';
import { debutParDefaut, formatPeriode, libelleAnnee } from '../utils/dates.js';

const NIVEAUX = ['L1', 'L2', 'L3', 'M1', 'M2'];

// Profondeur d'affichage selon la vue choisie (tableau de bord ou boutons) : 1 = mentions seulement ... 6 = jusqu'aux matieres.
const VUES = [
  { key: 'tout', label: 'Tout', depth: 6 },
  { key: 'mentions', label: 'Mentions', depth: 1 },
  { key: 'cycles', label: 'Cycles', depth: 2 },
  { key: 'niveaux', label: 'Niveaux', depth: 3 },
  { key: 'annees-universitaires', label: 'Années', depth: 4 },
  { key: 'semestres', label: 'Semestres', depth: 5 },
  { key: 'matieres', label: 'Matières', depth: 6 },
];
const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;

// Pour chaque niveau de l'arbre : l'element enfant que le bouton « Ajouter » cree (cle de entities + cle etrangere).
const CHILD = {
  mentions: { key: 'cycles', fk: 'mentionId', label: 'un cycle' },
  cycles: { key: 'niveaux', fk: 'cycleId', label: 'un niveau' },
  niveaux: { key: 'annees-universitaires', fk: 'niveauId', label: 'une année' },
  'annees-universitaires': { key: 'semestres', fk: 'anneeUniversitaireId', label: 'un semestre' },
  semestres: { key: 'matieres', fk: 'semestreId', label: 'une matière' },
};

/** Boutons Modifier / Supprimer d'une ligne (visibles seulement pour la scolarité). */
function Actions({ canEdit, onAdd, addLabel, onEdit, onDelete }) {
  if (!canEdit) return null;
  const stop = (fn) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  };
  return (
    <span className="tree-actions">
      {onAdd && (
        <button type="button" className="mini add" title={`Ajouter ${addLabel}`} onClick={stop(onAdd)}>
          ＋ Ajouter
        </button>
      )}
      <button type="button" className="mini" onClick={stop(onEdit)}>
        Modifier
      </button>
      <button type="button" className="mini danger" onClick={stop(onDelete)}>
        Supprimer
      </button>
    </span>
  );
}

function Node({ level, title, meta, period, actions, children, forceOpen, leaf = false, empty = 'Aucun élément' }) {
  const hasChildren = Array.isArray(children) ? children.some(Boolean) : Boolean(children);
  return (
    <details className={`tree-node level-${level}${leaf ? ' leaf' : ''}`} open={leaf ? false : (forceOpen ?? true)} key={String(forceOpen)}>
      <summary>
        <span className="tree-title">{title}</span>
        {period && <span className="tree-period">{period}</span>}
        {meta && <span className="tree-meta">{meta}</span>}
        {actions}
      </summary>
      {leaf ? null : hasChildren ? <div className="tree-children">{children}</div> : <div className="tree-empty">{empty}</div>}
    </details>
  );
}

/** Générer la structure standard d'une mention existante. */
function GenerateDialog({ mention, onClose, onDone }) {
  const [debut] = useState(debutParDefaut());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post(`/mentions/${mention.id}/structure`, { anneeDebut: debut });
      onDone(data.generated);
    } catch (err) {
      setError(err.userMessage);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="drawer" role="dialog" aria-modal="true" onSubmit={submit} noValidate>
        <div className="drawer-head">
          <div>
            <div className="eyebrow">Génération automatique</div>
            <h3>Générer la structure — {mention.nom}</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="drawer-body">
          <p className="field-hint">
            Crée Licence (L1 : S1-S2, L2 : S3-S4, L3 : S5-S6) et Master (M1 : S7-S8, M2 : S9-S10) pour {libelleAnnee(debut)}.
            Les éléments déjà présents ne sont pas dupliqués.
          </p>
        </div>
        <div className="drawer-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Génération…' : 'Générer'}</button>
        </div>
      </form>
    </div>
  );
}

export default function StructurePage() {
  const toast = useToast();
  const canEdit = useCanEdit();
  const [params, setParams] = useSearchParams();
  const [tree, setTree] = useState(null);
  const [error, setError] = useState('');
  const [forceOpen, setForceOpen] = useState(undefined);
  const [mentionId, setMentionId] = useState(params.get('mention') ?? '');
  const [niveau, setNiveau] = useState('');
  const vue = VUES.find((v) => v.key === params.get('vue')) ?? VUES[0];
  const depth = vue.depth;
  const setVue = (key) =>
    setParams((p) => {
      if (key === 'tout') p.delete('vue');
      else p.set('vue', key);
      return p;
    });
  const [drawer, setDrawer] = useState(null); // { key, data }  (data sans id => creation)
  const [toDelete, setToDelete] = useState(null); // { key, data }
  const [deleting, setDeleting] = useState(false);
  const [generateFor, setGenerateFor] = useState(null);

  const load = useCallback(() => {
    setError('');
    api
      .get('/structure/tree')
      .then((res) => setTree(res.data))
      .catch((err) => setError(err.userMessage));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

    // Arrivee depuis le tableau de bord (?ajouter=cycles...) : ouvre directement le formulaire d'ajout.
  const ajouter = params.get('ajouter');
  useEffect(() => {
    if (!ajouter) return;
    if (canEdit && entities[ajouter]) setDrawer({ key: ajouter, data: null });
    setParams((p) => {
      p.delete('ajouter');
      return p;
    }, { replace: true });
  }, [ajouter, canEdit, setParams]);

  // Filtres Mention / Niveau appliques a l'arbre
  const shown = useMemo(() => {
    if (!tree) return null;
    return tree
      .filter((m) => !mentionId || String(m.id) === mentionId)
      .map((m) => ({
        ...m,
        cycles: m.cycles
          .map((c) => ({ ...c, niveaux: c.niveaux.filter((n) => !niveau || n.libelle === niveau) }))
          .filter((c) => !niveau || c.niveaux.length > 0),
      }));
  }, [tree, mentionId, niveau]);

  async function confirmDelete() {
    setDeleting(true);
    try {
      await api.delete(`${entities[toDelete.key].endpoint}/${toDelete.data.id}`);
      toast.success(`${entities[toDelete.key].singular} supprimé(e) avec ses éléments rattachés.`);
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(err.userMessage);
    } finally {
      setDeleting(false);
    }
  }

    const act = (key, data) => {
    const child = CHILD[key];
    return (
      <Actions
        canEdit={canEdit}
        addLabel={child.label}
        onAdd={() => setDrawer({ key: child.key, data: { [child.fk]: data.id } })}
        onEdit={() => setDrawer({ key, data })}
        onDelete={() => setToDelete({ key, data })}
      />
    );
  };

  return (
    <>
            <div className="page-header">
        <div className="panel-head">
          <div>
            <h2>
              Structure académique
              <span className="sa-chip soft">{vue.key === 'tout' ? 'Vue complète' : vue.label}</span>
            </h2>
            <p>Mention → Cycle → Niveau → Année → Semestre → Matière</p>
          </div>
          <div className="head-actions">
            {canEdit && (
              <button className="btn-primary" onClick={() => setDrawer({ key: 'mentions', data: null })}>
                <span aria-hidden="true">＋</span> Ajouter une mention
              </button>
            )}
            <div className="seg">
              <button className={forceOpen === true ? 'on' : ''} onClick={() => setForceOpen(true)}>Tout déplier</button>
              <button className={forceOpen === false ? 'on' : ''} onClick={() => setForceOpen(false)}>Tout replier</button>
            </div>
          </div>
        </div>
        <div className="filters">
          <label>
            <span>Mention</span>
            <select value={mentionId} onChange={(e) => setMentionId(e.target.value)}>
              <option value="">Toutes les mentions</option>
              {(tree ?? []).map((m) => (
                <option key={m.id} value={m.id}>{m.nom}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Niveau</span>
            <select value={niveau} onChange={(e) => setNiveau(e.target.value)}>
              <option value="">Tous les niveaux</option>
              {NIVEAUX.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error && <div className="form-error" role="alert">{error}</div>}

      {!tree && !error && (
        <div className="table-card" aria-busy="true">
          <div className="skeleton-list">{[0, 1, 2].map((i) => <div key={i} className="skeleton" />)}</div>
        </div>
      )}

      {shown && shown.length === 0 && (
        <div className="table-card">
          <div className="empty-state">
            <strong>Aucune donnée</strong>
            {canEdit ? 'Cliquez sur « Ajouter une mention » : sa structure sera générée automatiquement.' : 'Aucune mention enregistrée.'}
          </div>
        </div>
      )}

      {shown && shown.length > 0 && (
        <div className="tree">
          {shown.map((m) => (
            <Node
              key={m.id}
              level={1}
              leaf={depth <= 1}
              title={m.nom}
              meta={plural(m.cycles.length, 'cycle')}
              actions={act('mentions', m)}
              forceOpen={forceOpen}
              empty="Aucun cycle pour cette mention."
            >
              {m.cycles.length === 0 && canEdit && !niveau && (
                <button className="btn-primary" onClick={() => setGenerateFor(m)}>
                  Générer la structure (Licence, Master, S1–S10)
                </button>
              )}
              {m.cycles.map((c) => (
                <Node key={c.id} level={2} leaf={depth <= 2} title={c.type} meta={plural(c.niveaux.length, 'niveau')} actions={act('cycles', c)} forceOpen={forceOpen}>
                  {c.niveaux.map((n) => (
                    <Node key={n.id} level={3} leaf={depth <= 3} title={n.libelle} meta={plural(n.anneesUniversitaires.length, 'année')} actions={act('niveaux', n)} forceOpen={forceOpen}>
                      {n.anneesUniversitaires.map((a) => (
                        <Node
                          key={a.id}
                          level={4}
                          leaf={depth <= 4}
                          title={a.libelle}
                          period={formatPeriode(a.dateDebut, a.dateFin)}
                          meta={plural(a.semestres.length, 'semestre')}
                          actions={act('annees-universitaires', a)}
                          forceOpen={forceOpen}
                        >
                          {a.semestres.map((s) => (
                            <Node
                              key={s.id}
                              level={5}
                              leaf={depth <= 5}
                              title={`Semestre S${s.numero}`}
                              period={formatPeriode(s.dateDebut, s.dateFin)}
                              meta={plural(s.matieres.length, 'matière')}
                              actions={act('semestres', s)}
                              forceOpen={forceOpen}
                              empty="Aucune matière"
                            >
                              <ul className="subject-list">
                                {s.matieres.map((mat) => (
                                  <li key={mat.id}>
                                    <span>{mat.nom}</span>
                                    <span className="subject-right">
                                      <span className="pill">{mat.volumeHoraire} h</span>
                                      <Actions canEdit={canEdit} onEdit={() => setDrawer({ key: 'matieres', data: mat })} onDelete={() => setToDelete({ key: 'matieres', data: mat })} />
                                    </span>
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

      {drawer && (
        <EntityDrawer
          config={entities[drawer.key]}
          initialData={drawer.data}
          onClose={() => setDrawer(null)}
          onSaved={(action, saved) => {
            const key = drawer.key;
            setDrawer(null);
            if (key === 'mentions' && action === 'ajouté' && saved?.generated) {
              const g = saved.generated;
              toast.success(`Mention créée : ${g.cycles} cycles, ${g.niveaux} niveaux, ${g.annees} années, ${g.semestres} semestres générés.`);
              setMentionId(String(saved.id));
            } else {
              toast.success(`${entities[key].singular} ${action}(e) avec succès.`);
            }
            load();
          }}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title={`Supprimer ${entities[toDelete.key].article} ${entities[toDelete.key].singular.toLowerCase()} ?`}
          message={`« ${entities[toDelete.key].optionLabel(toDelete.data)} » sera supprimé(e) définitivement, ainsi que tous les éléments qui y sont rattachés. Cette action est irréversible.`}
          confirmLabel="Supprimer"
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => !deleting && setToDelete(null)}
        />
      )}

      {generateFor && (
        <GenerateDialog
          mention={generateFor}
          onClose={() => setGenerateFor(null)}
          onDone={(g) => {
            setGenerateFor(null);
            toast.success(`Structure générée : ${g.niveaux} niveaux, ${g.annees} années, ${g.semestres} semestres.`);
            load();
          }}
        />
      )}
    </>
  );
}
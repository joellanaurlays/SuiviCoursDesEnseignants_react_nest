import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import { entities } from '../config/entities.jsx';
import DataTable from '../components/DataTable';
import EntityDrawer from '../components/EntityDrawer';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { useCanEdit } from '../hooks/useCanEdit';
import { BASE } from '../config/paths.js';

export default function CrudPage() {
  const { entityKey } = useParams();
  const config = entities[entityKey];

  if (!config) {
    return (
      <div className="table-card">
        <div className="empty-state">
          <strong>Page introuvable</strong>
          Cette section n'existe pas dans le module Structure académique.
          <div style={{ marginTop: 16 }}>
            <Link className="btn-primary" to={BASE}>
              Retour au tableau de bord
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // key={entityKey} remet a zero l'etat (recherche, tiroir...) a chaque changement de section
  return <CrudContent key={entityKey} entityKey={entityKey} config={config} />;
}

function CrudContent({ config }) {
  const toast = useToast();
  const canEdit = useCanEdit();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [drawer, setDrawer] = useState(null); // null | { editing: row | null }
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError('');
    api
      .get(config.endpoint)
      .then((res) => setRows(res.data))
      .catch((err) => {
        setRows([]);
        setLoadError(err.userMessage);
      })
      .finally(() => setLoading(false));
  }, [config]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => config.searchText(r).toLowerCase().includes(q));
  }, [rows, query, config]);

  async function confirmDelete() {
    setDeleting(true);
    try {
      await api.delete(`${config.endpoint}/${toDelete.id}`);
      toast.success(`${config.singular} supprimé(e) avec ses éléments rattachés.`);
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(err.userMessage);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="eyebrow">Structure académique</div>
          <h2>{config.label}</h2>
          <p>{config.description}</p>
        </div>
        {canEdit && (
        <button className="btn-primary" onClick={() => setDrawer({ editing: null })}>
          <span aria-hidden="true">＋</span> Ajouter {config.article} {config.singular.toLowerCase()}
        </button>
        )}
      </div>

      <div className="toolbar">
        <div className="search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder={`Rechercher parmi les ${config.label.toLowerCase()}…`}
            aria-label={`Rechercher parmi les ${config.label.toLowerCase()}`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <span className="count">
          {loading
            ? 'Chargement…'
            : query
              ? `${filtered.length} sur ${rows.length}`
              : `${rows.length} élément${rows.length > 1 ? 's' : ''}`}
        </span>
      </div>

      {loading ? (
        <div className="table-card" aria-busy="true">
          <div className="skeleton-list">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton" />
            ))}
          </div>
        </div>
      ) : loadError ? (
        <div className="table-card">
          <div className="empty-state">
            <strong>Chargement impossible</strong>
            {loadError}
            <div style={{ marginTop: 16 }}>
              <button className="btn-primary" onClick={load}>
                Réessayer
              </button>
            </div>
          </div>
        </div>
      ) : (
        <DataTable
          readOnly={!canEdit}
          columns={config.columns}
          rows={filtered}
          totalCount={rows.length}
          onEdit={(row) => setDrawer({ editing: row })}
          onDelete={setToDelete}
        />
      )}

      {drawer && (
        <EntityDrawer
          config={config}
          initialData={drawer.editing}
          onClose={() => setDrawer(null)}
          onSaved={(action) => {
            setDrawer(null);
            toast.success(`${config.singular} ${action}(e) avec succès.`);
            load();
          }}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title={`Supprimer ${config.article} ${config.singular.toLowerCase()} ?`}
          message={`« ${config.optionLabel(toDelete)} » sera supprimé(e) définitivement, ainsi que tous les éléments qui y sont rattachés. Cette action est irréversible.`}
          confirmLabel="Supprimer"
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => !deleting && setToDelete(null)}
        />
      )}
    </>
  );
}

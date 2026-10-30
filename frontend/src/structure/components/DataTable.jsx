export default function DataTable({ columns, rows, totalCount, onEdit, onDelete, readOnly = false }) {
  if (!rows || rows.length === 0) {
    const filtered = totalCount > 0;
    return (
      <div className="table-card">
        <div className="empty-state">
          <strong>{filtered ? 'Aucun résultat' : "Rien à afficher pour l'instant"}</strong>
          {filtered
            ? 'Aucun élément ne correspond à votre recherche.'
            : readOnly
              ? 'La structure sera visible dès que la scolarité aura créé des éléments.'
              : 'Ajoutez le premier élément avec le bouton « Ajouter ».'}
        </div>
      </div>
    );
  }

  return (
    <div className="table-card">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th className="col-id">#</th>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
              {!readOnly && (
                <th className="col-actions">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="col-id">
                  <span className="pill pill-muted">{row.id}</span>
                </td>
                {columns.map((col) => (
                  <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
                ))}
                {!readOnly && (
                <td className="col-actions">
                  <div className="row-actions">
                    <button className="icon-btn" onClick={() => onEdit(row)}>
                      Modifier
                    </button>
                    <button className="icon-btn danger" onClick={() => onDelete(row)}>
                      Supprimer
                    </button>
                  </div>
                </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

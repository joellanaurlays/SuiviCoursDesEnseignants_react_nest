import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listUsers, updateUser } from '../services/usersApi.js'

const ROLE_OPTIONS = [
  { value: '', label: 'Tous les rôles' },
  { value: 'CHEF_SCOLARITE', label: 'Chef de scolarité' },
  { value: 'ADMINISTRATEUR', label: 'Administrateur' },
  { value: 'RESPONSABLE_LICENCE', label: 'Responsable Licence' },
  { value: 'RESPONSABLE_MASTER', label: 'Responsable Master' },
  { value: 'ENSEIGNANT', label: 'Enseignant' },
]

function UsersListPage() {
  const [data, setData] = useState({ data: [], meta: { total: 0, page: 1, totalPages: 1 } })
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [isActive, setIsActive] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false
    setIsLoading(true)
    setError('')

    listUsers({ search, role, isActive, page, limit: 10 })
      .then((result) => {
        if (!ignore) setData(result)
      })
      .catch((err) => {
        if (!ignore) setError(err.message)
      })
      .finally(() => {
        if (!ignore) setIsLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [search, role, isActive, page])

  async function handleToggleActive(user) {
    try {
      await updateUser(user.id, { isActive: !user.isActive })
      setData((prev) => ({
        ...prev,
        data: prev.data.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u)),
      }))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-bg px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to="/dashboard" className="text-sm text-primary hover:text-primary-dark">
              &larr; Retour
            </Link>
            <h1 className="text-2xl font-bold text-text mt-2">Gestion des utilisateurs</h1>
          </div>
          <Link
            to="/users/new"
            className="bg-primary hover:bg-primary-dark text-white font-medium rounded-lg px-4 py-2 transition-colors"
          >
            + Nouvel utilisateur
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Rechercher (nom, email...)"
            value={search}
            onChange={(e) => {
              setPage(1)
              setSearch(e.target.value)
            }}
            className="flex-1 min-w-[200px] rounded-lg border border-slate-300 px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={role}
            onChange={(e) => {
              setPage(1)
              setRole(e.target.value)
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={isActive}
            onChange={(e) => {
              setPage(1)
              setIsActive(e.target.value)
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Tous les statuts</option>
            <option value="true">Actif</option>
            <option value="false">Désactivé</option>
          </select>
        </div>

        {error && (
          <p className="text-sm text-error bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Chargement...
                  </td>
                </tr>
              )}

              {!isLoading && data.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              )}

              {!isLoading &&
                data.data.map((user) => (
                  <tr key={user.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-text">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{user.email}</td>
                    <td className="px-4 py-3 text-slate-500">{user.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium rounded-full px-2 py-1 ${
                          user.isActive
                            ? 'text-success bg-green-50'
                            : 'text-error bg-red-50'
                        }`}
                      >
                        {user.isActive ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link
                        to={`/users/${user.id}/edit`}
                        className="text-primary hover:text-primary-dark text-sm font-medium mr-3"
                      >
                        Modifier
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(user)}
                        className={`text-sm font-medium ${
                          user.isActive ? 'text-error hover:text-red-700' : 'text-success hover:text-green-700'
                        }`}
                      >
                        {user.isActive ? 'Désactiver' : 'Réactiver'}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
          <span>
            Page {data.meta.page} sur {data.meta.totalPages || 1} — {data.meta.total} utilisateur(s)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
            >
              Précédent
            </button>
            <button
              type="button"
              disabled={page >= data.meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UsersListPage
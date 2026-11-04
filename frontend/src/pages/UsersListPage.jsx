import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, X } from 'lucide-react'
import { listUsers, updateUser } from '../services/usersApi.js'
import { FilterBar } from '../components/enseignements/FilterBar'
import { StatCard } from '../components/ui/StatCard'
import { LoadingState } from '../components/ui/LoadingState'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'

const ROLE_OPTIONS = [
  { value: '', label: 'Tous les rôles' },
  { value: 'CHEF_SCOLARITE', label: 'Chef de scolarité' },
  { value: 'ADMINISTRATEUR', label: 'Administrateur' },
  { value: 'RESPONSABLE_LICENCE', label: 'Responsable Licence' },
  { value: 'RESPONSABLE_MASTER', label: 'Responsable Master' },
  { value: 'ENSEIGNANT', label: 'Enseignant' },
]

const ROLE_LABELS = ROLE_OPTIONS.reduce((acc, opt) => {
  if (opt.value) acc[opt.value] = opt.label
  return acc
}, {})

const ROLE_BADGE_STYLES = {
  ADMINISTRATEUR: 'bg-violet-100 text-violet-800',
  CHEF_SCOLARITE: 'bg-sky-100 text-sky-800',
  RESPONSABLE_LICENCE: 'bg-yellow-100 text-yellow-800',
  RESPONSABLE_MASTER: 'bg-teal-100 text-teal-800',
  ENSEIGNANT: 'bg-gray-100 text-gray-800',
}

const FIELDS = [
  { key: 'role', label: 'Rôle', options: ROLE_OPTIONS.filter((o) => o.value) },
  {
    key: 'isActive',
    label: 'Statut',
    options: [
      { value: 'true', label: 'Actif' },
      { value: 'false', label: 'Désactivé' },
    ],
  },
]

function UsersListPage() {
  const [data, setData] = useState({ data: [], meta: { total: 0, page: 1, totalPages: 1 } })
  const [stats, setStats] = useState({ total: 0, actifs: 0, inactifs: 0 })
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [isActive, setIsActive] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [userToDeactivate, setUserToDeactivate] = useState(null)

  const loadStats = useCallback(() => {
    Promise.all([
      listUsers({ page: 1, limit: 1 }),
      listUsers({ page: 1, limit: 1, isActive: 'true' }),
      listUsers({ page: 1, limit: 1, isActive: 'false' }),
    ])
      .then(([all, actifs, inactifs]) => {
        setStats({ total: all.meta.total, actifs: actifs.meta.total, inactifs: inactifs.meta.total })
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

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
      loadStats()
    } catch (err) {
      setError(err.message)
    }
  }

  function handleFiltersChange(filters) {
    setPage(1)
    setRole(filters.role ?? '')
    setIsActive(filters.isActive ?? '')
  }

  function handleReset() {
    setPage(1)
    setSearch('')
    setRole('')
    setIsActive('')
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-2 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-[#03045E]">Gestion des utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Créez, modifiez et activez les comptes de l'application.
          </p>
        </div>
        <Link
          to="/users/new"
          className="px-4 py-2 bg-[#0077B6] text-white rounded-md text-sm hover:bg-[#03045E] transition-colors font-medium"
        >
          + Nouvel utilisateur
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 mb-6">
        <StatCard label="Utilisateurs" value={stats.total} />
        <StatCard label="Actifs" value={stats.actifs} hint="Peuvent se connecter" />
        <StatCard label="Désactivés" value={stats.inactifs} hint="Accès suspendu" />
      </div>

      <FilterBar
        fields={FIELDS}
        filters={{ role, isActive }}
        onFiltersChange={handleFiltersChange}
        onSearch={(term) => {
          setPage(1)
          setSearch(term)
        }}
        searchValue={search}
        searchPlaceholder="Nom, email..."
        onReset={handleReset}
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {error ? (
          <ErrorState
            message={error}
            onRetry={() => {
              setIsLoading(true)
              setError('')
              listUsers({ search, role, isActive, page, limit: 10 })
                .then(setData)
                .catch((err) => setError(err.message))
                .finally(() => setIsLoading(false))
            }}
          />
        ) : isLoading ? (
          <LoadingState label="Chargement des utilisateurs..." />
        ) : data.data.length === 0 ? (
          <EmptyState message="Aucun utilisateur ne correspond à vos critères." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-gray-500 text-sm border-b border-gray-100">
                <tr>
                  <th className="px-4 py-4 font-medium">Nom</th>
                  <th className="px-4 py-4 font-medium">Email</th>
                  <th className="px-4 py-4 font-medium">Rôle</th>
                  <th className="px-4 py-4 font-medium">Statut</th>
                  <th className="px-4 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.data.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-4 py-4 text-gray-600">{user.email}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          ROLE_BADGE_STYLES[user.role] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.isActive ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <Link
                        to={`/users/${user.id}/edit`}
                        className="text-[#0077B6] hover:text-[#0077B6] hover:underline font-medium mr-4"
                      >
                        Modifier
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          user.isActive ? setUserToDeactivate(user) : handleToggleActive(user)
                        }
                        className={`font-medium hover:underline ${
                          user.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-700 hover:text-green-800'
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
        )}
      </div>

      {!isLoading && !error && data.data.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>
            Page {data.meta.page} sur {data.meta.totalPages || 1} — {data.meta.total} utilisateur(s)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Précédent
            </button>
            <button
              type="button"
              disabled={page >= data.meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      <DeactivateModal
        user={userToDeactivate}
        onCancel={() => setUserToDeactivate(null)}
        onConfirm={async (user) => {
          await handleToggleActive(user)
          setUserToDeactivate(null)
        }}
      />
    </div>
  )
}

function DeactivateModal({ user, onCancel, onConfirm }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!user) {
    return null
  }

  async function handleConfirm() {
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      await onConfirm(user)
    } catch (err) {
      setError(err.message || "La désactivation n'a pas pu être enregistrée.")
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#03045E]/50" onClick={submitting ? undefined : onCancel} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="desactivation-titre"
        className="relative w-full max-w-lg bg-white rounded-xl border border-gray-200 shadow-xl"
      >
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <h2 id="desactivation-titre" className="text-xl font-bold text-[#03045E]">
            Désactivation du compte
          </h2>
          <button
            onClick={onCancel}
            disabled={submitting}
            aria-label="Fermer"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={22} />
            <p className="text-sm text-gray-700">
              Vous êtes sur le point de désactiver le compte de{' '}
              <span className="font-semibold text-gray-900">
                {user.firstName} {user.lastName}
              </span>{' '}
              (<span className="font-mono">{user.email}</span>). L'utilisateur ne pourra plus se
              connecter à l'application.
            </p>
          </div>
          {error && <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-600 bg-white hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {submitting ? 'Désactivation...' : 'Confirmer la désactivation'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default UsersListPage

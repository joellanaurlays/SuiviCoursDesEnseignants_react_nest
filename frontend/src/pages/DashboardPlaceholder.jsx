import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const MANAGE_USERS_ROLES = ['CHEF_SCOLARITE', 'ADMINISTRATEUR']

function DashboardPlaceholder() {
  const { user, logout } = useAuth()
  const canManageUsers = MANAGE_USERS_ROLES.includes(user.role)

  return (
    <div className="min-h-screen bg-bg px-6 py-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-text">EMIT — Espace connecté</h1>
          <p className="text-sm text-slate-500">
            {user.firstName} {user.lastName} — {user.role}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canManageUsers && (
            <Link
              to="/users"
              className="text-sm font-medium text-primary border border-primary rounded-lg px-3 py-1.5 hover:bg-blue-50"
            >
              Gestion des utilisateurs
            </Link>
          )}
          <Link
            to="/profile"
            className="text-sm font-medium text-primary border border-primary rounded-lg px-3 py-1.5 hover:bg-blue-50"
          >
            Mon profil
          </Link>
          <button
            type="button"
            onClick={logout}
            className="text-sm font-medium text-error border border-error rounded-lg px-3 py-1.5 hover:bg-red-50"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-500">
        Espace temporaire de test du module Utilisateurs/Auth. Le vrai tableau de bord
        (par rôle) sera fourni par les autres modules du projet.
      </div>
    </div>
  )
}

export default DashboardPlaceholder
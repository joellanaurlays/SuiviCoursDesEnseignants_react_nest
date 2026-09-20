import { useAuth } from '../context/AuthContext.jsx'

function DashboardPlaceholder() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-bg px-6 py-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-text">EMIT — Espace connecté</h1>
          <p className="text-sm text-slate-500">
            {user.firstName} {user.lastName} — {user.role}
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="text-sm font-medium text-error border border-error rounded-lg px-3 py-1.5 hover:bg-red-50"
        >
          Déconnexion
        </button>
      </header>

      <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-500">
        Espace temporaire de test du module Utilisateurs/Auth. Le vrai tableau de bord
        (par rôle) sera fourni par les autres modules du projet.
      </div>
    </div>
  )
}

export default DashboardPlaceholder
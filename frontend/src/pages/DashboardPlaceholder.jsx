import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const MANAGE_USERS_ROLES = ['CHEF_SCOLARITE', 'ADMINISTRATEUR']

// Page d'atterrissage « Mon espace » par rôle (reliure des modules M2/M4).
const ESPACE_PAR_ROLE = {
  ENSEIGNANT: { path: '/enseignant/dashboard', label: 'Mon tableau de bord enseignant' },
  CHEF_SCOLARITE: { path: '/scolarite/suivi-enseignements', label: 'Suivi des enseignements (scolarité)' },
  RESPONSABLE_LICENCE: { path: '/responsable/licence/suivi-enseignements', label: 'Suivi des enseignements (Licence)' },
  RESPONSABLE_MASTER: { path: '/responsable/master/suivi-enseignements', label: 'Suivi des enseignements (Master)' },
  ADMINISTRATEUR: { path: '/admin/suivi-enseignements', label: 'Suivi des enseignements (administration)' },
}

function LienCarte({ to, titre, description }) {
  return (
    <Link
      to={to}
      className="block bg-white border border-slate-200 rounded-xl p-5 hover:border-primary hover:shadow-sm transition"
    >
      <p className="font-semibold text-text">{titre}</p>
      <p className="text-sm text-slate-500 mt-1">{description}</p>
    </Link>
  )
}

function DashboardHub() {
  const { user, logout } = useAuth()
  const displayUser = user ?? {
    firstName: 'Mode',
    lastName: 'aperçu',
    role: 'ADMINISTRATEUR',
  }
  const canManageUsers = MANAGE_USERS_ROLES.includes(displayUser.role)
  const espace = ESPACE_PAR_ROLE[displayUser.role]

  return (
    <div className="min-h-screen bg-bg px-6 py-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-text">EMIT — Tableau de bord</h1>
          <p className="text-sm text-slate-500">
            {displayUser.firstName} {displayUser.lastName} — {displayUser.role}
          </p>
        </div>
        {user && (
          <button
            type="button"
            onClick={logout}
            className="text-sm font-medium text-error border border-error rounded-lg px-3 py-1.5 hover:bg-red-50"
          >
            Déconnexion
          </button>
        )}
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl">
        {espace && (
          <LienCarte
            to={espace.path}
            titre="Mon espace de travail"
            description={espace.label}
          />
        )}
        <LienCarte
          to="/"
          titre="Emploi du temps"
          description="Planning, salles, créneaux et contraintes (Membre 5)."
        />
        <LienCarte
          to="/exams"
          titre="Examens & notes"
          description="Sessions d'examen, états et remise des notes (Membre 6)."
        />
        {canManageUsers && (
          <LienCarte
            to="/users"
            titre="Gestion des utilisateurs"
            description="Comptes, rôles et permissions (Membre 1)."
          />
        )}
        <LienCarte
          to="/profile"
          titre="Mon profil"
          description="Consulter et modifier mes informations."
        />
      </div>
    </div>
  )
}

export default DashboardHub

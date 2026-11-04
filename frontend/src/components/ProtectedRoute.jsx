import { Navigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { ShieldX } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { getRoleHomePath } from '../routing/roleRoutes.js'

const ROLE_LABELS = {
  ENSEIGNANT: 'Enseignant',
  CHEF_SCOLARITE: 'Chef de scolarité',
  ADMINISTRATEUR: 'Administrateur',
  RESPONSABLE_LICENCE: 'Responsable Licence',
  RESPONSABLE_MASTER: 'Responsable Master',
  RESPONSABLE_MENTION: 'Responsable de mention',
}

/** Écran affiché quand le rôle connecté n'a pas le droit d'accéder à la page. */
function AccessDenied({ homePath, role }) {
  const label = ROLE_LABELS[role] || role
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-4">
          <ShieldX className="text-red-500" size={26} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-red-500 mb-1">Erreur 403</p>
        <h1 className="text-2xl font-bold text-[#03045E] mb-2">Accès refusé</h1>
        <p className="text-sm text-gray-500 mb-6">
          Votre rôle (<span className="font-medium text-gray-700">{label}</span>) ne permet pas
          d'accéder à cette page.
        </p>
        <Link
          to={homePath}
          className="inline-block px-4 py-2 bg-[#0077B6] text-white rounded-md text-sm font-medium hover:bg-[#03045E] transition-colors"
        >
          Retour à mon espace
        </Link>
      </div>
    </div>
  )
}

/**
 * @param {{ children: import('react').ReactNode, allowedRoles?: string[] | null }} props
 */
function ProtectedRoute({ children, allowedRoles = null }) {
  const { session, isLoading } = useAuth()

  if (isLoading) {
    return <p style={{ textAlign: 'center', marginTop: '4rem' }}>Chargement...</p>
  }

  if (!session.userId) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return <AccessDenied homePath={getRoleHomePath(session)} role={session.role} />
  }

  return children
}

export default ProtectedRoute

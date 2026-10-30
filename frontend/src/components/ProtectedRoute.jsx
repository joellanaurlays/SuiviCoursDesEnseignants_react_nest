import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getRoleHomePath } from '../routing/roleRoutes.js'

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
    return <Navigate to={getRoleHomePath(session)} replace />
  }

  return children
}

export default ProtectedRoute

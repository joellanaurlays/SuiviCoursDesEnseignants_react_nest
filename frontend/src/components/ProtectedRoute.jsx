import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getRoleHomePath } from '../routing/roleRoutes.js'

/**
 * @param {{ children: import('react').ReactNode, allowedRoles?: string[] | null }} props
 */
function ProtectedRoute({ children, allowedRoles = null }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <p style={{ textAlign: 'center', marginTop: '4rem' }}>Chargement...</p>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleHomePath(user)} replace />
  }

  return children
}

export default ProtectedRoute

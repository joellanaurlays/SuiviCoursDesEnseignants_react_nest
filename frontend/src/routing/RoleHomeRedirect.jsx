import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getRoleHomePath } from './roleRoutes.js'

export default function RoleHomeRedirect() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <p style={{ textAlign: 'center', marginTop: '4rem' }}>Chargement...</p>
  }

  return <Navigate to={getRoleHomePath(user)} replace />
}

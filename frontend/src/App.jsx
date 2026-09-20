import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import DashboardPlaceholder from './pages/DashboardPlaceholder.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import UserFormPage from './pages/UserFormPage.jsx'
import UsersListPage from './pages/UsersListPage.jsx'
import './styles/index.css'

const MANAGE_USERS_ROLES = ['CHEF_SCOLARITE', 'ADMINISTRATEUR']

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPlaceholder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={MANAGE_USERS_ROLES}>
            <UsersListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/new"
        element={
          <ProtectedRoute allowedRoles={MANAGE_USERS_ROLES}>
            <UserFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/:id/edit"
        element={
          <ProtectedRoute allowedRoles={MANAGE_USERS_ROLES}>
            <UserFormPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
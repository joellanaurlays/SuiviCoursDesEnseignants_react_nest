import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PlanningWorkspace from './components/PlanningWorkspace';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPlaceholder from './pages/DashboardPlaceholder.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import UsersListPage from './pages/UsersListPage.jsx';
import UserFormPage from './pages/UserFormPage.jsx';

// Rôles autorisés à gérer les comptes (RoleName côté Prisma/JWT).
const MANAGE_USERS_ROLES = ['CHEF_SCOLARITE', 'ADMINISTRATEUR'];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <PlanningWorkspace />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPlaceholder />
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

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PlanningWorkspace from './components/PlanningWorkspace';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPlaceholder from './pages/DashboardPlaceholder.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import UsersListPage from './pages/UsersListPage.jsx';
import UserFormPage from './pages/UserFormPage.jsx';
import ExamsModule from './exams/ExamsModule.jsx';

// Pont identité JWT -> en-têtes x-user-* pour le module suivi (Membres 2/4).
import { AuthProvider as SuiviAuthProvider } from './auth/AuthContext';
import { RequireRole, RequireResponsable } from './auth/RequireRole';

// Espace enseignant (Membre 2).
import EnseignantDashboard from './pages/enseignant/dashboard/page';
import EnseignantEnseignementsPage from './pages/enseignant/enseignements/page';
import EnseignementDetailPage from './pages/enseignant/enseignements/[id]/page';
import EnseignantSeancesPage from './pages/enseignant/seances/page';
import DeclarerSeance from './pages/enseignant/seances/nouveau/page';
import EnseignantHeuresPage from './pages/enseignant/heures/page';
import { JournalAuditPage } from './pages/suivi/JournalAuditPage';
import EnseignantAlertesPage from './pages/alerte/AlertesListPage';

// Espaces scolarité / administrateur (Membre 4).
import ScolariteSuiviEnseignementsPage from './pages/scolarite/suivi-enseignements/page';
import ScolariteSuiviEnseignementsDetailPage from './pages/scolarite/suivi-enseignements/[id]/page';
import ScolariteSeancesPage from './pages/scolarite/seances/page';
import AdminSuiviEnseignementsPage from './pages/admin/suivi-enseignements/page';
import AdminSuiviEnseignementsDetailPage from './pages/admin/suivi-enseignements/[id]/page';
import AdminSeancesPage from './pages/admin/seances/page';

// Espaces responsables de parcours (Membre 4).
import ResponsableLicenceSuiviPage from './pages/responsable/licence/suivi-enseignements/page';
import ResponsableLicenceSuiviDetailPage from './pages/responsable/licence/suivi-enseignements/[id]/page';
import ResponsableLicenceSeancesPage from './pages/responsable/licence/seances/page';
import ResponsableMasterSuiviPage from './pages/responsable/master/suivi-enseignements/page';
import ResponsableMasterSuiviDetailPage from './pages/responsable/master/suivi-enseignements/[id]/page';
import ResponsableMasterSeancesPage from './pages/responsable/master/seances/page';

// Rôles autorisés à gérer les comptes (RoleName côté Prisma/JWT).
const MANAGE_USERS_ROLES = ['CHEF_SCOLARITE', 'ADMINISTRATEUR'];

export default function App() {
  return (
    <SuiviAuthProvider>
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
          path="/exams"
          element={
            <ProtectedRoute allowedRoles={['SCOLARITE']}>
              <ExamsModule />
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
          path="/exams"
          element={
            <ProtectedRoute>
              <ExamsModule />
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

        {/* ===== Espace enseignant ===== */}
        <Route
          path="/enseignant/dashboard"
          element={
            <ProtectedRoute>
              <RequireRole role="ENSEIGNANT">
                <EnseignantDashboard />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/enseignant/enseignements"
          element={
            <ProtectedRoute>
              <RequireRole role="ENSEIGNANT">
                <EnseignantEnseignementsPage />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/enseignant/enseignements/:id"
          element={
            <ProtectedRoute>
              <RequireRole role="ENSEIGNANT">
                <EnseignementDetailPage />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/enseignant/seances"
          element={
            <ProtectedRoute>
              <RequireRole role="ENSEIGNANT">
                <EnseignantSeancesPage />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/enseignant/seances/nouveau"
          element={
            <ProtectedRoute>
              <RequireRole role="ENSEIGNANT">
                <DeclarerSeance />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/enseignant/heures"
          element={
            <ProtectedRoute>
              <RequireRole role="ENSEIGNANT">
                <EnseignantHeuresPage />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/enseignant/journal"
          element={
            <ProtectedRoute>
              <RequireRole role="ENSEIGNANT">
                <JournalAuditPage title="Mon journal d'audit" />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/enseignant/alertes"
          element={
            <ProtectedRoute>
              <RequireRole role="ENSEIGNANT">
                <EnseignantAlertesPage title="Mes alertes" />
              </RequireRole>
            </ProtectedRoute>
          }
        />

        {/* ===== Espace scolarité ===== */}
        <Route
          path="/scolarite/suivi-enseignements"
          element={
            <ProtectedRoute>
              <RequireRole role="SCOLARITE">
                <ScolariteSuiviEnseignementsPage />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/scolarite/suivi-enseignements/:id"
          element={
            <ProtectedRoute>
              <RequireRole role="SCOLARITE">
                <ScolariteSuiviEnseignementsDetailPage />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/scolarite/seances"
          element={
            <ProtectedRoute>
              <RequireRole role="SCOLARITE">
                <ScolariteSeancesPage />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/scolarite/journal"
          element={
            <ProtectedRoute>
              <RequireRole role="SCOLARITE">
                <JournalAuditPage title="Journal d'audit — scolarité" />
              </RequireRole>
            </ProtectedRoute>
          }
        />

        {/* ===== Espace administrateur ===== */}
        <Route
          path="/admin/suivi-enseignements"
          element={
            <ProtectedRoute>
              <RequireRole role="ADMINISTRATEUR">
                <AdminSuiviEnseignementsPage />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/suivi-enseignements/:id"
          element={
            <ProtectedRoute>
              <RequireRole role="ADMINISTRATEUR">
                <AdminSuiviEnseignementsDetailPage />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/seances"
          element={
            <ProtectedRoute>
              <RequireRole role="ADMINISTRATEUR">
                <AdminSeancesPage />
              </RequireRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/journal"
          element={
            <ProtectedRoute>
              <RequireRole role="ADMINISTRATEUR">
                <JournalAuditPage title="Journal d'audit — administration" />
              </RequireRole>
            </ProtectedRoute>
          }
        />

        {/* ===== Espaces responsables de parcours ===== */}
        <Route
          path="/responsable/licence/suivi-enseignements"
          element={
            <ProtectedRoute>
              <RequireResponsable cycle="LICENCE">
                <ResponsableLicenceSuiviPage />
              </RequireResponsable>
            </ProtectedRoute>
          }
        />
        <Route
          path="/responsable/licence/suivi-enseignements/:id"
          element={
            <ProtectedRoute>
              <RequireResponsable cycle="LICENCE">
                <ResponsableLicenceSuiviDetailPage />
              </RequireResponsable>
            </ProtectedRoute>
          }
        />
        <Route
          path="/responsable/licence/seances"
          element={
            <ProtectedRoute>
              <RequireResponsable cycle="LICENCE">
                <ResponsableLicenceSeancesPage />
              </RequireResponsable>
            </ProtectedRoute>
          }
        />
        <Route
          path="/responsable/licence/journal"
          element={
            <ProtectedRoute>
              <RequireResponsable cycle="LICENCE">
                <JournalAuditPage title="Journal d'audit — Licence" />
              </RequireResponsable>
            </ProtectedRoute>
          }
        />
        <Route
          path="/responsable/master/suivi-enseignements"
          element={
            <ProtectedRoute>
              <RequireResponsable cycle="MASTER">
                <ResponsableMasterSuiviPage />
              </RequireResponsable>
            </ProtectedRoute>
          }
        />
        <Route
          path="/responsable/master/suivi-enseignements/:id"
          element={
            <ProtectedRoute>
              <RequireResponsable cycle="MASTER">
                <ResponsableMasterSuiviDetailPage />
              </RequireResponsable>
            </ProtectedRoute>
          }
        />
        <Route
          path="/responsable/master/seances"
          element={
            <ProtectedRoute>
              <RequireResponsable cycle="MASTER">
                <ResponsableMasterSeancesPage />
              </RequireResponsable>
            </ProtectedRoute>
          }
        />
        <Route
          path="/responsable/master/journal"
          element={
            <ProtectedRoute>
              <RequireResponsable cycle="MASTER">
                <JournalAuditPage title="Journal d'audit — Master" />
              </RequireResponsable>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </SuiviAuthProvider>
  );
}

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { DefaultRedirect, RequireRole, RequireResponsable } from './auth/RequireRole';

import EnseignantDashboard from './pages/enseignant/dashboard/page';
import EnseignantList from './pages/enseignant/enseignements/page';
import EnseignantDetail from './pages/enseignant/enseignements/[id]/page';
import EnseignantSeances from './pages/enseignant/seances/page';
import EnseignantDeclarerSeance from './pages/enseignant/seances/nouveau/page';
import EnseignantHeures from './pages/enseignant/heures/page';

import ScolariteList from './pages/scolarite/suivi-enseignements/page';
import ScolariteDetail from './pages/scolarite/suivi-enseignements/[id]/page';
import ScolariteSeances from './pages/scolarite/seances/page';

import ResponsableLicenceList from './pages/responsable/licence/suivi-enseignements/page';
import ResponsableLicenceDetail from './pages/responsable/licence/suivi-enseignements/[id]/page';
import ResponsableLicenceSeances from './pages/responsable/licence/seances/page';

import ResponsableMasterList from './pages/responsable/master/suivi-enseignements/page';
import ResponsableMasterDetail from './pages/responsable/master/suivi-enseignements/[id]/page';
import ResponsableMasterSeances from './pages/responsable/master/seances/page';

import AdminList from './pages/admin/suivi-enseignements/page';
import AdminDetail from './pages/admin/suivi-enseignements/[id]/page';
import AdminSeances from './pages/admin/seances/page';

import { JournalAuditPage } from './pages/suivi/JournalAuditPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<DefaultRedirect />} />

          {/* Enseignant */}
          <Route
            path="/enseignant"
            element={
              <RequireRole role="ENSEIGNANT">
                <DefaultRedirect />
              </RequireRole>
            }
          />
          <Route
            path="/enseignant/dashboard"
            element={
              <RequireRole role="ENSEIGNANT">
                <EnseignantDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/enseignant/enseignements"
            element={
              <RequireRole role="ENSEIGNANT">
                <EnseignantList />
              </RequireRole>
            }
          />
          <Route
            path="/enseignant/enseignements/:id"
            element={
              <RequireRole role="ENSEIGNANT">
                <EnseignantDetail />
              </RequireRole>
            }
          />
          <Route
            path="/enseignant/seances"
            element={
              <RequireRole role="ENSEIGNANT">
                <EnseignantSeances />
              </RequireRole>
            }
          />
          <Route
            path="/enseignant/seances/nouveau"
            element={
              <RequireRole role="ENSEIGNANT">
                <EnseignantDeclarerSeance />
              </RequireRole>
            }
          />
          <Route
            path="/enseignant/heures"
            element={
              <RequireRole role="ENSEIGNANT">
                <EnseignantHeures />
              </RequireRole>
            }
          />
          <Route
            path="/enseignant/journal"
            element={
              <RequireRole role="ENSEIGNANT">
                <JournalAuditPage
                  title="Journal d'audit"
                  intro="Historique des actions réalisées sur vos séances."
                />
              </RequireRole>
            }
          />

          {/* Scolarité */}
          <Route
            path="/scolarite"
            element={
              <RequireRole role="SCOLARITE">
                <DefaultRedirect />
              </RequireRole>
            }
          />
          <Route
            path="/scolarite/suivi-enseignements"
            element={
              <RequireRole role="SCOLARITE">
                <ScolariteList />
              </RequireRole>
            }
          />
          <Route
            path="/scolarite/suivi-enseignements/:id"
            element={
              <RequireRole role="SCOLARITE">
                <ScolariteDetail />
              </RequireRole>
            }
          />
          <Route
            path="/scolarite/seances"
            element={
              <RequireRole role="SCOLARITE">
                <ScolariteSeances />
              </RequireRole>
            }
          />
          <Route
            path="/scolarite/journal"
            element={
              <RequireRole role="SCOLARITE">
                <JournalAuditPage intro="Historique global des actions réalisées sur les séances." />
              </RequireRole>
            }
          />

          {/* Responsable de mention — Licence */}
          <Route
            path="/responsable/licence"
            element={
              <RequireResponsable cycle="LICENCE">
                <DefaultRedirect />
              </RequireResponsable>
            }
          />
          <Route
            path="/responsable/licence/suivi-enseignements"
            element={
              <RequireResponsable cycle="LICENCE">
                <ResponsableLicenceList />
              </RequireResponsable>
            }
          />
          <Route
            path="/responsable/licence/suivi-enseignements/:id"
            element={
              <RequireResponsable cycle="LICENCE">
                <ResponsableLicenceDetail />
              </RequireResponsable>
            }
          />
          <Route
            path="/responsable/licence/seances"
            element={
              <RequireResponsable cycle="LICENCE">
                <ResponsableLicenceSeances />
              </RequireResponsable>
            }
          />
          <Route
            path="/responsable/licence/journal"
            element={
              <RequireResponsable cycle="LICENCE">
                <JournalAuditPage intro="Historique des actions sur les séances de votre périmètre (Licence)." />
              </RequireResponsable>
            }
          />

          {/* Responsable de mention — Master */}
          <Route
            path="/responsable/master"
            element={
              <RequireResponsable cycle="MASTER">
                <DefaultRedirect />
              </RequireResponsable>
            }
          />
          <Route
            path="/responsable/master/suivi-enseignements"
            element={
              <RequireResponsable cycle="MASTER">
                <ResponsableMasterList />
              </RequireResponsable>
            }
          />
          <Route
            path="/responsable/master/suivi-enseignements/:id"
            element={
              <RequireResponsable cycle="MASTER">
                <ResponsableMasterDetail />
              </RequireResponsable>
            }
          />
          <Route
            path="/responsable/master/seances"
            element={
              <RequireResponsable cycle="MASTER">
                <ResponsableMasterSeances />
              </RequireResponsable>
            }
          />
          <Route
            path="/responsable/master/journal"
            element={
              <RequireResponsable cycle="MASTER">
                <JournalAuditPage intro="Historique des actions sur les séances de votre périmètre (Master)." />
              </RequireResponsable>
            }
          />

          {/* Administrateur */}
          <Route
            path="/admin"
            element={
              <RequireRole role="ADMINISTRATEUR">
                <DefaultRedirect />
              </RequireRole>
            }
          />
          <Route
            path="/admin/suivi-enseignements"
            element={
              <RequireRole role="ADMINISTRATEUR">
                <AdminList />
              </RequireRole>
            }
          />
          <Route
            path="/admin/suivi-enseignements/:id"
            element={
              <RequireRole role="ADMINISTRATEUR">
                <AdminDetail />
              </RequireRole>
            }
          />
          <Route
            path="/admin/seances"
            element={
              <RequireRole role="ADMINISTRATEUR">
                <AdminSeances />
              </RequireRole>
            }
          />
          <Route
            path="/admin/journal"
            element={
              <RequireRole role="ADMINISTRATEUR">
                <JournalAuditPage intro="Historique global des actions réalisées sur les séances." />
              </RequireRole>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<DefaultRedirect />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
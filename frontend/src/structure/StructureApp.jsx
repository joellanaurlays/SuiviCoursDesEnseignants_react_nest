import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import StructurePage from './pages/StructurePage';
import CrudPage from './pages/CrudPage';
import { ToastProvider } from './components/Toast';
import { BASE } from './config/paths.js';
import './structure.css';

/**
 * Module 3 : structure académique (Membre 3). Monté sous /structure-academique/* dans App.tsx.
 * Tout le CSS est limité à la classe .sa-root pour ne pas affecter les autres modules.
 */
export default function StructureApp() {
  return (
    <div className="sa-root">
      <ToastProvider>
        <Layout>
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="arborescence" element={<StructurePage />} />
            <Route path=":entityKey" element={<CrudPage />} />
            <Route path="*" element={<Navigate to={BASE} replace />} />
          </Routes>
        </Layout>
      </ToastProvider>
    </div>
  );
}

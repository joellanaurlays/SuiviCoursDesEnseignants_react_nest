import { Navigate } from 'react-router-dom';

export default function NouveauEnseignementMaster() {
  return <Navigate to="/responsable/master/suivi-enseignements?creer=1" replace />;
}

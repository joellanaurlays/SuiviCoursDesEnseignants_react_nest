import { Navigate } from 'react-router-dom';

export default function NouveauEnseignementLicence() {
  return <Navigate to="/responsable/licence/suivi-enseignements?creer=1" replace />;
}

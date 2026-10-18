import { SuiviListPage } from '../../../suivi/SuiviListPage';
import { useAuth } from '../../../../auth/AuthContext';

export default function ResponsableLicenceSuiviPage() {
  const { session } = useAuth();
  return (
    <SuiviListPage
      title={`Suivi des enseignements — Licence ${session.parcours ?? ''}`.trim()}
      intro={`Périmètre verrouillé : parcours Licence ${session.parcours ?? '—'} uniquement.`}
      detailBasePath="/responsable/licence/suivi-enseignements"
      hideMention
      hideParcours
      fixedCycle="LICENCE"
    />
  );
}
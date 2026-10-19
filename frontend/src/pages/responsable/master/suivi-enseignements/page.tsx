import { SuiviListPage } from '../../../suivi/SuiviListPage';
import { useAuth } from '../../../../auth/AuthContext';

export default function ResponsableMasterSuiviPage() {
  const { session } = useAuth();
  return (
    <SuiviListPage
      title={`Suivi des enseignements — Master ${session.parcours ?? ''}`.trim()}
      intro={`Périmètre verrouillé : parcours Master ${session.parcours ?? '—'} uniquement.`}
      detailBasePath="/responsable/master/suivi-enseignements"
      hideMention
      hideParcours
      fixedCycle="MASTER"
    />
  );
}
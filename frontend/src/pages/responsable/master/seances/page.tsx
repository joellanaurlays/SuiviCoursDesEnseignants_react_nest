import { SeancesListPage } from '../../../suivi/SeancesListPage';
import { useAuth } from '../../../../auth/AuthContext';

export default function ResponsableMasterSeancesPage() {
  const { session } = useAuth();
  return (
    <SeancesListPage
      title="Séances & contenus — Master"
      intro={`Périmètre verrouillé : parcours Master ${session.parcours ?? '—'} uniquement.`}
    />
  );
}
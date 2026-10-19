import { SeancesListPage } from '../../../suivi/SeancesListPage';
import { useAuth } from '../../../../auth/AuthContext';

export default function ResponsableLicenceSeancesPage() {
  const { session } = useAuth();
  return (
    <SeancesListPage
      title="Séances & contenus — Licence"
      intro={`Périmètre verrouillé : parcours Licence ${session.parcours ?? '—'} uniquement.`}
    />
  );
}
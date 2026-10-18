import { SuiviListPage } from '../../suivi/SuiviListPage';

export default function AdminSuiviEnseignementsPage() {
  return (
    <SuiviListPage
      title="Suivi des Enseignements — Administration"
      intro="Consultation globale selon vos droits administrateur."
      detailBasePath="/admin/suivi-enseignements"
    />
  );
}
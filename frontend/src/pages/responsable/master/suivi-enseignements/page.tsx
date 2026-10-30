import { SuiviListPage } from "../../../suivi/SuiviListPage";
import { useAuth } from "../../../../auth/AuthContext";

export default function ResponsableMasterSuiviPage() {
  const { session } = useAuth();

  // Un responsable de mention ne crée PAS d'enseignement : il affecte
  // uniquement des enseignants à des enseignements existants de son parcours.
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
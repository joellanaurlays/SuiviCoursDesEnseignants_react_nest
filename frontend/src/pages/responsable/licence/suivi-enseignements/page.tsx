import { useState } from 'react';
import { SuiviListPage } from "../../../suivi/SuiviListPage";
import { useAuth } from "../../../../auth/AuthContext";

export default function ResponsableLicenceSuiviPage() {
  const { session } = useAuth();

  // Un responsable de mention ne crée PAS d'enseignement : il affecte
  // uniquement des enseignants à des enseignements existants de son parcours.
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
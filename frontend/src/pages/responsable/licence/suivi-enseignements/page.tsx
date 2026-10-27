import { useState } from 'react';
import { SuiviListPage } from "../../../suivi/SuiviListPage";
import { CreerEnseignementModal } from "../../../../components/enseignements/CreerEnseignementModal";
import { useAuth } from "../../../../auth/AuthContext";

interface CreerEnseignementModalProps {
  open: boolean;
  onCancel: () => void;
  onCreated: (enseignement: any) => void;
}

export default function ResponsableLicenceSuiviPage() {
  const { session } = useAuth();

  const [open, setOpen] = useState(false);

  const handleOpenCreated = (enseignement: any) => {
    console.log('Enseignement créé:', enseignement);
    setOpen(false);
  };
  return (
    <SuiviListPage
      title={`Suivi des enseignements — Licence ${session.parcours ?? ''}`.trim()}
      intro={`Périmètre verrouillé : parcours Licence ${session.parcours ?? '—'} uniquement.`}
      detailBasePath="/responsable/licence/suivi-enseignements"
      hideMention
      hideParcours
      fixedCycle="LICENCE"
    >
      {/* Bouton de création d'enseignement pour le responsable de mention */}
      {session.role === 'RESPONSABLE_MENTION' && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setOpen(true)}
            className="emit-btn-primary mb-3"
          >
            Créer un enseignement
          </button>
        </div>
      )}

      {/* Modal de création d'enseignement */}
      <CreerEnseignementModal
        open={open}
        onCancel={() => setOpen(false)}
        onCreated={handleOpenCreated}
        headers={{
          'x-user-id': session.userId,
          'x-user-role': session.role,
          'x-user-parcours': session.parcours || '',
        }}
      />
    </SuiviListPage>
  );
}
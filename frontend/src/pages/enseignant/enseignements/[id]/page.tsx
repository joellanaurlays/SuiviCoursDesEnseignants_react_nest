import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Layout } from '../../../../components/Layout';
import { LoadingState } from '../../../../components/ui/LoadingState';
import { ErrorState } from '../../../../components/ui/ErrorState';
import { SuiviDetailView } from '../../../../components/enseignements/SuiviDetailView';
import { ClotureModal } from '../../../../components/enseignements/ClotureModal';
import { useAuth } from '../../../../auth/AuthContext';
import { suiviService } from '../../../../services/suivi.service';
import { enseignementService } from '../../../../services/enseignement.service';
import { clotureService } from '../../../../services/cloture.service';
import { Seance, SuiviEnseignement } from '../../../../types/enseignement';

export default function EnseignementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { headers } = useAuth();
  const [enseignement, setEnseignement] = useState<SuiviEnseignement | null>(null);
  const [seances, setSeances] = useState<Seance[]>([]);
  const [peutCloturer, setPeutCloturer] = useState(false);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let annule = false;
    setChargement(true);
    setErreur(null);

    Promise.all([
      suiviService.getById(id, headers),
      enseignementService.getSeances(id, headers),
      clotureService.getById(id, headers),
    ])
      .then(([ens, seancesData, cloture]) => {
        if (annule) return;
        setEnseignement(ens);
        setSeances(seancesData);
        setPeutCloturer(cloture.peutCloturer);
      })
      .catch((e: { message?: string; status?: number }) => {
        if (annule) return;
        setErreur(
          e.status === 403
            ? "Vous n'êtes pas autorisé à consulter cet enseignement."
            : e.message ?? 'Impossible de charger les détails.',
        );
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });

    return () => {
      annule = true;
    };
  }, [id, headers]);

  const cloturer = useCallback(
    async (motif: string) => {
      if (!id) return;
      const { suivi } = await clotureService.cloturer(id, motif, headers);
      setEnseignement(suivi);
      setPeutCloturer(false);
      setModalOuverte(false);
    },
    [id, headers],
  );

  return (
    <Layout>
      {chargement ? (
        <LoadingState label="Chargement des détails..." />
      ) : erreur || !enseignement ? (
        <ErrorState message={erreur ?? 'Enseignement introuvable.'} />
      ) : (
        <SuiviDetailView
          enseignement={enseignement}
          seances={seances}
          backLabel="Retour à mes enseignements"
          backLink="/enseignant/enseignements"
          actionCloture={
            peutCloturer ? (
              <button
                onClick={() => setModalOuverte(true)}
                className="emit-btn-primary w-full"
              >
                <CheckCircle2 size={16} aria-hidden="true" />
                Clôturer l&apos;enseignement
              </button>
            ) : undefined
          }
        />
      )}

      {enseignement && (
        <ClotureModal
          open={modalOuverte}
          matiere={enseignement.matiere}
          volumePrevu={enseignement.volumePrevu}
          heuresRealisees={enseignement.heuresRealisees}
          progression={enseignement.progression}
          onCancel={() => setModalOuverte(false)}
          onConfirm={cloturer}
        />
      )}
    </Layout>
  );
}

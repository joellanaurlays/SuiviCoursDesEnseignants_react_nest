import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { SuiviDetailView } from '../../components/enseignements/SuiviDetailView';
import { useAuth } from '../../auth/AuthContext';
import { suiviService } from '../../services/suivi.service';
import { enseignementService } from '../../services/enseignement.service';
import { Seance, SuiviEnseignement } from '../../types/enseignement';

interface SuiviDetailPageProps {
  backLink: string;
  backLabel: string;
}

export function SuiviDetailPage({ backLink, backLabel }: SuiviDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const { headers } = useAuth();
  const [enseignement, setEnseignement] = useState<SuiviEnseignement | null>(null);
  const [seances, setSeances] = useState<Seance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      suiviService.getById(id, headers),
      enseignementService.getSeances(id, headers),
    ])
      .then(([ens, seancesData]) => {
        if (!cancelled) {
          setEnseignement(ens);
          setSeances(seancesData);
        }
      })
      .catch((e: { message?: string; status?: number }) => {
        if (!cancelled) {
          setError(e.status === 403 ? "Vous n'êtes pas autorisé à consulter cet enseignement." : e.message ?? 'Impossible de charger les détails.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, headers]);

  return (
    <Layout>
      {loading ? (
        <LoadingState label="Chargement des détails..." />
      ) : error || !enseignement ? (
        <ErrorState message={error ?? "Enseignement introuvable."} />
      ) : (
        <SuiviDetailView
          enseignement={enseignement}
          seances={seances}
          backLabel={backLabel}
          backLink={backLink}
        />
      )}
    </Layout>
  );
}
import { FormEvent, useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { enseignementService } from '../../services/enseignement.service';
import { SuiviEnseignement } from '../../types/enseignement';

interface AffecterEnseignantModalProps {
  enseignement: SuiviEnseignement | null;
  headers: Record<string, string>;
  onCancel: () => void;
  onAffected: (enseignement: SuiviEnseignement) => void;
}

const SELECT_CLASS = 'emit-input appearance-none bg-white';

function messageErreur(erreur: unknown): string {
  return (
    (erreur as { message?: string }).message ??
    "L'affectation n'a pas pu être enregistrée. Vérifiez votre périmètre puis réessayez."
  );
}

/**
 * Modal « Affecter un enseignant » : action réservée au RESPONSABLE_MENTION
 * sur un enseignement existant de son périmètre. La liste des enseignants
 * proposés provient du référentiel ; le backend revalide systématiquement
 * l'appartenance de l'enseignant au parcours/cycle de l'enseignement.
 */
export function AffecterEnseignantModal({
  enseignement,
  headers,
  onCancel,
  onAffected,
}: AffecterEnseignantModalProps) {
  const [enseignants, setEnseignants] = useState<string[]>([]);
  const [enseignantChoisi, setEnseignantChoisi] = useState('');
  const [chargement, setChargement] = useState(false);
  const [erreurChargement, setErreurChargement] = useState<string | null>(null);
  const [erreurServeur, setErreurServeur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    if (!enseignement) {
      return;
    }
    let annule = false;
    setChargement(true);
    setErreurChargement(null);
    setErreurServeur(null);
    setEnseignantChoisi('');

    enseignementService
      .getReferentielCreation(headers)
      .then((referentiel) => {
        if (!annule) setEnseignants(referentiel.enseignants ?? []);
      })
      .catch((erreur) => {
        if (!annule) setErreurChargement(messageErreur(erreur));
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });

    return () => {
      annule = true;
    };
  }, [enseignement, headers]);

  if (!enseignement) {
    return null;
  }

  const soumettre = async (event: FormEvent) => {
    event.preventDefault();
    if (!enseignantChoisi || envoi) {
      return;
    }
    setEnvoi(true);
    setErreurServeur(null);
    try {
      await enseignementService.assignTeacher(enseignement.id, enseignantChoisi, headers);
      onAffected(enseignement);
    } catch (erreur) {
      setErreurServeur(messageErreur(erreur));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#03045E]/50 backdrop-blur-sm"
        onClick={envoi ? undefined : onCancel}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="affectation-enseignant-titre"
        className="relative w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 id="affectation-enseignant-titre" className="text-xl font-bold text-[#03045E]">
              Affecter un enseignant
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {enseignement.matiere} — {enseignement.niveau} {enseignement.semestre} (
              {enseignement.cycle === 'LICENCE' ? 'Licence' : 'Master'} {enseignement.parcours})
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={envoi}
            aria-label="Fermer"
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {chargement ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            Chargement des enseignants...
          </div>
        ) : erreurChargement ? (
          <div className="space-y-4 px-6 py-6">
            <div
              className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              role="alert"
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>{erreurChargement}</p>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={onCancel} className="emit-btn-ghost">
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={soumettre}>
            <div className="space-y-4 px-6 py-5">
              <div>
                <label htmlFor="affectation-enseignant" className="emit-label">
                  Enseignant <span className="text-rose-600">*</span>
                </label>
                <select
                  id="affectation-enseignant"
                  value={enseignantChoisi}
                  onChange={(event) => {
                    setEnseignantChoisi(event.target.value);
                    setErreurServeur(null);
                  }}
                  disabled={envoi}
                  className={SELECT_CLASS}
                >
                  <option value="">Sélectionner un enseignant</option>
                  {enseignants.map((enseignant) => (
                    <option key={enseignant} value={enseignant}>
                      {enseignant}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Un enseignant d'une autre mention peut être affecté ici : sa mention de
                  rattachement administrative reste inchangée. Le contrôle de cycle est
                  revalidé par le serveur.
                </p>
              </div>

              {erreurServeur && (
                <div
                  className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                  role="alert"
                >
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <p>{erreurServeur}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button type="button" onClick={onCancel} disabled={envoi} className="emit-btn-ghost">
                Annuler
              </button>
              <button
                type="submit"
                disabled={envoi || !enseignantChoisi}
                className="emit-btn-primary"
              >
                {envoi ? 'Affectation en cours...' : "Affecter l'enseignant"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

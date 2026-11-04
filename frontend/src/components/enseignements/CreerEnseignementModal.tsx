import { FormEvent, useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { enseignementService } from '../../services/enseignement.service';
import {
  Cycle,
  ReferentielCreationEnseignement,
  SuiviEnseignement,
} from '../../types/enseignement';
import {
  changerCycle,
  changerNiveau,
  construirePayloadCreation,
  ErreursCreationEnseignement,
  estFormulaireValide,
  FormulaireCreationEnseignement,
  formulaireInitial,
  niveauxPourCycle,
  semestresPourNiveau,
  validerFormulaireCreation,
} from '../../utils/enseignement-creation';

interface CreerEnseignementModalProps {
  open: boolean;
  headers: Record<string, string>;
  onCancel: () => void;
  onCreated: (enseignement: SuiviEnseignement) => void;
}

const INPUT_CLASS = 'emit-input';
const SELECT_CLASS = 'emit-input appearance-none bg-white';
const LABEL_CLASS = 'emit-label';

function messageErreur(erreur: unknown): string {
  return (
    (erreur as { message?: string }).message ??
    "L'enseignement n'a pas pu être créé. Vérifiez les informations saisies."
  );
}

export function CreerEnseignementModal({
  open,
  headers,
  onCancel,
  onCreated,
}: CreerEnseignementModalProps) {
  const [referentiel, setReferentiel] = useState<ReferentielCreationEnseignement | null>(null);
  const [formulaire, setFormulaire] = useState<FormulaireCreationEnseignement | null>(null);
  const [erreurs, setErreurs] = useState<ErreursCreationEnseignement>({});
  const [chargement, setChargement] = useState(false);
  const [erreurChargement, setErreurChargement] = useState<string | null>(null);
  const [erreurServeur, setErreurServeur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [cleRechargement, setCleRechargement] = useState(0);

  useEffect(() => {
    if (!open) {
      return;
    }
    let annule = false;
    setChargement(true);
    setErreurChargement(null);
    setErreurServeur(null);
    setErreurs({});
    setReferentiel(null);
    setFormulaire(null);

    enseignementService
      .getReferentielCreation(headers)
      .then((donnees) => {
        if (annule) return;
        setReferentiel(donnees);
        setFormulaire(formulaireInitial(donnees));
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
  }, [open, headers, cleRechargement]);

  if (!open) {
    return null;
  }

  const changerChamp = <K extends keyof FormulaireCreationEnseignement>(
    champ: K,
    valeur: FormulaireCreationEnseignement[K],
  ) => {
    setFormulaire((actuel) => (actuel ? { ...actuel, [champ]: valeur } : actuel));
    setErreurs((actuelles) => {
      if (!actuelles[champ]) return actuelles;
      const suivantes = { ...actuelles };
      delete suivantes[champ];
      return suivantes;
    });
    setErreurServeur(null);
  };

  const changerCycleChamp = (valeur: string) => {
    if (!referentiel || !formulaire || !valeur) return;
    setFormulaire(changerCycle(formulaire, valeur as Cycle, referentiel));
    setErreurs({});
    setErreurServeur(null);
  };

  const changerNiveauChamp = (valeur: string) => {
    if (!referentiel || !formulaire) return;
    setFormulaire(changerNiveau(formulaire, valeur, referentiel));
    setErreurs({});
    setErreurServeur(null);
  };

  const soumettre = async (event: FormEvent) => {
    event.preventDefault();
    if (!referentiel || !formulaire || envoi) {
      return;
    }
    const erreursFormulaire = validerFormulaireCreation(formulaire, referentiel);
    setErreurs(erreursFormulaire);
    if (!estFormulaireValide(erreursFormulaire)) {
      return;
    }

    setEnvoi(true);
    setErreurServeur(null);
    try {
      const cree = await enseignementService.create(
        construirePayloadCreation(formulaire),
        headers,
      );
      onCreated(cree);
    } catch (erreur) {
      setErreurServeur(messageErreur(erreur));
    } finally {
      setEnvoi(false);
    }
  };

  const erreur = (champ: keyof FormulaireCreationEnseignement) =>
    erreurs[champ] ? <p className="mt-1 text-xs font-medium text-rose-600">{erreurs[champ]}</p> : null;

  const niveaux = referentiel && formulaire
    ? niveauxPourCycle(referentiel, formulaire.cycle)
    : [];
  const semestres = referentiel && formulaire
    ? semestresPourNiveau(referentiel, formulaire.niveauId)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#03045E]/50 backdrop-blur-sm"
        onClick={envoi ? undefined : onCancel}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="creation-enseignement-titre"
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 id="creation-enseignement-titre" className="text-xl font-bold text-[#03045E]">
              Créer un enseignement
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              L&apos;enseignement sera créé sans enseignant affecté : l&apos;affectation se fait ensuite
              depuis le suivi, par le responsable de parcours (« Affecter un enseignant »).
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

        {chargement && (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            Chargement du référentiel...
          </div>
        )}

        {!chargement && erreurChargement && (
          <div className="space-y-4 px-6 py-6">
            <div
              className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              role="alert"
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>{erreurChargement}</p>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onCancel} className="emit-btn-ghost">
                Annuler
              </button>
              <button
                type="button"
                onClick={() => setCleRechargement((cle) => cle + 1)}
                className="emit-btn-primary"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {!chargement && !erreurChargement && referentiel && formulaire && (
          <form onSubmit={soumettre}>
            <div className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-2">
              <div>
                <label htmlFor="creation-matiere" className={LABEL_CLASS}>
                  Matière <span className="text-rose-600">*</span>
                </label>
                <select
                  id="creation-matiere"
                  value={formulaire.matiereId}
                  onChange={(event) => changerChamp('matiereId', event.target.value)}
                  disabled={envoi}
                  className={SELECT_CLASS}
                >
                  <option value="">Sélectionner une matière</option>
                  {referentiel.matieres.map((matiere) => (
                    <option key={matiere} value={matiere}>
                      {matiere}
                    </option>
                  ))}
                </select>
                {erreur('matiereId')}
              </div>

              <div>
                <label htmlFor="creation-mention" className={LABEL_CLASS}>
                  Mention <span className="text-rose-600">*</span>
                </label>
                <select
                  id="creation-mention"
                  value={formulaire.mentionId}
                  onChange={(event) => changerChamp('mentionId', event.target.value)}
                  disabled={envoi || Boolean(referentiel.verrous.mention)}
                  className={SELECT_CLASS}
                >
                  <option value="">Sélectionner une mention</option>
                  {referentiel.mentions.map((mention) => (
                    <option key={mention} value={mention}>
                      {mention}
                    </option>
                  ))}
                </select>
                {referentiel.verrous.mention && (
                  <p className="mt-1 text-xs text-slate-500">Verrouillé par votre périmètre.</p>
                )}
                {erreur('mentionId')}
              </div>

              <div>
                <label htmlFor="creation-parcours" className={LABEL_CLASS}>
                  Parcours <span className="text-rose-600">*</span>
                </label>
                <select
                  id="creation-parcours"
                  value={formulaire.parcours}
                  onChange={(event) => changerChamp('parcours', event.target.value)}
                  disabled={envoi || Boolean(referentiel.verrous.parcours)}
                  className={SELECT_CLASS}
                >
                  <option value="">Sélectionner un parcours</option>
                  {referentiel.parcours.map((parcours) => (
                    <option key={parcours} value={parcours}>
                      {parcours}
                    </option>
                  ))}
                </select>
                {referentiel.verrous.parcours && (
                  <p className="mt-1 text-xs text-slate-500">Verrouillé par votre périmètre.</p>
                )}
                {erreur('parcours')}
              </div>

              <div>
                <label htmlFor="creation-cycle" className={LABEL_CLASS}>
                  Cycle <span className="text-rose-600">*</span>
                </label>
                <select
                  id="creation-cycle"
                  value={formulaire.cycle}
                  onChange={(event) => changerCycleChamp(event.target.value)}
                  disabled={envoi || Boolean(referentiel.verrous.cycle)}
                  className={SELECT_CLASS}
                >
                  <option value="">Sélectionner un cycle</option>
                  {referentiel.cycles.map((cycle) => (
                    <option key={cycle} value={cycle}>
                      {cycle === 'LICENCE' ? 'Licence' : 'Master'}
                    </option>
                  ))}
                </select>
                {referentiel.verrous.cycle && (
                  <p className="mt-1 text-xs text-slate-500">Verrouillé par votre périmètre.</p>
                )}
                {erreur('cycle')}
              </div>

              <div>
                <label htmlFor="creation-niveau" className={LABEL_CLASS}>
                  Niveau <span className="text-rose-600">*</span>
                </label>
                <select
                  id="creation-niveau"
                  value={formulaire.niveauId}
                  onChange={(event) => changerNiveauChamp(event.target.value)}
                  disabled={envoi || !formulaire.cycle}
                  className={SELECT_CLASS}
                >
                  <option value="">Sélectionner un niveau</option>
                  {niveaux.map((niveau) => (
                    <option key={niveau.value} value={niveau.value}>
                      {niveau.value}
                    </option>
                  ))}
                </select>
                {erreur('niveauId')}
              </div>

              <div>
                <label htmlFor="creation-semestre" className={LABEL_CLASS}>
                  Semestre <span className="text-rose-600">*</span>
                </label>
                <select
                  id="creation-semestre"
                  value={formulaire.semestreId}
                  onChange={(event) => changerChamp('semestreId', event.target.value)}
                  disabled={envoi || !formulaire.niveauId}
                  className={SELECT_CLASS}
                >
                  <option value="">Sélectionner un semestre</option>
                  {semestres.map((semestre) => (
                    <option key={semestre.value} value={semestre.value}>
                      {semestre.value}
                    </option>
                  ))}
                </select>
                {erreur('semestreId')}
              </div>

              <div>
                <label htmlFor="creation-annee" className={LABEL_CLASS}>
                  Année universitaire <span className="text-rose-600">*</span>
                </label>
                <select
                  id="creation-annee"
                  value={formulaire.anneeUniversitaireId}
                  onChange={(event) => changerChamp('anneeUniversitaireId', event.target.value)}
                  disabled={envoi}
                  className={SELECT_CLASS}
                >
                  <option value="">Sélectionner une année</option>
                  {referentiel.anneesUniversitaires.map((annee) => (
                    <option key={annee} value={annee}>
                      {annee}
                    </option>
                  ))}
                </select>
                {erreur('anneeUniversitaireId')}
              </div>

              <div>
                <label htmlFor="creation-volume" className={LABEL_CLASS}>
                  Volume prévu (heures) <span className="text-rose-600">*</span>
                </label>
                <input
                  id="creation-volume"
                  type="number"
                  min={1}
                  max={1000}
                  step={1}
                  value={formulaire.volumePrevu}
                  onChange={(event) => changerChamp('volumePrevu', event.target.value)}
                  disabled={envoi}
                  placeholder="30"
                  className={INPUT_CLASS}
                />
                {erreur('volumePrevu')}
              </div>
            </div>

            {erreurServeur && (
              <div
                className="mx-6 mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                role="alert"
              >
                <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                <p>{erreurServeur}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button type="button" onClick={onCancel} disabled={envoi} className="emit-btn-ghost">
                Annuler
              </button>
              <button type="submit" disabled={envoi} className="emit-btn-primary">
                {envoi ? 'Création en cours...' : "Créer l'enseignement"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

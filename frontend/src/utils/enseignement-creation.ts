import {
  CreateEnseignementPayload,
  Cycle,
  ErreursCreationEnseignement,
  FormulaireCreationEnseignement,
  NiveauOption,
  ReferentielCreationEnseignement,
  SemestreOption,
  UserSession,
} from '../types/enseignement';

export type {
  ErreursCreationEnseignement,
  FormulaireCreationEnseignement,
} from '../types/enseignement';

export function peutCreerEnseignement(session: UserSession): boolean {
  // Seuls ADMIN et CHEF_SCOLARITE créent un enseignement. Le responsable de
  // mention affecte uniquement des enseignants à des enseignements existants.
  return session.role === 'SCOLARITE' || session.role === 'ADMINISTRATEUR';
}

export function formulaireInitial(
  referentiel: ReferentielCreationEnseignement,
): FormulaireCreationEnseignement {
  return {
    matiereId: '',
    mentionId: referentiel.verrous.mention ?? '',
    cycle: referentiel.verrous.cycle ?? '',
    niveauId: '',
    parcours: referentiel.verrous.parcours ?? '',
    semestreId: '',
    anneeUniversitaireId: referentiel.anneesUniversitaires[0] ?? '',
    volumePrevu: '',
  };
}

export function niveauxPourCycle(
  referentiel: ReferentielCreationEnseignement,
  cycle: Cycle | '',
): NiveauOption[] {
  if (!cycle) {
    return [];
  }
  return referentiel.niveaux.filter((niveau) => niveau.cycle === cycle);
}

export function semestresPourNiveau(
  referentiel: ReferentielCreationEnseignement,
  niveauId: string,
): SemestreOption[] {
  if (!niveauId) {
    return [];
  }
  return referentiel.semestres.filter((semestre) => semestre.niveau === niveauId);
}

export function changerCycle(
  formulaire: FormulaireCreationEnseignement,
  cycle: Cycle,
  referentiel: ReferentielCreationEnseignement,
): FormulaireCreationEnseignement {
  const niveauId = niveauxPourCycle(referentiel, cycle).some(
    (niveau) => niveau.value === formulaire.niveauId,
  )
    ? formulaire.niveauId
    : '';
  const semestreId = semestresPourNiveau(referentiel, niveauId).some(
    (semestre) => semestre.value === formulaire.semestreId,
  )
    ? formulaire.semestreId
    : '';
  return { ...formulaire, cycle, niveauId, semestreId };
}

export function changerNiveau(
  formulaire: FormulaireCreationEnseignement,
  niveauId: string,
  referentiel: ReferentielCreationEnseignement,
): FormulaireCreationEnseignement {
  const semestreId = semestresPourNiveau(referentiel, niveauId).some(
    (semestre) => semestre.value === formulaire.semestreId,
  )
    ? formulaire.semestreId
    : '';
  return { ...formulaire, niveauId, semestreId };
}

export function validerFormulaireCreation(
  formulaire: FormulaireCreationEnseignement,
  referentiel: ReferentielCreationEnseignement,
): ErreursCreationEnseignement {
  const erreurs: ErreursCreationEnseignement = {};

  if (!formulaire.matiereId) {
    erreurs.matiereId = 'Sélectionnez une matière.';
  }
  if (!formulaire.mentionId) {
    erreurs.mentionId = 'Sélectionnez une mention.';
  } else if (!referentiel.mentions.includes(formulaire.mentionId)) {
    erreurs.mentionId = "Cette mention n'est pas autorisée.";
  }
  if (!formulaire.parcours) {
    erreurs.parcours = 'Sélectionnez un parcours.';
  } else if (!referentiel.parcours.includes(formulaire.parcours)) {
    erreurs.parcours = "Ce parcours n'est pas autorisé.";
  }
  if (!formulaire.cycle) {
    erreurs.cycle = 'Sélectionnez un cycle.';
  } else if (!referentiel.cycles.includes(formulaire.cycle)) {
    erreurs.cycle = "Ce cycle n'est pas autorisé.";
  } else if (!niveauxPourCycle(referentiel, formulaire.cycle).length) {
    erreurs.cycle = "Aucun niveau n'est disponible pour ce cycle.";
  }
  if (!formulaire.niveauId) {
    erreurs.niveauId = 'Sélectionnez un niveau.';
  } else if (
    !niveauxPourCycle(referentiel, formulaire.cycle).some(
      (niveau) => niveau.value === formulaire.niveauId,
    )
  ) {
    erreurs.niveauId = "Ce niveau n'est pas compatible avec le cycle.";
  }
  if (!formulaire.semestreId) {
    erreurs.semestreId = 'Sélectionnez un semestre.';
  } else if (
    !semestresPourNiveau(referentiel, formulaire.niveauId).some(
      (semestre) => semestre.value === formulaire.semestreId,
    )
  ) {
    erreurs.semestreId = "Ce semestre n'est pas compatible avec le niveau.";
  }
  if (!formulaire.anneeUniversitaireId) {
    erreurs.anneeUniversitaireId = 'Sélectionnez une année universitaire.';
  } else if (!referentiel.anneesUniversitaires.includes(formulaire.anneeUniversitaireId)) {
    erreurs.anneeUniversitaireId = "Cette année universitaire n'est pas disponible.";
  }

  const volume = Number(formulaire.volumePrevu);
  if (!formulaire.volumePrevu.trim()) {
    erreurs.volumePrevu = 'Renseignez le volume prévu.';
  } else if (!Number.isInteger(volume) || volume < 1 || volume > 1000) {
    erreurs.volumePrevu = 'Le volume doit être un entier entre 1 et 1000 heures.';
  }

  if (referentiel.verrous.cycle && formulaire.cycle !== referentiel.verrous.cycle) {
    erreurs.cycle = 'Ce champ est verrouillé par votre périmètre.';
  }
  if (referentiel.verrous.mention && formulaire.mentionId !== referentiel.verrous.mention) {
    erreurs.mentionId = 'Ce champ est verrouillé par votre périmètre.';
  }
  if (referentiel.verrous.parcours && formulaire.parcours !== referentiel.verrous.parcours) {
    erreurs.parcours = 'Ce champ est verrouillé par votre périmètre.';
  }

  return erreurs;
}

export function estFormulaireValide(
  erreurs: ErreursCreationEnseignement,
): boolean {
  return Object.keys(erreurs).length === 0;
}

export function construirePayloadCreation(
  formulaire: FormulaireCreationEnseignement,
): CreateEnseignementPayload {
  return {
    matiereId: formulaire.matiereId.trim(),
    mentionId: formulaire.mentionId.trim(),
    cycle: formulaire.cycle as Cycle,
    niveauId: formulaire.niveauId.trim(),
    parcours: formulaire.parcours.trim(),
    semestreId: formulaire.semestreId.trim(),
    anneeUniversitaireId: formulaire.anneeUniversitaireId.trim(),
    volumePrevu: Number(formulaire.volumePrevu),
  };
}

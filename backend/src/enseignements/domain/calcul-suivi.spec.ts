import {
  calculerSuivi,
  calculerDureeSeance,
  EtatEnseignement,
  StatutSeance,
  TypeCloture,
} from './calcul-suivi';

describe('calculerSuivi', () => {
  it('retourne 0 h, NON_COMMENCE, progression 0 quand aucune séance réalisée', () => {
    const result = calculerSuivi(30, [
      { duree: 2, statut: StatutSeance.PLANIFIEE },
      { duree: 2, statut: StatutSeance.ANNULEE },
    ]);
    expect(result.heuresRealisees).toBe(0);
    expect(result.heuresRestantes).toBe(30);
    expect(result.progression).toBe(0);
    expect(result.etat).toBe(EtatEnseignement.NON_COMMENCE);
  });

  it('ne compte que les séances REALISEE (3h attendues, pas 7h)', () => {
    const result = calculerSuivi(30, [
      { duree: 3, statut: StatutSeance.REALISEE },
      { duree: 2, statut: StatutSeance.PLANIFIEE },
      { duree: 2, statut: StatutSeance.ANNULEE },
    ]);
    expect(result.heuresRealisees).toBe(3);
    expect(result.heuresRestantes).toBe(27);
    expect(result.progression).toBe(10);
    expect(result.etat).toBe(EtatEnseignement.EN_COURS);
  });

  it('calcule EN_COURS avec progression à 50 %', () => {
    const result = calculerSuivi(20, [{ duree: 10, statut: StatutSeance.REALISEE }]);
    expect(result.heuresRealisees).toBe(10);
    expect(result.heuresRestantes).toBe(10);
    expect(result.progression).toBe(50);
    expect(result.etat).toBe(EtatEnseignement.EN_COURS);
  });

  it('retourne TERMINE avec 100 % quand les heures égalent le volume prévu', () => {
    const result = calculerSuivi(20, [{ duree: 20, statut: StatutSeance.REALISEE }]);
    expect(result.progression).toBe(100);
    expect(result.heuresRestantes).toBe(0);
    expect(result.etat).toBe(EtatEnseignement.TERMINE);
    expect(result.clotureAnticipee).toBe(false);
    expect(result.typeCloture).toBe(TypeCloture.NORMALE);
  });

  it('plafonne la progression à 100 % quand les heures dépassent le volume prévu', () => {
    const result = calculerSuivi(30, [{ duree: 32, statut: StatutSeance.REALISEE }]);
    expect(result.progression).toBe(100);
    expect(result.heuresRestantes).toBe(0);
    expect(result.etat).toBe(EtatEnseignement.TERMINE);
    expect(result.typeCloture).toBe(TypeCloture.NORMALE);
  });

  it('retourne une progression à 2 décimales', () => {
    const result = calculerSuivi(30, [{ duree: 10, statut: StatutSeance.REALISEE }]);
    expect(result.progression).toBe(33.33);
  });
});

describe('calculerDureeSeance', () => {
  it('calcule la durée depuis les horaires', () => {
    expect(calculerDureeSeance('10:00', '12:00')).toBe(2);
    expect(calculerDureeSeance('08:30', '10:15')).toBe(1.75);
  });

  it('rejette une fin antérieure ou égale au début', () => {
    expect(() => calculerDureeSeance('12:00', '10:00')).toThrow();
    expect(() => calculerDureeSeance('10:00', '10:00')).toThrow();
  });

  it('rejette un format d\'heure invalide', () => {
    expect(() => calculerDureeSeance('dix', '12:00')).toThrow();
    expect(() => calculerDureeSeance('12h30', '14h00')).toThrow();
  });
});

/**
 * Clôture anticipée : l'enseignant termine lui-même son enseignement.
 * L'état devient TERMINE, mais la progression reste celle des heures réelles.
 */
describe('calculerSuivi — clôture anticipée', () => {
  // 27 h réalisées sur 30 h prévues = 90 % de progression.
  const seances27h = [{ duree: 27, statut: StatutSeance.REALISEE }];

  it('cas EN_COURS : 30 h prévues / 18 h réalisées = 60 %, EN_COURS', () => {
    const result = calculerSuivi(30, [{ duree: 18, statut: StatutSeance.REALISEE }]);
    expect(result.progression).toBe(60);
    expect(result.heuresRestantes).toBe(12);
    expect(result.etat).toBe(EtatEnseignement.EN_COURS);
    expect(result.typeCloture).toBeNull();
    expect(result.clotureAnticipee).toBe(false);
  });

  it('TEST 1 — 30 h prévues / 27 h réalisées / clôturé : TERMINE, 90 %, 3 h restantes', () => {
    const result = calculerSuivi(30, seances27h, true);
    expect(result.etat).toBe(EtatEnseignement.TERMINE);
    expect(result.progression).toBe(90);
    expect(result.heuresRealisees).toBe(27);
    expect(result.heuresRestantes).toBe(3);
    expect(result.clotureAnticipee).toBe(true);
    expect(result.typeCloture).toBe(TypeCloture.ANTICIPEE);
  });

  it('TEST 3 — 30 h prévues / 30 h réalisées : TERMINE, 100 %, clôture normale', () => {
    const result = calculerSuivi(30, [{ duree: 30, statut: StatutSeance.REALISEE }], false);
    expect(result.etat).toBe(EtatEnseignement.TERMINE);
    expect(result.progression).toBe(100);
    expect(result.heuresRestantes).toBe(0);
    expect(result.clotureAnticipee).toBe(false);
    expect(result.typeCloture).toBe(TypeCloture.NORMALE);
  });

  it('la clôture anticipée ne modifie jamais la progression (90 % reste 90 %)', () => {
    const avant = calculerSuivi(30, seances27h);
    const apres = calculerSuivi(30, seances27h, true);
    expect(apres.progression).toBe(avant.progression);
    expect(apres.heuresRealisees).toBe(avant.heuresRealisees);
    expect(apres.heuresRestantes).toBe(avant.heuresRestantes);
    expect(apres.etat).not.toBe(avant.etat);
  });

  it('conserve la trace de la clôture anticipée si des séances sont ajoutées ensuite', () => {
    const result = calculerSuivi(
      30,
      [...seances27h, { duree: 3, statut: StatutSeance.REALISEE }],
      true,
    );
    expect(result.etat).toBe(EtatEnseignement.TERMINE);
    expect(result.clotureAnticipee).toBe(true);
    expect(result.typeCloture).toBe(TypeCloture.ANTICIPEE);
  });

  it('reste NON_COMMENCE sans séance réalisée, même avec le drapeau de clôture', () => {
    const result = calculerSuivi(30, [], true);
    expect(result.etat).toBe(EtatEnseignement.NON_COMMENCE);
    expect(result.clotureAnticipee).toBe(false);
  });
});

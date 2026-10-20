import { describe, expect, it } from 'vitest';
import {
  ChampsRealisation,
  CONTENU_MIN,
  TYPES_SEANCE,
  validerRealisation,
} from './seance-form-options';

function champs(overrides: Partial<ChampsRealisation> = {}): ChampsRealisation {
  return {
    dateSeance: '2026-09-01',
    heureDebut: '08:00',
    heureFin: '10:00',
    contenuEnseigne: 'Chapitre 3 : algorithmes de tri',
    salle: 'B303',
    typeSeance: 'CM',
    ...overrides,
  };
}

describe('validerRealisation', () => {
  it('accepte un formulaire complet et valide', () => {
    expect(validerRealisation(champs())).toEqual({});
  });

  it('accepte chaque type de séance réellement pris en charge', () => {
    for (const typeSeance of TYPES_SEANCE) {
      expect(validerRealisation(champs({ typeSeance }))).toEqual({});
    }
  });

  it('bloque la confirmation si la salle est absente', () => {
    const erreurs = validerRealisation(champs({ salle: '' }));
    expect(erreurs.salle).toBe(
      'La salle est obligatoire pour marquer la séance comme réalisée.',
    );
  });

  it('bloque la confirmation si la salle n’est que des espaces', () => {
    const erreurs = validerRealisation(champs({ salle: '   ' }));
    expect(erreurs.salle).toBe(
      'La salle est obligatoire pour marquer la séance comme réalisée.',
    );
  });

  it('bloque la confirmation si le type de séance est absent', () => {
    const erreurs = validerRealisation(champs({ typeSeance: '' }));
    expect(erreurs.typeSeance).toBe(
      'Le type de séance est obligatoire pour marquer la séance comme réalisée.',
    );
  });

  it('rejette un type de séance non reconnu', () => {
    const erreurs = validerRealisation(champs({ typeSeance: 'Séminaire' }));
    expect(erreurs.typeSeance).toBe('Type de séance non reconnu.');
  });

  it('signale une heure de fin antérieure ou égale à l’heure de début', () => {
    expect(validerRealisation(champs({ heureDebut: '10:00', heureFin: '10:00' })).heureFin).toBe(
      "L'heure de fin doit être postérieure à l'heure de début.",
    );
    expect(validerRealisation(champs({ heureDebut: '12:00', heureFin: '10:00' })).heureFin).toBe(
      "L'heure de fin doit être postérieure à l'heure de début.",
    );
  });

  it('signale une date effective manquante', () => {
    expect(validerRealisation(champs({ dateSeance: '' })).dateSeance).toBe(
      'La date effective est obligatoire.',
    );
  });

  it('signale un contenu enseigné trop court', () => {
    const erreurs = validerRealisation(champs({ contenuEnseigne: '  ' }));
    expect(erreurs.contenuEnseigne).toBe(
      `Le contenu enseigné est obligatoire (${CONTENU_MIN} caractères minimum).`,
    );
  });

  it('conserve toutes les erreurs simultanées (salle, type et contenu)', () => {
    const erreurs = validerRealisation(
      champs({ salle: '', typeSeance: '', contenuEnseigne: '' }),
    );
    expect(Object.keys(erreurs).sort()).toEqual(['contenuEnseigne', 'salle', 'typeSeance']);
  });
});

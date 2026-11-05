import { Cycle } from '@prisma/client';
import {
  SEMESTRES_PAR_NIVEAU,
  semestreCompatible,
  validerCoherenceAcademique,
} from './referentiel-enseignement.js';

/**
 * Règle métier définitive de correspondance niveau → semestres :
 * L1: S1-S2, L2: S3-S4, L3: S5-S6, M1: S7-S8, M2: S9-S10.
 */
describe('correspondance officielle niveau / semestres', () => {
  it('définit les semestres autorisés pour chaque niveau', () => {
    expect(SEMESTRES_PAR_NIVEAU['L1']).toEqual(['S1', 'S2']);
    expect(SEMESTRES_PAR_NIVEAU['L2']).toEqual(['S3', 'S4']);
    expect(SEMESTRES_PAR_NIVEAU['L3']).toEqual(['S5', 'S6']);
    expect(SEMESTRES_PAR_NIVEAU['M1']).toEqual(['S7', 'S8']);
    expect(SEMESTRES_PAR_NIVEAU['M2']).toEqual(['S9', 'S10']);
  });

  it.each([
    ['L1', 'S1', true],
    ['L1', 'S2', true],
    ['L2', 'S3', true],
    ['L2', 'S4', true],
    ['L3', 'S5', true],
    ['L3', 'S6', true],
    ['M1', 'S7', true],
    ['M1', 'S8', true],
    ['M2', 'S9', true],
    ['M2', 'S10', true],
    // Combinaisons invalides à refuser.
    ['L1', 'S3', false],
    ['L2', 'S1', false],
    ['L3', 'S7', false],
    ['M1', 'S5', false],
    ['M1', 'S1', false],
    ['M2', 'S8', false],
    ['M2', 'S3', false],
  ])('%s + %s → %s', (niveau, semestre, attendu) => {
    expect(semestreCompatible(niveau, semestre)).toBe(attendu);
  });

  it('valide la cohérence académique complète des combinaisons autorisées', () => {
    expect(
      validerCoherenceAcademique({
        cycle: Cycle.MASTER,
        niveauId: 'M1',
        semestreId: 'S7',
        anneeUniversitaireId: '2026-2027',
      }),
    ).toBeNull();
    expect(
      validerCoherenceAcademique({
        cycle: Cycle.MASTER,
        niveauId: 'M2',
        semestreId: 'S10',
        anneeUniversitaireId: '2026-2027',
      }),
    ).toBeNull();
  });

  it('refuse les combinaisons invalides même envoyées directement à l’API', () => {
    expect(
      validerCoherenceAcademique({
        cycle: Cycle.MASTER,
        niveauId: 'M1',
        semestreId: 'S5',
        anneeUniversitaireId: '2026-2027',
      }),
    ).toBe("Le semestre S5 n'est pas compatible avec le niveau M1.");
    expect(
      validerCoherenceAcademique({
        cycle: Cycle.MASTER,
        niveauId: 'M2',
        semestreId: 'S8',
        anneeUniversitaireId: '2026-2027',
      }),
    ).toBe("Le semestre S8 n'est pas compatible avec le niveau M2.");
    expect(
      validerCoherenceAcademique({
        cycle: Cycle.LICENCE,
        niveauId: 'L3',
        semestreId: 'S7',
        anneeUniversitaireId: '2026-2027',
      }),
    ).toBe("Le semestre S7 n'est pas compatible avec le niveau L3.");
  });
});

import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RealiserSeanceDto } from './realiser-seance.dto';

async function valider(payload: Record<string, unknown>) {
  return validate(plainToInstance(RealiserSeanceDto, payload));
}

describe('RealiserSeanceDto', () => {
  it('accepte un payload complet valide', async () => {
    const erreurs = await valider({
      dateSeance: '2026-09-01T08:00:00.000Z',
      heureDebut: '08:00',
      heureFin: '10:00',
      contenuEnseigne: 'Cours réel',
      salle: 'B303',
      typeSeance: 'CM',
    });
    expect(erreurs).toHaveLength(0);
  });

  it('accepte un payload minimal dès que salle et type de séance sont fournis', async () => {
    const erreurs = await valider({
      contenuEnseigne: 'Cours réel',
      salle: 'B303',
      typeSeance: 'CM',
    });
    expect(erreurs).toHaveLength(0);
  });

  it('refuse un payload sans salle avec un message explicite', async () => {
    const erreurs = await valider({ contenuEnseigne: 'Cours réel', typeSeance: 'CM' });
    const erreurSalle = erreurs.find((e) => e.property === 'salle');
    expect(erreurSalle).toBeDefined();
    expect(erreurSalle?.constraints?.isString).toBe(
      'La salle est obligatoire pour marquer une séance comme réalisée',
    );
  });

  it('refuse un payload sans type de séance avec un message explicite', async () => {
    const erreurs = await valider({ contenuEnseigne: 'Cours réel', salle: 'B303' });
    const erreurType = erreurs.find((e) => e.property === 'typeSeance');
    expect(erreurType).toBeDefined();
    expect(erreurType?.constraints?.isString).toBe(
      'Le type de séance est obligatoire pour marquer une séance comme réalisée',
    );
  });

  it('refuse une salle de type non textuel', async () => {
    const erreurs = await valider({
      contenuEnseigne: 'Cours réel',
      salle: 42,
      typeSeance: 'CM',
    });
    expect(erreurs.map((e) => e.property)).toContain('salle');
  });

  it('refuse une heure de début au format invalide', async () => {
    const erreurs = await valider({
      heureDebut: '8h30',
      contenuEnseigne: 'Cours réel',
      salle: 'B303',
      typeSeance: 'CM',
    });
    const erreurHeure = erreurs.find((e) => e.property === 'heureDebut');
    expect(erreurHeure).toBeDefined();
    expect(erreurHeure?.constraints?.matches).toBe('heureDebut doit respecter le format HH:mm');
  });
});

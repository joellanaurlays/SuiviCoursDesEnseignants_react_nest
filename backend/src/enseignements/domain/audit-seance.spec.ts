import {
  ActionAuditSeance,
  champsModifies,
  instantaneSeance,
} from './audit-seance';

describe('audit-seance — domaine', () => {
  it('instantaneSeance normalise la date en ISO et conserve les champs métier', () => {
    const snap = instantaneSeance({
      dateSeance: new Date('2026-10-17T08:00:00.000Z'),
      heureDebut: '08:00',
      heureFin: '10:00',
      duree: 2,
      contenuEnseigne: 'Cours',
      statut: 'REALISEE',
    });

    expect(snap).toEqual({
      dateSeance: '2026-10-17T08:00:00.000Z',
      heureDebut: '08:00',
      heureFin: '10:00',
      duree: 2,
      contenuEnseigne: 'Cours',
      salle: null,
      typeSeance: null,
      statut: 'REALISEE',
    });
  });

  it('instantaneSeance gère une date invalide sans planter', () => {
    const snap = instantaneSeance({
      dateSeance: 'pas-une-date',
      heureDebut: '08:00',
      heureFin: '10:00',
      duree: 2,
      contenuEnseigne: null,
      statut: 'PLANIFIEE',
    });
    expect(snap.dateSeance).toBeNull();
  });

  it('champsModifies ne retient que les champs réellement modifiés', () => {
    const avant = instantaneSeance({
      dateSeance: '2026-10-17T08:00:00.000Z',
      heureDebut: '08:00',
      heureFin: '10:00',
      duree: 2,
      contenuEnseigne: 'Cours',
      statut: 'REALISEE',
    });
    const apres = instantaneSeance({
      dateSeance: '2026-10-17T08:00:00.000Z',
      heureDebut: '08:00',
      heureFin: '09:30',
      duree: 1.5,
      contenuEnseigne: 'Cours',
      statut: 'REALISEE',
    });

    const diff = champsModifies(avant, apres);
    expect(diff.avant).toEqual({ heureFin: '10:00', duree: 2 });
    expect(diff.apres).toEqual({ heureFin: '09:30', duree: 1.5 });
  });

  it('champsModifies renvoie des objets vides si rien ne change', () => {
    const snap = instantaneSeance({
      dateSeance: '2026-10-17T08:00:00.000Z',
      heureDebut: '08:00',
      heureFin: '10:00',
      duree: 2,
      contenuEnseigne: 'Cours',
      statut: 'REALISEE',
    });
    expect(champsModifies(snap, snap)).toEqual({ avant: {}, apres: {} });
  });

  it("l'enum d'action couvre toutes les actions tracées", () => {
    expect(Object.values(ActionAuditSeance).sort()).toEqual(
      [
        'ANNULATION',
        'CORRECTION',
        'CREATION',
        'DECLARATION_REALISEE',
        'MODIFICATION',
        'REALISATION',
        'SUPPRESSION',
      ],
    );
  });
});

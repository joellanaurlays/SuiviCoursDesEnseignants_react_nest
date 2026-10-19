import {
  aDesChangements,
  libelleAction,
  lignesChangements,
} from './audit-format';

describe('audit-format', () => {
  it('fournit un libellé lisible pour chaque action', () => {
    expect(libelleAction('REALISATION')).toBe('Réalisation');
    expect(libelleAction('DECLARATION_REALISEE')).toBe('Déclaration réalisée');
    expect(libelleAction('CORRECTION')).toBe('Correction');
    expect(libelleAction('SUPPRESSION')).toBe('Suppression');
  });

  it('indique les actions porteuses de changements', () => {
    expect(aDesChangements('MODIFICATION')).toBe(true);
    expect(aDesChangements('CORRECTION')).toBe(true);
    expect(aDesChangements('CREATION')).toBe(false);
    expect(aDesChangements('SUPPRESSION')).toBe(false);
  });

  it('produit des lignes avant → après formatées', () => {
    const lignes = lignesChangements(
      { heureFin: '10:00', duree: 2 },
      { heureFin: '09:30', duree: 1.5 },
    );
    const parLabel = Object.fromEntries(lignes.map((l) => [l.label, l]));

    expect(parLabel['Heure fin']).toEqual({ label: 'Heure fin', avant: '10:00', apres: '09:30' });
    expect(parLabel['Durée']).toEqual({ label: 'Durée', avant: '2h00', apres: '1h30' });
  });

  it('affiche un tiret pour une valeur absente', () => {
    const lignes = lignesChangements(null, { contenuEnseigne: null });
    expect(lignes[0].apres).toBe('—');
  });
});

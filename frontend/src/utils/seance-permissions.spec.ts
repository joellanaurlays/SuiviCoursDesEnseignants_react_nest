import {
  estEnseignantResponsable,
  peutAnnulerSeance,
  peutRealiserSeance,
} from './seance-permissions';
import { Seance, StatutSeance, UserSession } from '../types/enseignement';

function seance(statut: StatutSeance, enseignantId = 'Prof A'): Pick<Seance, 'statut' | 'enseignement'> {
  return {
    statut,
    enseignement: { enseignantId } as Seance['enseignement'],
  };
}

const enseignantResponsable: Pick<UserSession, 'role' | 'userId'> = {
  role: 'ENSEIGNANT',
  userId: 'Prof A',
};
const autreEnseignant: Pick<UserSession, 'role' | 'userId'> = {
  role: 'ENSEIGNANT',
  userId: 'Prof B',
};
const scolarite: Pick<UserSession, 'role' | 'userId'> = { role: 'SCOLARITE', userId: 'sec' };
const admin: Pick<UserSession, 'role' | 'userId'> = { role: 'ADMINISTRATEUR', userId: 'admin' };

describe('estEnseignantResponsable', () => {
  it('reconnaît le titulaire de l’enseignement', () => {
    expect(estEnseignantResponsable(seance('PLANIFIEE'), enseignantResponsable)).toBe(true);
  });

  it('refuse un autre enseignant', () => {
    expect(estEnseignantResponsable(seance('PLANIFIEE'), autreEnseignant)).toBe(false);
  });
});

describe('peutRealiserSeance / peutAnnulerSeance', () => {
  it('autorise le responsable sur une séance planifiée', () => {
    expect(peutRealiserSeance(seance('PLANIFIEE'), enseignantResponsable)).toBe(true);
    expect(peutAnnulerSeance(seance('PLANIFIEE'), enseignantResponsable)).toBe(true);
  });

  it('interdit les actions aux autres rôles', () => {
    for (const user of [autreEnseignant, scolarite, admin]) {
      expect(peutRealiserSeance(seance('PLANIFIEE'), user)).toBe(false);
      expect(peutAnnulerSeance(seance('PLANIFIEE'), user)).toBe(false);
    }
  });

  it('n’autorise aucune action sur une séance déjà réalisée', () => {
    expect(peutRealiserSeance(seance('REALISEE'), enseignantResponsable)).toBe(false);
    expect(peutAnnulerSeance(seance('REALISEE'), enseignantResponsable)).toBe(false);
  });

  it('n’autorise aucune action sur une séance annulée', () => {
    expect(peutRealiserSeance(seance('ANNULEE'), enseignantResponsable)).toBe(false);
    expect(peutAnnulerSeance(seance('ANNULEE'), enseignantResponsable)).toBe(false);
  });
});

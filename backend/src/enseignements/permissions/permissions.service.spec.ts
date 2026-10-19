import { PermissionsService } from './permissions.service';
import { AuthContext } from '../../auth/auth-context';
import { Role } from '../../auth/roles.enum';

describe('PermissionsService', () => {
  const service = new PermissionsService();

  const enseignement = {
    matiereId: 'x',
    enseignantId: 'Prof A',
    mentionId: 'Informatique',
    cycle: 'LICENCE',
    parcours: 'Informatique',
  };

  const enseignantCtx: AuthContext = { userId: 'Prof A', role: Role.ENSEIGNANT };
  const enseignantAutreCtx: AuthContext = { userId: 'Prof B', role: Role.ENSEIGNANT };
  const scolariteCtx: AuthContext = { userId: 'sec', role: Role.SCOLARITE };
  const adminCtx: AuthContext = { userId: 'admin', role: Role.ADMINISTRATEUR };
  const responsableLicence: AuthContext = {
    userId: 'respon-li-info',
    role: Role.RESPONSABLE_MENTION,
    cycles: ['LICENCE'],
    parcours: 'Informatique',
  };
  const responsableMaster: AuthContext = {
    userId: 'respon-ma-info',
    role: Role.RESPONSABLE_MENTION,
    cycles: ['MASTER'],
    parcours: 'Informatique',
  };

  describe('buildEnseignementScope', () => {
    it("limite l'enseignant a ses propres enseignements", () => {
      expect(service.buildEnseignementScope(enseignantCtx)).toEqual({ enseignantId: 'Prof A' });
    });

    it('limite le responsable de parcours a son parcours et son cycle', () => {
      expect(service.buildEnseignementScope(responsableLicence)).toEqual({
        parcours: 'Informatique',
        cycle: { in: ['LICENCE'] },
      });
      expect(service.buildEnseignementScope(responsableMaster)).toEqual({
        parcours: 'Informatique',
        cycle: { in: ['MASTER'] },
      });
    });

    it("un responsable sans parcours n'obtient aucun perimetre", () => {
      const sansParcours: AuthContext = {
        userId: 'respon',
        role: Role.RESPONSABLE_MENTION,
        cycles: ['LICENCE'],
      };
      expect(service.buildEnseignementScope(sansParcours)).toEqual({ id: '__aucun__' });
      expect(service.canAccessEnseignement(sansParcours, enseignement)).toBe(false);
    });

    it('ne filtre pas scolarite et admin', () => {
      expect(service.buildEnseignementScope(scolariteCtx)).toEqual({});
      expect(service.buildEnseignementScope(adminCtx)).toEqual({});
    });
  });

  describe('canAccessEnseignement', () => {
    it("autorise un enseignant sur son enseignement et refuse sur un autre", () => {
      expect(service.canAccessEnseignement(enseignantCtx, enseignement)).toBe(true);
      expect(service.canAccessEnseignement(enseignantAutreCtx, enseignement)).toBe(false);
    });

    it('autorise le responsable de parcours dans son perimetre parcours+cycle', () => {
      expect(service.canAccessEnseignement(responsableLicence, enseignement)).toBe(true);
      expect(service.canAccessEnseignement(responsableMaster, enseignement)).toBe(false);
    });

    it('autorise scolarite et admin', () => {
      expect(service.canAccessEnseignement(scolariteCtx, enseignement)).toBe(true);
      expect(service.canAccessEnseignement(adminCtx, enseignement)).toBe(true);
    });
  });

  describe('canManageEnseignement', () => {
    it('refuse la gestion au responsable de parcours', () => {
      expect(service.canManageEnseignement(responsableLicence, enseignement)).toBe(false);
      expect(service.canManageEnseignement(responsableMaster, enseignement)).toBe(false);
    });

    it("autorise l'enseignant uniquement sur ses enseignements", () => {
      expect(service.canManageEnseignement(enseignantCtx, enseignement)).toBe(true);
      expect(service.canManageEnseignement(enseignantAutreCtx, enseignement)).toBe(false);
    });

    it('autorise scolarite et admin', () => {
      expect(service.canManageEnseignement(scolariteCtx, enseignement)).toBe(true);
      expect(service.canManageEnseignement(adminCtx, enseignement)).toBe(true);
    });
  });

  describe('canRealiserOuAnnulerSeance', () => {
    const seance = { enseignement };

    it("TEST 1 — autorise l'enseignant responsable de la séance", () => {
      expect(service.canRealiserOuAnnulerSeance(enseignantCtx, seance)).toBe(true);
    });

    it("TEST 7 — refuse un enseignant qui n'est pas affecté à la séance", () => {
      expect(service.canRealiserOuAnnulerSeance(enseignantAutreCtx, seance)).toBe(false);
    });

    it('refuse la réalisation/annulation au responsable de parcours', () => {
      expect(service.canRealiserOuAnnulerSeance(responsableLicence, seance)).toBe(false);
      expect(service.canRealiserOuAnnulerSeance(responsableMaster, seance)).toBe(false);
    });

    it('refuse la réalisation/annulation à la scolarité et à l’administrateur', () => {
      expect(service.canRealiserOuAnnulerSeance(scolariteCtx, seance)).toBe(false);
      expect(service.canRealiserOuAnnulerSeance(adminCtx, seance)).toBe(false);
    });

    it('refuse sans contexte authentifié', () => {
      expect(service.canRealiserOuAnnulerSeance(undefined, seance)).toBe(false);
    });
  });

  // ------------------------------------------------------------- Cloture anticipee

  describe('canCloturer', () => {
    it("autorise l'enseignant affecte a cloturer son propre enseignement", () => {
      expect(service.canCloturer(enseignantCtx, enseignement)).toBe(true);
    });

    it("TEST 4 - refuse un enseignant qui tente de cloturer l'enseignement d'un autre", () => {
      expect(service.canCloturer(enseignantAutreCtx, enseignement)).toBe(false);
    });

    it('ne donne aucun droit de cloture au responsable de parcours', () => {
      expect(service.canCloturer(responsableLicence, enseignement)).toBe(false);
      expect(service.canCloturer(responsableMaster, enseignement)).toBe(false);
    });

    it('ne donne aucun droit de cloture a la scolarite', () => {
      expect(service.canCloturer(scolariteCtx, enseignement)).toBe(false);
    });

    it("ne donne aucun droit de cloture a l'administrateur", () => {
      expect(service.canCloturer(adminCtx, enseignement)).toBe(false);
    });
  });

  // ------------------------------------------------- Separation stricte des 6 parcours EMIT

  describe('separation des six parcours EMIT', () => {
    function resp(cycle: 'LICENCE' | 'MASTER', parcours: string): AuthContext {
      return { userId: `resp-${cycle}-${parcours}`, role: Role.RESPONSABLE_MENTION, cycles: [cycle], parcours };
    }
    function ens(cycle: 'LICENCE' | 'MASTER', parcours: string) {
      return { matiereId: 'm', enseignantId: 'Prof', mentionId: parcours, cycle, parcours };
    }

    const liInfo = resp('LICENCE', 'Informatique');
    const liMgt = resp('LICENCE', 'Management');
    const liIcm = resp('LICENCE', 'ICM');
    const maInfo = resp('MASTER', 'Informatique');
    const maMgt = resp('MASTER', 'Management');
    const maIcm = resp('MASTER', 'ICM');

    it('TEST 2 - Licence Informatique ne voit pas Licence Management', () => {
      expect(service.canAccessEnseignement(liInfo, ens('LICENCE', 'Management'))).toBe(false);
    });

    it('TEST 3 - Licence Management ne voit pas Licence ICM', () => {
      expect(service.canAccessEnseignement(liMgt, ens('LICENCE', 'ICM'))).toBe(false);
    });

    it('TEST 4 - Licence ICM ne voit pas Master ICM', () => {
      expect(service.canAccessEnseignement(liIcm, ens('MASTER', 'ICM'))).toBe(false);
    });

    it('TEST 5 - Master Informatique ne voit pas Master Management', () => {
      expect(service.canAccessEnseignement(maInfo, ens('MASTER', 'Management'))).toBe(false);
    });

    it('TEST 6 - Master Management ne voit pas Master ICM', () => {
      expect(service.canAccessEnseignement(maMgt, ens('MASTER', 'ICM'))).toBe(false);
    });

    it('TEST 7 - Master ICM ne voit pas Licence Informatique', () => {
      expect(service.canAccessEnseignement(maIcm, ens('LICENCE', 'Informatique'))).toBe(false);
    });

    it('chaque responsable ne voit QUE son propre parcours (matrice 6x6)', () => {
      const responsables: [AuthContext, 'LICENCE' | 'MASTER', string][] = [
        [liInfo, 'LICENCE', 'Informatique'],
        [liMgt, 'LICENCE', 'Management'],
        [liIcm, 'LICENCE', 'ICM'],
        [maInfo, 'MASTER', 'Informatique'],
        [maMgt, 'MASTER', 'Management'],
        [maIcm, 'MASTER', 'ICM'],
      ];
      const enseignements = responsables.map(([, cycle, parcours]) => ens(cycle, parcours));

      responsables.forEach(([ctx], indexProprietaire) => {
        enseignements.forEach((e, indexLigne) => {
          const attendu = indexProprietaire === indexLigne;
          expect(service.canAccessEnseignement(ctx, e)).toBe(attendu);
        });
      });
    });
  });

  describe('regression - le perimetre de consultation est preserve', () => {
    const masterEnseignement = {
      matiereId: 'x',
      enseignantId: 'Prof A',
      mentionId: 'Informatique',
      cycle: 'MASTER',
      parcours: 'Informatique',
    };
    const autreParcours = {
      matiereId: 'x',
      enseignantId: 'Prof A',
      mentionId: 'Management',
      cycle: 'LICENCE',
      parcours: 'Management',
    };

    it('le responsable de parcours continue de consulter son parcours et son cycle', () => {
      expect(service.canAccessEnseignement(responsableLicence, enseignement)).toBe(true);
      expect(service.canAccessEnseignement(responsableMaster, masterEnseignement)).toBe(true);
      expect(service.canAccessEnseignement(responsableLicence, masterEnseignement)).toBe(false);
      expect(service.canAccessEnseignement(responsableLicence, autreParcours)).toBe(false);
    });

    it("la scolarite et l'administrateur continuent de consulter globalement", () => {
      expect(service.canAccessEnseignement(scolariteCtx, autreParcours)).toBe(true);
      expect(service.canAccessEnseignement(adminCtx, autreParcours)).toBe(true);
    });
  });
});

import { vi, type Mock } from 'vitest';
import { GetSuiviStatistiquesUseCase } from './get-suivi-statistiques.use-case.js';
import { PermissionsService } from '../permissions/permissions.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthContext } from '../../auth/auth-context.js';
import { Role } from '../../auth/roles.enum.js';
import { StatutSeance } from '../domain/calcul-suivi.js';
import { SuiviQueryDto } from '../dto/suivi-query.dto.js';

/**
 * Jeu de données en mémoire : il reproduit ce qu'un vrai `findMany` renverrait
 * une fois la clause `where` (périmètre de rôle AND filtres) appliquée.
 */
interface Ligne {
  id: string;
  matiereId: string;
  enseignantId: string;
  mentionId: string;
  cycle: 'LICENCE' | 'MASTER';
  niveauId: string;
  parcours: string;
  semestreId: string;
  anneeUniversitaireId: string;
  volumePrevu: number;
  // Colonne dénormalisée persistée, cohérente avec le calcul des séances.
  etat: string;
  clotureAnticipee: boolean;
  seances: { duree: number; statut: string }[];
}

const DONNEES: Ligne[] = [
  {
    // Clôture anticipée : 27 h réalisées / 30 h prévues -> 90 %, TERMINE.
    id: 'E1',
    matiereId: 'Algorithmique',
    enseignantId: 'Prof A',
    mentionId: 'Informatique',
    cycle: 'LICENCE',
    niveauId: 'L1',
    parcours: 'Informatique',
    semestreId: 'S1',
    anneeUniversitaireId: '2025-2026',
    volumePrevu: 30,
    etat: 'TERMINE',
    clotureAnticipee: true,
    seances: [
      { duree: 27, statut: StatutSeance.REALISEE },
      { duree: 2, statut: StatutSeance.PLANIFIEE },
      { duree: 2, statut: StatutSeance.ANNULEE },
    ],
  },
  {
    id: 'E2',
    matiereId: 'Bases de données',
    enseignantId: 'Prof A',
    mentionId: 'Informatique',
    cycle: 'MASTER',
    niveauId: 'M1',
    parcours: 'Informatique',
    semestreId: 'S7',
    anneeUniversitaireId: '2025-2026',
    volumePrevu: 20,
    etat: 'TERMINE',
    clotureAnticipee: false,
    seances: [{ duree: 20, statut: StatutSeance.REALISEE }],
  },
  {
    id: 'E3',
    matiereId: 'Réseaux',
    enseignantId: 'Prof B',
    mentionId: 'Informatique',
    cycle: 'LICENCE',
    niveauId: 'L2',
    parcours: 'Informatique',
    semestreId: 'S1',
    anneeUniversitaireId: '2025-2026',
    volumePrevu: 10,
    etat: 'NON_COMMENCE',
    clotureAnticipee: false,
    seances: [],
  },
  {
    id: 'E4',
    matiereId: 'Analyse',
    enseignantId: 'Prof B',
    mentionId: 'Management',
    cycle: 'LICENCE',
    niveauId: 'L3',
    parcours: 'Management',
    semestreId: 'S1',
    anneeUniversitaireId: '2024-2025',
    volumePrevu: 10,
    etat: 'EN_COURS',
    clotureAnticipee: false,
    seances: [{ duree: 4, statut: StatutSeance.REALISEE }],
  },
];

type Filtre = Record<string, unknown>;

/** Évaluateur minimal reproduisant les opérateurs Prisma réellement émis. */
function correspond(ligne: Ligne, where: Filtre | undefined): boolean {
  if (!where) return true;
  for (const [cle, valeur] of Object.entries(where)) {
    if (valeur === undefined) continue;
    if (cle === 'AND') {
      if (!(valeur as Filtre[]).every((f) => correspond(ligne, f))) return false;
      continue;
    }
    if (cle === 'OR') {
      if (!(valeur as Filtre[]).some((f) => correspond(ligne, f))) return false;
      continue;
    }
    const champ = (ligne as unknown as Record<string, unknown>)[cle];
    if (valeur && typeof valeur === 'object' && !Array.isArray(valeur)) {
      const objet = valeur as { contains?: string; in?: unknown[] };
      if (objet.contains !== undefined) {
        if (!String(champ ?? '').toLowerCase().includes(objet.contains.toLowerCase())) return false;
        continue;
      }
      if (objet.in !== undefined) {
        if (!objet.in.includes(champ)) return false;
        continue;
      }
    }
    if (champ !== valeur) return false;
  }
  return true;
}

function creerPrisma(): PrismaService {
  return {
    enseignement: {
      findMany: vi.fn((args: { where?: Filtre }) =>
        Promise.resolve(DONNEES.filter((ligne) => correspond(ligne, args.where))),
      ),
    },
  } as unknown as PrismaService;
}

function creerUseCase(): { useCase: GetSuiviStatistiquesUseCase; findMany: Mock } {
  const prisma = creerPrisma();
  const useCase = new GetSuiviStatistiquesUseCase(prisma, new PermissionsService());
  const findMany = prisma.enseignement.findMany as unknown as Mock;
  return { useCase, findMany };
}

const enseignantA: AuthContext = { userId: 'Prof A', role: Role.ENSEIGNANT };
const scolarite: AuthContext = { userId: 'sec', role: Role.SCOLARITE };
const admin: AuthContext = { userId: 'admin', role: Role.ADMINISTRATEUR };
const responsableLicence: AuthContext = {
  userId: 'respo-li-info',
  role: Role.RESPONSABLE_MENTION,
  cycles: ['LICENCE'],
  parcours: 'Informatique',
};
const responsableMaster: AuthContext = {
  userId: 'respo-ma-info',
  role: Role.RESPONSABLE_MENTION,
  cycles: ['MASTER'],
  parcours: 'Informatique',
};
const responsableLicenceManagement: AuthContext = {
  userId: 'respo-li-mgt',
  role: Role.RESPONSABLE_MENTION,
  cycles: ['LICENCE'],
  parcours: 'Management',
};

describe('GetSuiviStatistiquesUseCase', () => {
  // 1. Périmètre ENSEIGNANT : uniquement ses propres enseignements.
  it("l'enseignant n'agrège que ses propres enseignements", async () => {
    const { useCase } = creerUseCase();
    const stats = await useCase.execute(enseignantA);

    expect(stats.totaux.enseignements).toBe(2);
    expect(stats.totaux.volumePrevu).toBe(50);
    expect(stats.totaux.heuresRealisees).toBe(47);
    expect(stats.totaux.heuresRestantes).toBe(3);
    expect(stats.totaux.progression).toBe(94);
  });

  it("TEST 11 - l'enseignant ne peut pas élargir son périmètre via un filtre enseignant", async () => {
    const { useCase, findMany } = creerUseCase();
    const filtres = Object.assign(new SuiviQueryDto(), { enseignant: 'Prof B' });
    const stats = await useCase.execute(enseignantA, filtres);

    // Le scope enseignantId=Prof A est combiné en AND avec le filtre Prof B :
    // aucune donnée de Prof B ne remonte.
    expect(stats.totaux.enseignements).toBe(0);
    const where = findMany.mock.calls[0][0].where;
    expect(where.AND[0]).toEqual({ enseignantId: 'Prof A' });
  });

  // 2. Chef de scolarité : vue globale.
  it('le chef de scolarité agrège tout le périmètre autorisé', async () => {
    const { useCase } = creerUseCase();
    const stats = await useCase.execute(scolarite);

    expect(stats.totaux.enseignements).toBe(4);
    expect(stats.totaux.volumePrevu).toBe(70);
    expect(stats.totaux.heuresRealisees).toBe(51);
    expect(stats.totaux.heuresRestantes).toBe(19);
    expect(stats.totaux.progression).toBe(72.86);
    expect(stats.etats).toEqual({ nonCommences: 1, enCours: 1, termines: 2 });
  });

  // 3. Responsable Licence Informatique : son parcours + cycle LICENCE uniquement.
  it('le responsable Licence Informatique ne voit que son parcours et le cycle LICENCE', async () => {
    const { useCase } = creerUseCase();
    const stats = await useCase.execute(responsableLicence);

    expect(stats.totaux.enseignements).toBe(2); // E1, E3 (Licence Informatique)
    expect(stats.etats).toEqual({ nonCommences: 1, enCours: 0, termines: 1 });
  });

  it('le responsable Licence Management ne voit que son parcours (E4)', async () => {
    const { useCase } = creerUseCase();
    const stats = await useCase.execute(responsableLicenceManagement);

    expect(stats.totaux.enseignements).toBe(1); // E4 uniquement
    expect(stats.etats).toEqual({ nonCommences: 0, enCours: 1, termines: 0 });
  });

  it('TEST 11 - le responsable Licence ne peut pas atteindre le Master via un filtre cycle', async () => {
    const { useCase } = creerUseCase();
    const filtres = Object.assign(new SuiviQueryDto(), { cycle: 'MASTER' });
    const stats = await useCase.execute(responsableLicence, filtres);
    expect(stats.totaux.enseignements).toBe(0);
  });

  it('TEST 11 - un responsable ne peut pas elargir son parcours via un filtre parcours', async () => {
    const { useCase } = creerUseCase();
    const filtres = Object.assign(new SuiviQueryDto(), { parcours: 'Management' });
    const stats = await useCase.execute(responsableLicence, filtres);
    expect(stats.totaux.enseignements).toBe(0);
  });

  // 4. Responsable Master : son parcours + cycle MASTER uniquement.
  it('le responsable Master Informatique ne voit que son parcours et le cycle MASTER', async () => {
    const { useCase } = creerUseCase();
    const stats = await useCase.execute(responsableMaster);

    expect(stats.totaux.enseignements).toBe(1); // E2 uniquement
    expect(stats.totaux.volumePrevu).toBe(20);
    expect(stats.totaux.progression).toBe(100);
    expect(stats.etats).toEqual({ nonCommences: 0, enCours: 0, termines: 1 });
  });

  // 5. Administrateur : même périmètre global que ses droits existants (visibilité).
  it("l'administrateur conserve un accès global cohérent", async () => {
    const { useCase } = creerUseCase();
    const stats = await useCase.execute(admin);
    expect(stats.totaux.enseignements).toBe(4);
  });

  // 6 & 7. Statistiques = résultats filtrés, plusieurs filtres combinés en AND.
  it('TEST 6+7 - plusieurs filtres combinés recalculent les statistiques', async () => {
    const { useCase } = creerUseCase();
    const filtres = Object.assign(new SuiviQueryDto(), {
      mention: 'Informatique',
      cycle: 'LICENCE',
    });
    const stats = await useCase.execute(scolarite, filtres);

    // E1 et E3 -> 2 enseignements, 40 h prévues, 27 h réalisées.
    expect(stats.totaux.enseignements).toBe(2);
    expect(stats.totaux.volumePrevu).toBe(40);
    expect(stats.totaux.heuresRealisees).toBe(27);
    expect(stats.etats).toEqual({ nonCommences: 1, enCours: 0, termines: 1 });
  });

  it('le filtre état restreint les agrégats aux lignes correspondantes', async () => {
    const { useCase } = creerUseCase();
    const filtres = Object.assign(new SuiviQueryDto(), { etat: 'TERMINE' });
    const stats = await useCase.execute(scolarite, filtres);

    expect(stats.totaux.enseignements).toBe(2);
    expect(stats.etats.termines).toBe(2);
  });

  // 8. Une séance PLANIFIEE / ANNULEE n'augmente pas les heures réalisées.
  it("TEST 8 - seules les séances réalisées comptent dans les agrégats", async () => {
    const { useCase } = creerUseCase();
    const filtres = Object.assign(new SuiviQueryDto(), { matiere: 'Algorithmique' });
    const stats = await useCase.execute(scolarite, filtres);

    // E1 : 27 h réalisées malgré 2 h planifiées et 2 h annulées.
    expect(stats.totaux.heuresRealisees).toBe(27);
    expect(stats.totaux.heuresRestantes).toBe(3);
  });

  // 9. Une clôture anticipée ne force pas la progression à 100 %.
  it('TEST 9 - la clôture anticipée reste à 90 % et est comptabilisée', async () => {
    const { useCase } = creerUseCase();
    const filtres = Object.assign(new SuiviQueryDto(), { matiere: 'Algorithmique' });
    const stats = await useCase.execute(scolarite, filtres);

    expect(stats.totaux.progression).toBe(90);
    expect(stats.clotures.terminesParClotureAnticipee).toBe(1);
    expect(stats.etats.termines).toBe(1);
  });

  it('refuse une requête sans contexte authentifié', async () => {
    const { useCase } = creerUseCase();
    await expect(useCase.execute(undefined)).rejects.toThrow('Authentification requise');
  });
});

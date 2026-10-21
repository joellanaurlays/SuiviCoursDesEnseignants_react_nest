import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { validateSync } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PermissionsService } from '../permissions/permissions.service.js';
import { CloturerEnseignementDto } from '../dto/cloturer-enseignement.dto.js';
import { CloturerEnseignementUseCase } from './cloturer-enseignement.use-case.js';
import { GetClotureEnseignementUseCase } from './get-cloture-enseignement.use-case.js';
import { SuiviRecalculService } from '../services/suivi-recalcul.service.js';
import { AuthContext } from '../../auth/auth-context.js';
import { Role } from '../../auth/roles.enum.js';

/* ------------------------------------------------------------------ */
/* Faux Prisma minimal : seules findUnique (include) et update sont     */
/* utilisées par les use-cases de clôture.                              */
/* ------------------------------------------------------------------ */

interface SeanceRow {
  duree: number;
  statut: string;
}

interface EnseignementRow {
  id: string;
  matiereId: string;
  enseignantId: string;
  mentionId: string;
  parcours: string;
  cycle: string;
  volumePrevu: number;
  heuresRealisees: number;
  progression: number;
  etat: string;
  clotureAnticipee: boolean;
  motifCloture: string | null;
  dateCloture: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

class FakePrisma {
  private row: EnseignementRow | null = null;
  private seances: SeanceRow[] = [];

  /** `heures` heures réalisées sur `volumePrevu` heures prévues. */
  init(volumePrevu: number, heures: number): void {
    this.row = {
      id: 'ens-1',
      matiereId: 'Base de donnees',
      enseignantId: 'Prof A',
      mentionId: 'Informatique',
      parcours: 'Informatique',
      cycle: 'LICENCE',
      volumePrevu,
      // Valeurs volontairement périmées : la clôture doit les resynchroniser.
      heuresRealisees: 0,
      progression: 0,
      etat: 'NON_COMMENCE',
      clotureAnticipee: false,
      motifCloture: null,
      dateCloture: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    };
    this.seances = heures > 0 ? [{ duree: heures, statut: 'REALISEE' }] : [];
  }

  get ligne(): EnseignementRow | null {
    return this.row;
  }

  readonly enseignement = {
    findUnique: async ({ where }: { where: { id: string } }) => {
      if (!this.row || this.row.id !== where.id) return null;
      return { ...this.row, seances: [...this.seances] };
    },
    update: async ({ data }: { data: Partial<EnseignementRow> }) => {
      if (!this.row) throw new Error('introuvable');
      Object.assign(this.row, data);
      return { ...this.row, seances: [...this.seances] };
    },
  };
}

/* ------------------------------------------------------------------ */
/* Contextes                                                            */
/* ------------------------------------------------------------------ */

const enseignantA: AuthContext = { userId: 'Prof A', role: Role.ENSEIGNANT };
const enseignantB: AuthContext = { userId: 'Prof B', role: Role.ENSEIGNANT };
const respLicence: AuthContext = {
  userId: 'Resp',
  role: Role.RESPONSABLE_MENTION,
  cycles: ['LICENCE'],
  parcours: 'Informatique',
};
const scolarite: AuthContext = { userId: 'Chef de scolarite', role: Role.SCOLARITE };
const admin: AuthContext = { userId: 'Admin', role: Role.ADMINISTRATEUR };

function monter(volumePrevu: number, heures: number) {
  const prisma = new FakePrisma();
  prisma.init(volumePrevu, heures);
  const client = prisma as unknown as PrismaService;
  const permissionsService = new PermissionsService();
  return {
    prisma,
    cloturer: new CloturerEnseignementUseCase(
      client,
      permissionsService,
      new SuiviRecalculService(client),
    ),
    getCloture: new GetClotureEnseignementUseCase(client, permissionsService),
  };
}

const motifValide: CloturerEnseignementDto = {
  motif: 'Le contenu prevu dans le programme a ete entierement traite.',
};

/* ------------------------------------------------------------------ */
/* Tests                                                                */
/* ------------------------------------------------------------------ */

describe('CloturerEnseignementUseCase', () => {
  it('TEST 1 — 30 h prevues / 27 h realisees : cloture anticipee, TERMINE, 90 %, 3 h restantes', async () => {
    const { prisma, cloturer } = monter(30, 27);

    const { suivi } = await cloturer.execute('ens-1', motifValide, enseignantA);

    expect(suivi.etat).toBe('TERMINE');
    expect(suivi.progression).toBe(90);
    expect(suivi.heuresRealisees).toBe(27);
    expect(suivi.heuresRestantes).toBe(3);
    expect(suivi.clotureAnticipee).toBe(true);
    expect(suivi.typeCloture).toBe('ANTICIPEE');
    expect(suivi.motifCloture).toBe(motifValide.motif);
    expect(suivi.dateCloture).toBeInstanceOf(Date);

    // Le volume n'a surtout pas été modifié.
    expect(prisma.ligne?.volumePrevu).toBe(30);
  });

  it('conserve les heures et la progression réelles en base', async () => {
    const { prisma, cloturer } = monter(30, 27);
    await cloturer.execute('ens-1', motifValide, enseignantA);
    expect(prisma.ligne?.etat).toBe('TERMINE');
    expect(prisma.ligne?.clotureAnticipee).toBe(true);
  });

  it('resynchronise le cache denormalise (heures, progression, etat)', async () => {
    const { prisma, cloturer } = monter(30, 27);

    // Le cache est volontairement perime (0 h / 0 % / NON_COMMENCE).
    expect(prisma.ligne?.heuresRealisees).toBe(0);
    expect(prisma.ligne?.progression).toBe(0);

    await cloturer.execute('ens-1', motifValide, enseignantA);

    // Apres cloture, la base doit refleter la regle metier unique.
    expect(prisma.ligne?.heuresRealisees).toBe(27);
    expect(prisma.ligne?.progression).toBe(90);
    expect(prisma.ligne?.etat).toBe('TERMINE');
  });

  it("n'accepte aucun champ d'auteur dans le corps de la requête", async () => {
    const { prisma, cloturer } = monter(30, 27);
    const dtoForge = { ...motifValide, enseignantId: 'Prof B' } as CloturerEnseignementDto;
    await cloturer.execute('ens-1', dtoForge, enseignantA);
    // Le seul auteur possible est le titulaire, imposé par canCloturer.
    expect(prisma.ligne?.enseignantId).toBe('Prof A');
  });

  it('normalise le motif en retirant les espaces superflus', async () => {
    const { prisma, cloturer } = monter(30, 27);
    await cloturer.execute('ens-1', { motif: '  Programme acheve.  ' }, enseignantA);
    expect(prisma.ligne?.motifCloture).toBe('Programme acheve.');
  });

  it('TEST 2 — refuse un motif vide (validation du DTO)', () => {
    expect(validateSync(new CloturerEnseignementDto()).map((e) => e.property)).toContain('motif');
    const tropCourt = validateSync(Object.assign(new CloturerEnseignementDto(), { motif: '   ' }));
    expect(tropCourt.map((e) => e.property)).toContain('motif');
  });

  it('TEST 2 — refuse aussi un motif absent au niveau du use-case', async () => {
    const { cloturer } = monter(30, 27);
    await expect(
      cloturer.execute('ens-1', { motif: '   ' } as CloturerEnseignementDto, enseignantA),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('TEST 3 — 30 h prevues / 30 h realisees : cloture normale, jamais anticipee', async () => {
    const { prisma, cloturer } = monter(30, 30);

    // Le suivi avant toute action est déjà terminé, sans clôture anticipée.
    const avant = await new GetClotureEnseignementUseCase(
      prisma as unknown as PrismaService,
      new PermissionsService(),
    ).execute('ens-1', enseignantA);
    expect(avant.etat).toBe('TERMINE');
    expect(avant.progression).toBe(100);
    expect(avant.clotureAnticipee).toBe(false);
    expect(avant.typeCloture).toBe('NORMALE');
    expect(avant.peutCloturer).toBe(false);

    // Et l'appel explicite est refusé : inutile de marquer une clôture normale.
    await expect(cloturer.execute('ens-1', motifValide, enseignantA)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.ligne?.clotureAnticipee).toBe(false);
    expect(prisma.ligne?.motifCloture).toBeNull();
  });

  it('TEST 4 — refuse un enseignant qui cloture l\'enseignement d\'un autre', async () => {
    const { prisma, cloturer } = monter(30, 27);
    await expect(cloturer.execute('ens-1', motifValide, enseignantB)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.ligne?.clotureAnticipee).toBe(false);
  });

  it('aucun autre role ne peut cloturer a la place de l\'enseignant', async () => {
    for (const role of [respLicence, scolarite, admin]) {
      const { prisma, cloturer } = monter(30, 27);
      await expect(cloturer.execute('ens-1', motifValide, role)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.ligne?.clotureAnticipee).toBe(false);
    }
  });

  it('TEST 5 — refuse une seconde cloture sur un enseignement deja cloture', async () => {
    const { prisma, cloturer } = monter(30, 27);
    await cloturer.execute('ens-1', motifValide, enseignantA);
    await expect(cloturer.execute('ens-1', motifValide, enseignantA)).rejects.toBeInstanceOf(
      ConflictException,
    );
    // Le motif d'origine est conservé.
    expect(prisma.ligne?.motifCloture).toBe(motifValide.motif);
  });

  it('refuse une cloture si aucune seance n\'a ete realisee', async () => {
    const { prisma, cloturer } = monter(30, 0);
    await expect(cloturer.execute('ens-1', motifValide, enseignantA)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.ligne?.clotureAnticipee).toBe(false);
  });

  it('leve une 404 sur un enseignement inexistant', async () => {
    const { cloturer } = monter(30, 27);
    await expect(cloturer.execute('inconnu', motifValide, enseignantA)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('refuse l\'appel sans contexte authentifie', async () => {
    const { cloturer } = monter(30, 27);
    await expect(cloturer.execute('ens-1', motifValide, undefined)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

describe('GetClotureEnseignementUseCase', () => {
  it('autorise l\'action uniquement pour l\'enseignant titulaire en cours', async () => {
    const { getCloture } = monter(30, 27);
    expect((await getCloture.execute('ens-1', enseignantA)).peutCloturer).toBe(true);
  });

  it('ne propose jamais l\'action aux roles non enseignants', async () => {
    for (const role of [respLicence, scolarite, admin]) {
      const { getCloture: get } = monter(30, 27);
      // Ils peuvent lire l'état de clôture, mais ne peuvent pas agir dessus.
      expect((await get.execute('ens-1', role)).peutCloturer).toBe(false);
    }
  });

  it('refuse l\'accumulation a un enseignant non titulaire', async () => {
    const { getCloture } = monter(30, 27);
    await expect(getCloture.execute('ens-1', enseignantB)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('interdit l\'action une fois l\'enseignement terminé', async () => {
    const { getCloture, cloturer } = monter(30, 27);
    await cloturer.execute('ens-1', motifValide, enseignantA);
    const resultat = await getCloture.execute('ens-1', enseignantA);
    expect(resultat.peutCloturer).toBe(false);
    expect(resultat.etat).toBe('TERMINE');
    expect(resultat.clotureAnticipee).toBe(true);
  });
});

describe('SuiviRecalculService', () => {
  it('ne modifie ni les heures ni la progression, seulement le cache d\'etat', async () => {
    const prisma = new FakePrisma();
    prisma.init(30, 27);
    const client = prisma as unknown as PrismaService;

    // Une clôture anticipée est déjà posée : le recalcul doit la respecter.
    await client.enseignement.update({
      where: { id: 'ens-1' },
      data: { clotureAnticipee: true, etat: 'TERMINE' },
    });
    await new SuiviRecalculService(client).recalculerEtPersister('ens-1');

    expect(prisma.ligne?.etat).toBe('TERMINE');
    expect(prisma.ligne?.clotureAnticipee).toBe(true);
  });
});

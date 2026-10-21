import { vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PermissionsService } from '../permissions/permissions.service';
import { AuditSeanceService, EntreeAudit } from './audit-seance.service';
import { ActionAuditSeance } from '../domain/audit-seance';
import { AuthContext } from '../../auth/auth-context';
import { Role } from '../../auth/roles.enum';

interface JournalRow {
  id: string;
  seanceId: string;
  enseignementId: string;
  utilisateurId: string;
  action: string;
  motif: string | null;
  statutAvant: string | null;
  statutApres: string | null;
  valeursAvant: unknown;
  valeursApres: unknown;
  enseignantId: string;
  mentionId: string;
  cycle: string;
  parcours: string;
  createdAt: Date;
}

class FakePrisma {
  seanceRow: { id: string; enseignement: Record<string, string> } | null = null;
  entries: JournalRow[] = [];

  readonly seance = {
    findUnique: async ({ where }: { where: { id: string } }) =>
      this.seanceRow && this.seanceRow.id === where.id ? this.seanceRow : null,
  };

  readonly journalAuditSeance = {
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const row = { id: `a${this.entries.length + 1}`, createdAt: new Date(), ...data } as JournalRow;
      this.entries.push(row);
      return row;
    },
    findFirst: async ({ where }: { where: { seanceId: string } }) => {
      const rows = this.entries.filter((e) => e.seanceId === where.seanceId);
      return rows.length > 0 ? rows[rows.length - 1] : null;
    },
    findMany: vi.fn().mockResolvedValue([]),
  };
}

function monter() {
  const fake = new FakePrisma();
  const service = new AuditSeanceService(
    fake as unknown as PrismaService,
    new PermissionsService(),
  );
  return { fake, service };
}

const enseignantA: AuthContext = { userId: 'Prof A', role: Role.ENSEIGNANT };
const enseignantB: AuthContext = { userId: 'Prof B', role: Role.ENSEIGNANT };
const scolarite: AuthContext = { userId: 'sec', role: Role.SCOLARITE };
const responsable: AuthContext = {
  userId: 'resp',
  role: Role.RESPONSABLE_MENTION,
  cycles: ['LICENCE'],
  parcours: 'Informatique',
};
const responsableSansParcours: AuthContext = {
  userId: 'resp2',
  role: Role.RESPONSABLE_MENTION,
};

function perimetre(enseignantId = 'Prof A') {
  return {
    enseignantId,
    mentionId: 'Informatique',
    cycle: 'LICENCE',
    parcours: 'Informatique',
  };
}

const entree: EntreeAudit = {
  seanceId: 'seance-1',
  enseignementId: 'ens-1',
  action: ActionAuditSeance.REALISATION,
  statutAvant: 'PLANIFIEE',
  statutApres: 'REALISEE',
  perimetre: perimetre(),
};

describe('AuditSeanceService — écriture', () => {
  it("utilise l'identifiant authentifié, jamais une valeur fournie par le client", async () => {
    const { fake, service } = monter();
    const entreeSpoofee = { ...entree, utilisateurId: 'pirate' } as unknown as EntreeAudit;

    await service.enregistrer(entreeSpoofee, enseignantA);

    expect(fake.entries).toHaveLength(1);
    expect(fake.entries[0].utilisateurId).toBe('Prof A');
  });

  it('refuse de journaliser sans contexte authentifié (403)', async () => {
    const { fake, service } = monter();
    await expect(service.enregistrer(entree, undefined)).rejects.toBeInstanceOf(ForbiddenException);
    expect(fake.entries).toHaveLength(0);
  });

  it('conserve statut avant/après et le motif', async () => {
    const { fake, service } = monter();
    await service.enregistrer({ ...entree, motif: 'Cours reporté' }, enseignantA);
    expect(fake.entries[0]).toMatchObject({
      statutAvant: 'PLANIFIEE',
      statutApres: 'REALISEE',
      motif: 'Cours reporté',
      action: ActionAuditSeance.REALISATION,
    });
  });
});

describe('AuditSeanceService — consultation par séance', () => {
  it("l'enseignant responsable consulte l'historique de sa séance", async () => {
    const { fake, service } = monter();
    fake.seanceRow = { id: 'seance-1', enseignement: perimetre('Prof A') };
    await service.listerParSeance('seance-1', enseignantA);
    expect(fake.journalAuditSeance.findMany).toHaveBeenCalledWith({
      where: { seanceId: 'seance-1' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('refuse un autre enseignant (403)', async () => {
    const { fake, service } = monter();
    fake.seanceRow = { id: 'seance-1', enseignement: perimetre('Prof A') };
    await expect(service.listerParSeance('seance-1', enseignantB)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('autorise la scolarité (accès global)', async () => {
    const { fake, service } = monter();
    fake.seanceRow = { id: 'seance-1', enseignement: perimetre('Prof A') };
    await expect(service.listerParSeance('seance-1', scolarite)).resolves.toBeDefined();
  });

  it("reste consultable après suppression de la séance via l'instantané de périmètre", async () => {
    const { fake, service } = monter();
    fake.seanceRow = null;
    await service.enregistrer(entree, enseignantA); // crée une trace avec périmètre
    await service.enregistrer(
      { ...entree, action: ActionAuditSeance.SUPPRESSION },
      enseignantA,
    );
    await expect(service.listerParSeance('seance-1', enseignantA)).resolves.toBeDefined();
  });

  it('refuse la consultation d\'une séance supprimée hors périmètre (403)', async () => {
    const { fake, service } = monter();
    fake.seanceRow = null;
    await service.enregistrer(entree, enseignantA);
    await expect(service.listerParSeance('seance-1', enseignantB)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('renvoie un historique vide pour une séance inconnue du journal', async () => {
    const { service } = monter();
    await expect(service.listerParSeance('inconnue', enseignantA)).resolves.toEqual([]);
  });
});

describe('AuditSeanceService — journal global', () => {
  it("borne le journal de l'enseignant à ses propres séances", async () => {
    const { fake, service } = monter();
    await service.lister(enseignantA);
    expect(fake.journalAuditSeance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { enseignantId: 'Prof A' } }),
    );
  });

  it('borne le journal du responsable à son couple (parcours, cycle)', async () => {
    const { fake, service } = monter();
    await service.lister(responsable);
    expect(fake.journalAuditSeance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { parcours: 'Informatique', cycle: { in: ['LICENCE'] } },
      }),
    );
  });

  it("n'accorde aucun périmètre à un responsable sans parcours", async () => {
    const { fake, service } = monter();
    await service.lister(responsableSansParcours);
    expect(fake.journalAuditSeance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '__aucun__' } }),
    );
  });

  it('donne un accès global à la scolarité', async () => {
    const { fake, service } = monter();
    await service.lister(scolarite);
    expect(fake.journalAuditSeance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it('refuse la consultation sans authentification (403)', async () => {
    const { service } = monter();
    await expect(service.lister(undefined)).rejects.toBeInstanceOf(ForbiddenException);
  });
});

import { ConflictException, ForbiddenException } from '@nestjs/common';
import { EnseignementsService } from './enseignements.service';
import { PermissionsService } from '../permissions/permissions.service';
import { AuditSeanceService } from './audit-seance.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSeanceUseCase } from '../use-cases/create-seance.use-case';
import { GetSuiviUseCase } from '../use-cases/get-suivi.use-case';
import { UpdateSeanceStatusUseCase } from '../use-cases/update-seance-status.use-case';
import { GetTeacherDashboardUseCase } from '../use-cases/get-teacher-dashboard.use-case';
import { SuiviRecalculService } from './suivi-recalcul.service';
import { ActionAuditSeance } from '../domain/audit-seance';
import { StatutSeance } from '../domain/calcul-suivi';
import { AuthContext } from '../../auth/auth-context';
import { Role } from '../../auth/roles.enum';

interface SeanceRow {
  id: string;
  enseignementId: string;
  dateSeance: Date;
  heureDebut: string;
  heureFin: string;
  duree: number;
  contenuEnseigne: string | null;
  statut: string;
  enseignement: {
    id: string;
    enseignantId: string;
    mentionId: string;
    cycle: string;
    parcours: string;
  };
}

class FakePrisma {
  seanceRow: SeanceRow | null = null;
  journal: Record<string, unknown>[] = [];
  deleted: string[] = [];

  readonly seance = {
    findUnique: async ({ where }: { where: { id: string } }) =>
      this.seanceRow && this.seanceRow.id === where.id ? this.seanceRow : null,
    update: async ({ where, data }: { where: { id: string }; data: Partial<SeanceRow> }) => {
      if (!this.seanceRow || this.seanceRow.id !== where.id) throw new Error('introuvable');
      Object.assign(this.seanceRow, data);
      return this.seanceRow;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      this.deleted.push(where.id);
      const row = this.seanceRow;
      this.seanceRow = null;
      return row;
    },
  };

  readonly journalAuditSeance = {
    create: async ({ data }: { data: Record<string, unknown> }) => {
      this.journal.push(data);
      return data;
    },
  };

  $transaction = async (cb: (tx: FakePrisma) => unknown) => cb(this);
}

function monter(statut: string) {
  const fake = new FakePrisma();
  fake.seanceRow = {
    id: 'seance-1',
    enseignementId: 'ens-1',
    dateSeance: new Date('2026-10-17T08:00:00.000Z'),
    heureDebut: '08:00',
    heureFin: '10:00',
    duree: 2,
    contenuEnseigne: 'Cours',
    statut,
    enseignement: {
      id: 'ens-1',
      enseignantId: 'Prof A',
      mentionId: 'Informatique',
      cycle: 'LICENCE',
      parcours: 'Informatique',
    },
  };

  const service = new EnseignementsService(
    fake as unknown as PrismaService,
    {} as unknown as CreateSeanceUseCase,
    {} as unknown as GetSuiviUseCase,
    {} as unknown as UpdateSeanceStatusUseCase,
    { recalculerEtPersister: jest.fn().mockResolvedValue(undefined) } as unknown as SuiviRecalculService,
    {} as unknown as GetTeacherDashboardUseCase,
    new PermissionsService(),
    new AuditSeanceService(fake as unknown as PrismaService, new PermissionsService()),
  );

  return { fake, service };
}

const enseignantResponsable: AuthContext = { userId: 'Prof A', role: Role.ENSEIGNANT };
const autreEnseignant: AuthContext = { userId: 'Prof B', role: Role.ENSEIGNANT };

describe('EnseignementsService — traçabilité des modifications', () => {
  it('journalise une MODIFICATION sur une séance planifiée (champs modifiés seulement)', async () => {
    const { fake, service } = monter(StatutSeance.PLANIFIEE);

    await service.updateSeance(
      'seance-1',
      undefined,
      { heureFin: '09:30' },
      enseignantResponsable,
    );

    expect(fake.journal).toHaveLength(1);
    const trace = fake.journal[0] as Record<string, unknown>;
    expect(trace.action).toBe(ActionAuditSeance.MODIFICATION);
    expect(trace.utilisateurId).toBe('Prof A');
    expect(trace.statutAvant).toBe(StatutSeance.PLANIFIEE);
    expect(trace.statutApres).toBe(StatutSeance.PLANIFIEE);
    expect(trace.valeursAvant).toEqual({ heureFin: '10:00', duree: 2 });
    expect(trace.valeursApres).toEqual({ heureFin: '09:30', duree: 1.5 });
  });

  it('journalise une CORRECTION sur une séance déjà réalisée', async () => {
    const { fake, service } = monter(StatutSeance.REALISEE);

    await service.updateSeance(
      'seance-1',
      undefined,
      { heureFin: '09:30', motif: 'Durée réelle observée' },
      enseignantResponsable,
    );

    expect(fake.journal).toHaveLength(1);
    const trace = fake.journal[0] as Record<string, unknown>;
    expect(trace.action).toBe(ActionAuditSeance.CORRECTION);
    expect(trace.motif).toBe('Durée réelle observée');
    expect(trace.valeursAvant).toEqual({ heureFin: '10:00', duree: 2 });
    expect(trace.valeursApres).toEqual({ heureFin: '09:30', duree: 1.5 });
  });

  it("n'autorise pas un autre enseignant à corriger (403)", async () => {
    const { fake, service } = monter(StatutSeance.REALISEE);

    await expect(
      service.updateSeance('seance-1', undefined, { heureFin: '09:30' }, autreEnseignant),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(fake.journal).toHaveLength(0);
  });
});

describe('EnseignementsService — suppression de séance', () => {
  it('refuse de supprimer une séance réalisée (protection de l’historique)', async () => {
    const { fake, service } = monter(StatutSeance.REALISEE);

    await expect(
      service.removeSeance('seance-1', undefined, enseignantResponsable, 'nettoyage'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(fake.deleted).toHaveLength(0);
    expect(fake.journal).toHaveLength(0);
  });

  it('supprime une séance planifiée en conservant une trace SUPPRESSION', async () => {
    const { fake, service } = monter(StatutSeance.PLANIFIEE);

    const result = await service.removeSeance(
      'seance-1',
      undefined,
      enseignantResponsable,
      'doublon',
    );

    expect(result).toEqual({ deleted: true });
    expect(fake.deleted).toEqual(['seance-1']);
    expect(fake.journal).toHaveLength(1);
    const trace = fake.journal[0] as Record<string, unknown>;
    expect(trace.action).toBe(ActionAuditSeance.SUPPRESSION);
    expect(trace.seanceId).toBe('seance-1');
    expect(trace.motif).toBe('doublon');
    expect(trace.statutAvant).toBe(StatutSeance.PLANIFIEE);
  });
});

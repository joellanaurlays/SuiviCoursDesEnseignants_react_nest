import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PermissionsService } from '../permissions/permissions.service.js';
import { SuiviRecalculService } from '../services/suivi-recalcul.service.js';
import { AuditSeanceService, EntreeAudit } from '../services/audit-seance.service.js';
import { ActionAuditSeance } from '../domain/audit-seance.js';
import { UpdateSeanceStatusUseCase } from './update-seance-status.use-case.js';
import { StatutSeance } from '../domain/calcul-suivi.js';
import { AuthContext } from '../../auth/auth-context.js';
import { Role } from '../../auth/roles.enum.js';

interface SeanceRow {
  id: string;
  enseignementId: string;
  dateSeance: Date;
  heureDebut: string;
  heureFin: string;
  duree: number;
  contenuEnseigne: string | null;
  statut: string;
}

interface EnseignementRow {
  id: string;
  enseignantId: string;
  mentionId: string;
  parcours: string;
  cycle: string;
  volumePrevu: number;
  heuresRealisees: number;
  progression: number;
  etat: string;
  clotureAnticipee: boolean;
}

/**
 * Faux Prisma minimal : gère un enseignement (30 h) et ses séances, plus
 * `$transaction` (appelle simplement le callback avec le client).
 */
class FakePrisma {
  enseignementRow: EnseignementRow = {
    id: 'ens-1',
    enseignantId: 'Prof A',
    mentionId: 'Informatique',
    parcours: 'Informatique',
    cycle: 'LICENCE',
    volumePrevu: 30,
    heuresRealisees: 0,
    progression: 0,
    etat: 'NON_COMMENCE',
    clotureAnticipee: false,
  };

  seances: SeanceRow[] = [];

  readonly seance = {
    findUnique: async ({ where }: { where: { id: string } }) => {
      const seance = this.seances.find((s) => s.id === where.id);
      if (!seance) return null;
      return { ...seance, enseignement: { ...this.enseignementRow } };
    },
    findMany: async ({ where }: { where: Record<string, unknown> }) => {
      const statutFilter = where.statut as { not?: string } | undefined;
      const idFilter = where.id as { not?: string } | undefined;
      return this.seances
        .filter((s) => !statutFilter?.not || s.statut !== statutFilter.not)
        .filter((s) => !idFilter?.not || s.id !== idFilter.not)
        .map((s) => ({ heureDebut: s.heureDebut, heureFin: s.heureFin }));
    },
    update: async ({ where, data }: { where: { id: string }; data: Partial<SeanceRow> }) => {
      const seance = this.seances.find((s) => s.id === where.id);
      if (!seance) throw new Error('seance introuvable');
      Object.assign(seance, data);
      return { ...seance, enseignement: { ...this.enseignementRow } };
    },
  };

  readonly enseignement = {
    findUnique: async ({ where }: { where: { id: string } }) => {
      if (where.id !== this.enseignementRow.id) return null;
      return {
        ...this.enseignementRow,
        seances: this.seances.map((s) => ({ duree: s.duree, statut: s.statut })),
      };
    },
    update: async ({ data }: { data: Partial<EnseignementRow> }) => {
      Object.assign(this.enseignementRow, data);
      return { ...this.enseignementRow };
    },
  };

  $transaction = async (cb: (tx: FakePrisma) => unknown) => cb(this);
}

/** Faux journal d'audit : capture les entrées pour les assertions. */
class FakeAudit {
  entrees: EntreeAudit[] = [];
  enregistrer = async (entree: EntreeAudit) => {
    this.entrees.push(entree);
  };
}

function monter() {
  const fake = new FakePrisma();
  const client = fake as unknown as PrismaService;
  const permissions = new PermissionsService();
  const audit = new FakeAudit();
  const useCase = new UpdateSeanceStatusUseCase(
    client,
    new SuiviRecalculService(client),
    permissions,
    audit as unknown as AuditSeanceService,
  );
  return { fake, useCase, audit };
}

function ajouterSeance(fake: FakePrisma, overrides: Partial<SeanceRow> = {}): SeanceRow {
  const seance: SeanceRow = {
    id: overrides.id ?? 'seance-1',
    enseignementId: 'ens-1',
    dateSeance: overrides.dateSeance ?? new Date('2026-09-01T08:00:00.000Z'),
    heureDebut: overrides.heureDebut ?? '08:00',
    heureFin: overrides.heureFin ?? '10:00',
    duree: overrides.duree ?? 2,
    contenuEnseigne: overrides.contenuEnseigne ?? null,
    statut: overrides.statut ?? StatutSeance.PLANIFIEE,
  };
  fake.seances.push(seance);
  return seance;
}

const enseignantResponsable: AuthContext = { userId: 'Prof A', role: Role.ENSEIGNANT };
const autreEnseignant: AuthContext = { userId: 'Prof B', role: Role.ENSEIGNANT };
const scolarite: AuthContext = { userId: 'sec', role: Role.SCOLARITE };
const admin: AuthContext = { userId: 'admin', role: Role.ADMINISTRATEUR };
const responsable: AuthContext = {
  userId: 'resp',
  role: Role.RESPONSABLE_MENTION,
  cycles: ['LICENCE'],
  parcours: 'Informatique',
};

describe('UpdateSeanceStatusUseCase', () => {
  it('TEST 5 — réalise une séance planifiée, met à jour heures et progression', async () => {
    const { fake, useCase } = monter();
    ajouterSeance(fake);

    const updated = await useCase.execute(
      'seance-1',
      StatutSeance.REALISEE,
      enseignantResponsable,
      { contenuEnseigne: 'Cours réel' },
    );

    expect(updated.statut).toBe(StatutSeance.REALISEE);
    expect(updated.contenuEnseigne).toBe('Cours réel');
    expect(fake.enseignementRow.heuresRealisees).toBe(2);
    expect(fake.enseignementRow.progression).toBeCloseTo(6.67, 2);
    expect(fake.enseignementRow.etat).toBe('EN_COURS');
  });

  it('TEST 6 — annule une séance planifiée sans comptabiliser d’heures', async () => {
    const { fake, useCase } = monter();
    ajouterSeance(fake);

    const updated = await useCase.execute('seance-1', StatutSeance.ANNULEE, enseignantResponsable);

    expect(updated.statut).toBe(StatutSeance.ANNULEE);
    expect(fake.enseignementRow.heuresRealisees).toBe(0);
    expect(fake.enseignementRow.etat).toBe('NON_COMMENCE');
  });

  it('TEST 7 — refuse un autre utilisateur (403) sans modifier la séance', async () => {
    const { fake, useCase } = monter();
    ajouterSeance(fake);

    for (const ctx of [autreEnseignant, scolarite, admin, responsable]) {
      await expect(
        useCase.execute('seance-1', StatutSeance.REALISEE, ctx, { contenuEnseigne: 'x' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    }
    expect(fake.seances[0].statut).toBe(StatutSeance.PLANIFIEE);
  });

  it('refuse l’appel sans contexte authentifié (403)', async () => {
    const { fake, useCase } = monter();
    ajouterSeance(fake);
    await expect(
      useCase.execute('seance-1', StatutSeance.REALISEE, undefined, { contenuEnseigne: 'x' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('TEST 8 — une séance déjà réalisée n’est pas recomptée (idempotent)', async () => {
    const { fake, useCase } = monter();
    ajouterSeance(fake, { statut: StatutSeance.REALISEE, duree: 2, contenuEnseigne: 'Déjà faite' });
    // Le cache doit refléter la séance existante.
    fake.enseignementRow.heuresRealisees = 2;
    fake.enseignementRow.progression = 6.67;
    fake.enseignementRow.etat = 'EN_COURS';

    const updated = await useCase.execute('seance-1', StatutSeance.REALISEE, enseignantResponsable, {
      contenuEnseigne: 'Nouveau contenu',
    });

    expect(updated.statut).toBe(StatutSeance.REALISEE);
    expect(fake.enseignementRow.heuresRealisees).toBe(2);
    expect(fake.seances).toHaveLength(1);
  });

  it('TEST 9 — une séance annulée ne peut plus être réalisée', async () => {
    const { fake, useCase } = monter();
    ajouterSeance(fake, { statut: StatutSeance.ANNULEE });

    await expect(
      useCase.execute('seance-1', StatutSeance.REALISEE, enseignantResponsable, {
        contenuEnseigne: 'x',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('TEST 9 — une seconde annulation est idempotente (pas de nouvelle exécution)', async () => {
    const { fake, useCase } = monter();
    ajouterSeance(fake, { statut: StatutSeance.ANNULEE });
    const updated = await useCase.execute('seance-1', StatutSeance.ANNULEE, enseignantResponsable);
    expect(updated.statut).toBe(StatutSeance.ANNULEE);
    expect(fake.enseignementRow.heuresRealisees).toBe(0);
  });

  it('interdit d’annuler une séance déjà réalisée', async () => {
    const { fake, useCase } = monter();
    ajouterSeance(fake, { statut: StatutSeance.REALISEE, contenuEnseigne: 'fait' });

    await expect(
      useCase.execute('seance-1', StatutSeance.ANNULEE, enseignantResponsable),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('TEST 10 — refuse une réalisation sans contenu', async () => {
    const { fake, useCase } = monter();
    ajouterSeance(fake);

    await expect(
      useCase.execute('seance-1', StatutSeance.REALISEE, enseignantResponsable, { contenuEnseigne: '   ' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(fake.enseignementRow.heuresRealisees).toBe(0);
  });

  it('TEST 10 — refuse des horaires incohérents', async () => {
    const { fake, useCase } = monter();
    ajouterSeance(fake);

    await expect(
      useCase.execute('seance-1', StatutSeance.REALISEE, enseignantResponsable, {
        heureDebut: '12:00',
        heureFin: '10:00',
        contenuEnseigne: 'x',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('TEST 11 — recalcule à partir de toutes les séances réalisées (3h réalisées → 10%)', async () => {
    const { fake, useCase } = monter();
    ajouterSeance(fake, { id: 's1', duree: 1, statut: StatutSeance.REALISEE, contenuEnseigne: 'a', heureDebut: '08:00', heureFin: '09:00' });
    ajouterSeance(fake, { id: 's2', duree: 2, statut: StatutSeance.PLANIFIEE, heureDebut: '10:00', heureFin: '12:00' });

    await useCase.execute('s2', StatutSeance.REALISEE, enseignantResponsable, {
      contenuEnseigne: 'b',
    });

    expect(fake.enseignementRow.heuresRealisees).toBe(3);
    expect(fake.enseignementRow.progression).toBe(10);
    expect(fake.enseignementRow.etat).toBe('EN_COURS');
  });

  it('TEST 10b — refuse un chevauchement lors de la réalisation', async () => {
    const { fake, useCase } = monter();
    ajouterSeance(fake, { id: 's1', statut: StatutSeance.REALISEE, contenuEnseigne: 'a', heureDebut: '08:00', heureFin: '10:00' });
    ajouterSeance(fake, { id: 's2', statut: StatutSeance.PLANIFIEE, heureDebut: '09:00', heureFin: '11:00' });

    await expect(
      useCase.execute('s2', StatutSeance.REALISEE, enseignantResponsable, { contenuEnseigne: 'b' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('renvoie 404 pour une séance inexistante', async () => {
    const { useCase } = monter();
    await expect(
      useCase.execute('inconnue', StatutSeance.REALISEE, enseignantResponsable, { contenuEnseigne: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('journalise la réalisation (PLANIFIEE → REALISEE) avec auteur et valeurs', async () => {
    const { fake, useCase, audit } = monter();
    ajouterSeance(fake);

    await useCase.execute('seance-1', StatutSeance.REALISEE, enseignantResponsable, {
      contenuEnseigne: 'Cours réel',
    });

    expect(audit.entrees).toHaveLength(1);
    expect(audit.entrees[0]).toMatchObject({
      seanceId: 'seance-1',
      action: ActionAuditSeance.REALISATION,
      statutAvant: StatutSeance.PLANIFIEE,
      statutApres: StatutSeance.REALISEE,
    });
    expect(audit.entrees[0].valeursApres?.contenuEnseigne).toBe('Cours réel');
    expect(audit.entrees[0].valeursApres?.statut).toBe(StatutSeance.REALISEE);
  });

  it("journalise l'annulation avec le motif et sans heure comptabilisée", async () => {
    const { fake, useCase, audit } = monter();
    ajouterSeance(fake);

    await useCase.execute('seance-1', StatutSeance.ANNULEE, enseignantResponsable, {
      motif: 'Enseignant absent',
    });

    expect(fake.enseignementRow.heuresRealisees).toBe(0);
    expect(audit.entrees).toHaveLength(1);
    expect(audit.entrees[0]).toMatchObject({
      action: ActionAuditSeance.ANNULATION,
      motif: 'Enseignant absent',
      statutAvant: StatutSeance.PLANIFIEE,
      statutApres: StatutSeance.ANNULEE,
    });
  });

  it("n'écrit AUCUNE trace pour une opération idempotente (aucune nouvelle action)", async () => {
    const { fake, useCase, audit } = monter();
    ajouterSeance(fake, { statut: StatutSeance.ANNULEE });

    await useCase.execute('seance-1', StatutSeance.ANNULEE, enseignantResponsable);

    expect(audit.entrees).toHaveLength(0);
  });

  it("n'écrit AUCUNE trace lorsqu'un autre utilisateur est refusé (403)", async () => {
    const { fake, useCase, audit } = monter();
    ajouterSeance(fake);

    await expect(
      useCase.execute('seance-1', StatutSeance.REALISEE, autreEnseignant, { contenuEnseigne: 'x' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(audit.entrees).toHaveLength(0);
  });
});

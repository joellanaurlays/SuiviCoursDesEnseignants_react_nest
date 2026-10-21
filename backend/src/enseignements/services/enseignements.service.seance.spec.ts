import { vi } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EnseignementsService } from './enseignements.service';
import { PermissionsService } from '../permissions/permissions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSeanceUseCase } from '../use-cases/create-seance.use-case';
import { GetSuiviUseCase } from '../use-cases/get-suivi.use-case';
import { UpdateSeanceStatusUseCase } from '../use-cases/update-seance-status.use-case';
import { GetTeacherDashboardUseCase } from '../use-cases/get-teacher-dashboard.use-case';
import { SuiviRecalculService } from './suivi-recalcul.service';
import { AuditSeanceService } from './audit-seance.service';
import { StatutSeance } from '../domain/calcul-suivi';
import { AuthContext } from '../../auth/auth-context';
import { Role } from '../../auth/roles.enum';

function seancePlanifiee(enseignantId: string) {
  return {
    id: 'seance-1',
    enseignementId: 'ens-1',
    dateSeance: new Date('2026-09-01T08:00:00.000Z'),
    heureDebut: '08:00',
    heureFin: '10:00',
    duree: 2,
    contenuEnseigne: null,
    statut: StatutSeance.PLANIFIEE,
    createdAt: new Date('2026-08-01'),
    updatedAt: new Date('2026-08-01'),
    enseignement: {
      id: 'ens-1',
      matiereId: 'Reseaux',
      enseignantId,
      mentionId: 'Informatique',
      cycle: 'LICENCE',
      parcours: 'Informatique',
    },
  };
}

function monter(seance: unknown) {
  const prisma = {
    seance: { findUnique: vi.fn().mockResolvedValue(seance) },
  };
  const updateSeanceStatusUseCase = { execute: vi.fn().mockResolvedValue({ id: 'seance-1' }) };

  const service = new EnseignementsService(
    prisma as unknown as PrismaService,
    {} as unknown as CreateSeanceUseCase,
    {} as unknown as GetSuiviUseCase,
    updateSeanceStatusUseCase as unknown as UpdateSeanceStatusUseCase,
    {} as unknown as SuiviRecalculService,
    {} as unknown as GetTeacherDashboardUseCase,
    new PermissionsService(),
    {} as unknown as AuditSeanceService,
  );

  return { service, updateSeanceStatusUseCase };
}

const enseignantResponsable: AuthContext = { userId: 'Prof A', role: Role.ENSEIGNANT };
const autreEnseignant: AuthContext = { userId: 'Prof B', role: Role.ENSEIGNANT };
const scolarite: AuthContext = { userId: 'sec', role: Role.SCOLARITE };
const admin: AuthContext = { userId: 'admin', role: Role.ADMINISTRATEUR };
const responsableLicence: AuthContext = {
  userId: 'resp-li-info',
  role: Role.RESPONSABLE_MENTION,
  cycles: ['LICENCE'],
  parcours: 'Informatique',
};

describe('EnseignementsService — détail de séance', () => {
  it('TEST 1 — l’enseignant responsable consulte sa séance et voit les actions', async () => {
    const { service } = monter(seancePlanifiee('Prof A'));

    const detail = await service.getSeanceById('seance-1', enseignantResponsable);

    expect(detail.id).toBe('seance-1');
    expect(detail.peutRealiser).toBe(true);
    expect(detail.peutAnnuler).toBe(true);
  });

  it('TEST 2 — un autre utilisateur autorisé (scolarité) consulte sans actions', async () => {
    const { service } = monter(seancePlanifiee('Prof A'));

    const detail = await service.getSeanceById('seance-1', scolarite);

    expect(detail.peutRealiser).toBe(false);
    expect(detail.peutAnnuler).toBe(false);
  });

  it('TEST 2b — le responsable de parcours consulte dans son périmètre sans actions', async () => {
    const { service } = monter(seancePlanifiee('Prof A'));
    const detail = await service.getSeanceById('seance-1', responsableLicence);
    expect(detail.peutRealiser).toBe(false);
    expect(detail.peutAnnuler).toBe(false);
  });

  it('TEST 3 — un utilisateur non autorisé ne peut pas consulter la séance (403)', async () => {
    const { service } = monter(seancePlanifiee('Prof A'));
    await expect(service.getSeanceById('seance-1', autreEnseignant)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('TEST 2c — l’administrateur consulte mais n’obtient aucune action métier', async () => {
    const { service } = monter(seancePlanifiee('Prof A'));
    const detail = await service.getSeanceById('seance-1', admin);
    expect(detail.peutRealiser).toBe(false);
    expect(detail.peutAnnuler).toBe(false);
  });

  it('retourne 404 si la séance n’existe pas', async () => {
    const { service } = monter(null);
    await expect(service.getSeanceById('inconnue', admin)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('realiserSeance délègue au use-case avec le statut REALISEE', async () => {
    const { service, updateSeanceStatusUseCase } = monter(seancePlanifiee('Prof A'));
    await service.realiserSeance('seance-1', { contenuEnseigne: 'Cours' }, enseignantResponsable);
    expect(updateSeanceStatusUseCase.execute).toHaveBeenCalledWith(
      'seance-1',
      StatutSeance.REALISEE,
      enseignantResponsable,
      { contenuEnseigne: 'Cours' },
    );
  });

  it('annulerSeance délègue au use-case avec le statut ANNULEE', async () => {
    const { service, updateSeanceStatusUseCase } = monter(seancePlanifiee('Prof A'));
    await service.annulerSeance('seance-1', 'Motif', enseignantResponsable);
    expect(updateSeanceStatusUseCase.execute).toHaveBeenCalledWith(
      'seance-1',
      StatutSeance.ANNULEE,
      enseignantResponsable,
      { motif: 'Motif' },
    );
  });
});

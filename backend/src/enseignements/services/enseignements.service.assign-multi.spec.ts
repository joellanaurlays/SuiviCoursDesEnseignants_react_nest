import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnseignementsService } from './enseignements.service.js';
import { PermissionsService } from '../permissions/permissions.service.js';

/**
 * Règle métier 1:N : un enseignant peut être affecté à PLUSIEURS enseignements
 * (éventuellement de cycles/parcours différents) ; un enseignement garde au
 * maximum UN enseignant. Ces tests reproduisent deux affectations successives
 * du même enseignant et vérifient que rien ne les bloque.
 */
const prismaMock = {
  enseignement: { findUnique: vi.fn(), update: vi.fn() },
  user: { findUnique: vi.fn(), findFirst: vi.fn() },
} as unknown as any;

function service(): EnseignantsServiceLike {
  // Le constructeur réel accepte 9 dépendances ; permissionsService est la 7e.
  return new EnseignementsService(
    prismaMock,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    new PermissionsService(),
    {} as any,
    {} as any,
  ) as unknown as EnseignantsServiceLike;
}
type EnseignantsServiceLike = {
  assignTeacher(
    enseignementId: string,
    enseignantId: string,
    context: { role: string; parcours?: string; cycles?: string[]; userId: string },
  ): Promise<void>;
};

const contextResponsable = {
  role: 'RESPONSABLE_MENTION',
  parcours: 'Informatique',
  cycles: ['MASTER'],
  userId: '9',
};

const userComplet = {
  id: 3,
  isActive: true,
  firstName: 'Haingo',
  lastName: 'Rakotoarison',
  role: { name: 'RESPONSABLE_MASTER' },
  cycles: ['MASTER'],
  parcours: 'Informatique',
};

function enseignementDe(cycle: string) {
  return { matiereId: 'Algorithmique', mentionId: 'Informatique', cycle, parcours: 'Informatique' };
}

describe('affectation 1:N — un enseignant, plusieurs enseignements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prismaMock.enseignement.update as any).mockResolvedValue({});
  });

  function simuler(enseignement: unknown, dejaAffecte: string | null) {
    (prismaMock.enseignement.findUnique as any).mockImplementation(({ select }: any) =>
      select?.enseignantId !== undefined && Object.keys(select).length === 1
        ? Promise.resolve({ enseignantId: dejaAffecte })
        : Promise.resolve(enseignement),
    );
    (prismaMock.user.findFirst as any).mockResolvedValue(userComplet);
    (prismaMock.user.findUnique as any).mockResolvedValue(userComplet);
  }

  it('affecte le même enseignant à un premier puis un deuxième enseignement', async () => {
    simuler(enseignementDe('MASTER'), null);
    await service().assignTeacher('ens-1', 'Haingo Rakotoarison', contextResponsable);

    simuler(enseignementDe('MASTER'), null);
    await service().assignTeacher('ens-2', 'Haingo Rakotoarison', contextResponsable);

    const cibles = (prismaMock.enseignement.update as any).mock.calls.map((c: any) => c[0].where.id);
    expect(cibles).toEqual(['ens-1', 'ens-2']);
  });

  it('autorise la seconde affectation même si le cycle déclaré de l’enseignant diffère', async () => {
    simuler(enseignementDe('MASTER'), null);
    await service().assignTeacher('ens-1', 'Haingo Rakotoarison', contextResponsable);

    // Deuxième affectation sur un enseignement LICENCE, par un responsable
    // dont le périmètre couvre les deux cycles : le cycle déclaré de
    // l’enseignant (MASTER) ne doit plus bloquer l’affectation.
    simuler(enseignementDe('LICENCE'), null);
    await service().assignTeacher('ens-2', 'Haingo Rakotoarison', {
      ...contextResponsable,
      cycles: ['MASTER', 'LICENCE'],
    });

    expect((prismaMock.enseignement.update as any).mock.calls.length).toBe(2);
  });

  it('refuse un deuxième enseignant sur un enseignement déjà affecté (max 1/enseignement)', async () => {
    simuler(enseignementDe('MASTER'), 'Autre Professeur');
    await expect(
      service().assignTeacher('ens-1', 'Haingo Rakotoarison', contextResponsable),
    ).rejects.toThrow(ConflictException);
    expect(prismaMock.enseignement.update).not.toHaveBeenCalled();
  });

  it('refuse un enseignant inexistant', async () => {
    simuler(enseignementDe('MASTER'), null);
    (prismaMock.user.findFirst as any).mockResolvedValue(null);
    (prismaMock.user.findUnique as any).mockResolvedValue(null);

    await expect(
      service().assignTeacher('ens-1', 'Inconnu Total', contextResponsable),
    ).rejects.toThrow(NotFoundException);
  });

  it('refuse une affectation hors du périmètre du responsable', async () => {
    simuler(enseignementDe('MASTER'), null);
    await expect(
      service().assignTeacher('ens-1', 'Haingo Rakotoarison', {
        role: 'RESPONSABLE_MENTION',
        parcours: 'Management',
        cycles: ['MASTER'],
        userId: '9',
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});

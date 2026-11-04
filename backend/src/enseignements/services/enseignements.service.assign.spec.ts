import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnseignementsService } from './enseignements.service.js';
import { PermissionsService } from '../permissions/permissions.service.js';

/**
 * Tests ciblés de la correction « enseignant n'existe pas » :
 * l'identifiant transmis par le frontend peut être l'ID numérique du compte
 * User OU le nom affiché « Prénom Nom » — les deux doivent être résolus.
 */
const prismaMock = {
  enseignement: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
  },
} as unknown as any;

function service(): EnseignantsServiceLike {
  // Le constructeur réel accepte 9 dépendances ; seules prisma et
  // permissionsService sont utilisées par assignTeacher.
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
  cycles: ['LICENCE', 'MASTER'],
  userId: '9',
};

const enseignement = {
  matiereId: 'Algorithmique',
  mentionId: 'Informatique',
  cycle: 'MASTER',
  parcours: 'Informatique',
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

describe('assignTeacher — résolution de l\'enseignant (correctif)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prismaMock.enseignement.findUnique as any).mockImplementation(({ select }: any) =>
      select?.enseignantId !== undefined && Object.keys(select).length === 1
        ? Promise.resolve({ enseignantId: null })
        : Promise.resolve(enseignement),
    );
    (prismaMock.enseignement.update as any).mockResolvedValue({});
  });

  it('résout un enseignant par son ID numérique (User.id)', async () => {
    (prismaMock.user.findUnique as any).mockResolvedValue(userComplet);
    (prismaMock.user.findFirst as any).mockResolvedValue(null);

    await service().assignTeacher('ens-1', '3', contextResponsable);

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 3 } }),
    );
    expect(prismaMock.enseignement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { enseignantId: 'Haingo Rakotoarison' },
      }),
    );
  });

  it('résout un enseignant par son nom affiché « Prénom Nom » (forme envoyée par le modal)', async () => {
    (prismaMock.user.findFirst as any).mockResolvedValue(userComplet);

    await service().assignTeacher('ens-1', 'Haingo Rakotoarison', contextResponsable);

    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          firstName: { equals: 'Haingo' },
          lastName: { equals: 'Rakotoarison' },
        }),
      }),
    );
    expect(prismaMock.enseignement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { enseignantId: 'Haingo Rakotoarison' },
      }),
    );
  });

  it('accepte un enseignant qui porte aussi le rôle RESPONSABLE_MENTION', async () => {
    const responsableQuiEnseigne = { ...userComplet, role: { name: 'RESPONSABLE_MASTER' } };
    (prismaMock.user.findFirst as any).mockResolvedValue(responsableQuiEnseigne);

    await service().assignTeacher('ens-1', 'Haingo Rakotoarison', contextResponsable);

    expect(prismaMock.enseignement.update).toHaveBeenCalled();
  });

  it('rejeté un identifiant réellement inexistant', async () => {
    (prismaMock.user.findFirst as any).mockResolvedValue(null);

    await expect(
      service().assignTeacher('ens-1', 'Inconnu Total', contextResponsable),
    ).rejects.toThrow(NotFoundException);
    expect(prismaMock.enseignement.update).not.toHaveBeenCalled();
  });

  it('refuse une affectation hors du périmètre du responsable', async () => {
    await expect(
      service().assignTeacher('ens-1', '3', {
        role: 'RESPONSABLE_MENTION',
        parcours: 'Management',
        cycles: ['LICENCE'],
        userId: '9',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('refuse une seconde affectation quand un autre enseignant est déjà affecté', async () => {
    (prismaMock.user.findFirst as any).mockResolvedValue(userComplet);
    (prismaMock.enseignement.findUnique as any).mockImplementation(({ select }: any) =>
      select?.enseignantId !== undefined && Object.keys(select).length === 1
        ? Promise.resolve({ enseignantId: 'Autre Professeur' })
        : Promise.resolve(enseignement),
    );

    await expect(
      service().assignTeacher('ens-1', 'Haingo Rakotoarison', contextResponsable),
    ).rejects.toThrow(ConflictException);
    expect(prismaMock.enseignement.update).not.toHaveBeenCalled();
  });

  it('est idempotent si le même enseignant est déjà affecté', async () => {
    (prismaMock.user.findFirst as any).mockResolvedValue(userComplet);
    (prismaMock.enseignement.findUnique as any).mockImplementation(({ select }: any) =>
      select?.enseignantId !== undefined && Object.keys(select).length === 1
        ? Promise.resolve({ enseignantId: 'Haingo Rakotoarison' })
        : Promise.resolve(enseignement),
    );

    await service().assignTeacher('ens-1', 'Haingo Rakotoarison', contextResponsable);
    expect(prismaMock.enseignement.update).not.toHaveBeenCalled();
  });
});

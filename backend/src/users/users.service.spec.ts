import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  const roleAdmin = { id: 2, name: 'ADMINISTRATEUR' };
  const storedUser = {
    id: 1,
    email: 'a@b.c',
    password: bcrypt.hashSync('Admin123!', 4),
    firstName: 'A',
    lastName: 'B',
    phone: null,
    isActive: true,
    roleId: 2,
    role: roleAdmin,
  };

  let prisma: Record<string, any>;
  let service: UsersService;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      role: { findUnique: vi.fn() },
    };
    service = new UsersService(prisma as never);
  });

  describe('create', () => {
    it('email déjà pris → Conflict', async () => {
      prisma.user.findUnique.mockResolvedValue(storedUser);
      await expect(
        service.create({
          email: 'a@b.c',
          password: 'Test123!',
          firstName: 'A',
          lastName: 'B',
          roleId: 2,
        } as never),
      ).rejects.toThrow(ConflictException);
    });

    it('rôle inexistant → BadRequest', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.role.findUnique.mockResolvedValue(null);
      await expect(
        service.create({
          email: 'new@b.c',
          password: 'Test123!',
          firstName: 'A',
          lastName: 'B',
          roleId: 99,
        } as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('utilisateur créé sans mot de passe en clair dans la réponse', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.role.findUnique.mockResolvedValue(roleAdmin);
      prisma.user.create.mockImplementation(({ data }: { data: Record<string, unknown> }) => {
        expect(data.password).not.toBe('Test123!');
        return Promise.resolve({ ...storedUser, ...data, role: roleAdmin });
      });

      const created = await service.create({
        email: 'new@b.c',
        password: 'Test123!',
        firstName: 'A',
        lastName: 'B',
        roleId: 2,
      } as never);

      expect(created).not.toHaveProperty('password');
      expect(created).toMatchObject({ email: 'new@b.c', role: 'ADMINISTRATEUR' });
    });
  });

  describe('findAll', () => {
    it('pagination bornée et meta calculée', async () => {
      prisma.user.findMany.mockResolvedValue([storedUser]);
      prisma.user.count.mockResolvedValue(25);

      const result = await service.findAll({ page: 3, limit: 1000 });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 200, take: 100 }),
      );
      expect(result.meta).toEqual({ total: 25, page: 3, limit: 100, totalPages: 1 });
      expect(result.data[0]).not.toHaveProperty('password');
    });

    it('filtres search + rôle + isActive transmis à Prisma', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll({ search: 'rak', role: 'ENSEIGNANT', isActive: 'true', page: 1, limit: 10 });

      const args = prisma.user.findMany.mock.calls[0][0];
      expect(args.where).toEqual({
        OR: [
          { email: { contains: 'rak', mode: 'insensitive' } },
          { firstName: { contains: 'rak', mode: 'insensitive' } },
          { lastName: { contains: 'rak', mode: 'insensitive' } },
        ],
        role: { name: 'ENSEIGNANT' },
        isActive: true,
      });
    });
  });

  describe('changePassword', () => {
    it('mot de passe actuel incorrect → Unauthorized', async () => {
      prisma.user.findUnique.mockResolvedValue(storedUser);
      await expect(
        service.changePassword(1, { currentPassword: 'faux', newPassword: 'Neuf123!' } as never),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('nouveau mot de passe identique à l\'ancien → BadRequest', async () => {
      prisma.user.findUnique.mockResolvedValue(storedUser);
      await expect(
        service.changePassword(1, { currentPassword: 'Admin123!', newPassword: 'Admin123!' } as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('changement validé → hash mis à jour', async () => {
      prisma.user.findUnique.mockResolvedValue(storedUser);
      prisma.user.update.mockResolvedValue(storedUser);

      const result = await service.changePassword(1, {
        currentPassword: 'Admin123!',
        newPassword: 'Neuf123!',
      } as never);

      expect(result).toEqual({ message: 'Mot de passe mis à jour avec succès.' });
      const data = prisma.user.update.mock.calls[0][0].data;
      expect(data.password).not.toBe('Neuf123!');
      expect(bcrypt.compareSync('Neuf123!', data.password)).toBe(true);
    });
  });
});

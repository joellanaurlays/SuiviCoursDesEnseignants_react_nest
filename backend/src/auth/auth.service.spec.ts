import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service.js';

describe('AuthService.login', () => {
  const hashed = bcrypt.hashSync('Admin123!', 4);
  let usersService: { findByEmail: ReturnType<typeof vi.fn> };
  let jwtService: { signAsync: ReturnType<typeof vi.fn> };
  let service: AuthService;

  const user = {
    id: 1,
    email: 'admin@emit.mg',
    password: hashed,
    firstName: 'Admin',
    lastName: 'EMIT',
    phone: null,
    isActive: true,
    mentionId: null,
    cycles: [],
    parcours: null,
    role: { name: 'ADMINISTRATEUR' },
  };

  beforeEach(() => {
    usersService = { findByEmail: vi.fn() };
    jwtService = { signAsync: vi.fn().mockResolvedValue('jwt.token.here') };
    service = new AuthService(usersService as never, jwtService as never);
  });

  it('login valide → token + user sans mot de passe, claims de périmètre inclus', async () => {
    usersService.findByEmail.mockResolvedValue(user);

    const result = await service.login({ email: 'admin@emit.mg', password: 'Admin123!' });

    expect(result.accessToken).toBe('jwt.token.here');
    expect(result.user).toEqual({
      id: 1,
      email: 'admin@emit.mg',
      firstName: 'Admin',
      lastName: 'EMIT',
      phone: null,
      role: 'ADMINISTRATEUR',
    });
    const payload = jwtService.signAsync.mock.calls[0][0];
    expect(payload).toMatchObject({
      sub: 1,
      email: 'admin@emit.mg',
      role: 'ADMINISTRATEUR',
      cycles: [],
    });
  });

  it('email inconnu → 401', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    await expect(service.login({ email: 'x@y.z', password: 'whatever' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('compte désactivé → 401', async () => {
    usersService.findByEmail.mockResolvedValue({ ...user, isActive: false });
    await expect(
      service.login({ email: 'admin@emit.mg', password: 'Admin123!' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('mot de passe erroné → 401', async () => {
    usersService.findByEmail.mockResolvedValue(user);
    await expect(
      service.login({ email: 'admin@emit.mg', password: 'mauvais' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});

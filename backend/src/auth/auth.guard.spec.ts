import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthGuard } from './auth.guard.js';
import { Role } from './roles.enum.js';
import { IS_PUBLIC_KEY } from './decorators/public.decorator.js';
import { ROLES_KEY } from './roles.decorator.js';

function makeContext(headers: Record<string, string | undefined>): { ctx: ExecutionContext; request: Record<string, unknown> } {
  const request: Record<string, unknown> = { headers };
  return {
    request,
    ctx: {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as unknown as ExecutionContext,
  };
}

describe('AuthGuard dual-mode', () => {
  let jwtVerify: ReturnType<typeof vi.fn>;
  let reflectorGet: ReturnType<typeof vi.fn>;
  let guard: AuthGuard;
  let metadata: Record<string, unknown>;

  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('AUTH_ALLOW_HEADER_IDENTITY', 'true');
    jwtVerify = vi.fn();
    reflectorGet = vi.fn((key: string) => metadata[key]);
    metadata = {};
    guard = new AuthGuard(
      { getAllAndOverride: reflectorGet } as never,
      { verify: jwtVerify } as never,
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('@Public → accessible sans identité', () => {
    metadata[IS_PUBLIC_KEY] = true;
    const { ctx } = makeContext({});
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('Bearer valide : CHEF_SCOLARITE est mappé vers SCOLARITE', () => {
    jwtVerify.mockReturnValue({ sub: 7, email: 'a@b.c', role: 'CHEF_SCOLARITE' });
    const { ctx, request } = makeContext({ authorization: 'Bearer token-ok' });
    expect(guard.canActivate(ctx)).toBe(true);
    expect(request.authContext).toEqual({ userId: '7', role: Role.SCOLARITE });
    expect(request.user).toEqual({ id: 7, email: 'a@b.c', role: 'CHEF_SCOLARITE' });
  });

  it('Bearer RESPONSABLE_LICENCE : périmètre reconstruit depuis les claims', () => {
    jwtVerify.mockReturnValue({
      sub: 3,
      email: 'r@b.c',
      role: 'RESPONSABLE_LICENCE',
      mentionId: 'INFORMATIQUE',
      cycles: ['licence'],
      parcours: 'Informatique',
    });
    const { ctx, request } = makeContext({ authorization: 'Bearer resp' });
    guard.canActivate(ctx);
    expect(request.authContext).toEqual({
      userId: '3',
      role: Role.RESPONSABLE_MENTION,
      mentionId: 'INFORMATIQUE',
      cycles: ['LICENCE'],
      parcours: 'Informatique',
    });
  });

  it('Bearer RESPONSABLE sans parcours → 401', () => {
    jwtVerify.mockReturnValue({ sub: 3, role: 'RESPONSABLE_MASTER', cycles: ['MASTER'] });
    const { ctx } = makeContext({ authorization: 'Bearer incomplet' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('Bearer RESPONSABLE sans mention → 401', () => {
    jwtVerify.mockReturnValue({
      sub: 3, role: 'RESPONSABLE_LICENCE',
      cycles: ['LICENCE'], parcours: 'Informatique',
    });
    const { ctx } = makeContext({ authorization: 'Bearer resp' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('Headers RESPONSABLE sans mention → 401', () => {
    const { ctx } = makeContext({
      'x-user-id': '3',
      'x-user-role': 'RESPONSABLE_MENTION',
      'x-user-cycle': 'LICENCE',
      'x-user-parcours': 'Informatique',
    });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
  it('Bearer invalide ou expiré → 401', () => {
    jwtVerify.mockImplementation(() => {
      throw new Error('jwt expired');
    });
    const { ctx } = makeContext({ authorization: 'Bearer mauvais', 'x-user-id': '1', 'x-user-role': 'SCOLARITE' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('Sans Bearer : fallback headers identique à l\'existant', () => {
    const { ctx, request } = makeContext({
      'x-user-id': 'Prof A',
      'x-user-role': 'ENSEIGNANT',
    });
    expect(guard.canActivate(ctx)).toBe(true);
    expect(request.authContext).toEqual({ userId: 'Prof A', role: Role.ENSEIGNANT });
  });

  it('Sans Bearer ni headers → 401', () => {
    const { ctx } = makeContext({});
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
  it('Production : headers SCOLARITE sans Bearer -> 401', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { ctx } = makeContext({
      'x-user-id': '1',
      'x-user-role': 'SCOLARITE',
    });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('@Roles non satisfait (mode JWT) → 403', () => {
    jwtVerify.mockReturnValue({ sub: 9, email: 'p@b.c', role: 'ENSEIGNANT' });
    metadata[ROLES_KEY] = [Role.SCOLARITE, Role.ADMINISTRATEUR];
    const { ctx } = makeContext({ authorization: 'Bearer prof' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('@Roles non satisfait (mode headers) → 403', () => {
    metadata[ROLES_KEY] = [Role.SCOLARITE];
    const { ctx } = makeContext({ 'x-user-id': '1', 'x-user-role': 'ADMINISTRATEUR' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('Rôle du token inconnu → 401', () => {
    jwtVerify.mockReturnValue({ sub: 1, role: 'FANTOME' });
    const { ctx } = makeContext({ authorization: 'Bearer x' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});

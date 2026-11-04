import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { AuthContext, AUTH_HEADERS } from './auth-context.js';
import { Role } from './roles.enum.js';
import { ROLES_KEY } from './roles.decorator.js';
import { IS_PUBLIC_KEY } from './decorators/public.decorator.js';
import { toBackendRole } from './role-mapping.js';

interface JwtClaims {
  sub: number;
  email: string;
  role: string;
  mentionId?: string;
  cycles?: string[];
  parcours?: string;
}

/**
 * Garde global dual-mode :
 * 1. Si un `Authorization: Bearer <jwt>` est présent, l'identité provient du
 *    token (rôle + périmètre responsable de mention portés par les claims).
 * 2. Sinon, on retombe sur les headers d'identité (x-user-id, x-user-role, …)
 *    utilisés par les modules non encore migrés vers l'authentification JWT.
 * Dans les deux cas, un `AuthContext` est posé sur la requête et les rôles
 * requis par @Roles(...) sont vérifiés de la même façon.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authContext = this.buildAuthContext(request);

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(authContext.role)) {
      throw new ForbiddenException(
        `Le rôle ${authContext.role} n'est pas autorisé pour cette opération`,
      );
    }

    request.authContext = authContext;
    return true;
  }

  private buildAuthContext(request: { headers: Record<string, string | undefined> }): AuthContext {
    const authorization = request.headers['authorization'];

    // Si Authorization est présent, il doit obligatoirement contenir un Bearer JWT.
    // Un JWT invalide ne doit jamais déclencher un fallback vers les headers.
    if (authorization !== undefined) {
      if (!authorization.startsWith('Bearer ')) {
        throw new UnauthorizedException('En-tête Authorization invalide.');
      }

      const token = authorization.slice('Bearer '.length).trim();

      if (!token) {
        throw new UnauthorizedException('Jeton Bearer manquant.');
      }

      return this.contextFromJwt(token, request);
    }

    // Les headers d'identité ne sont acceptés qu'avec une activation explicite
    // en environnement non-production.
    const allowHeaderIdentity =
      process.env.NODE_ENV !== 'production' &&
      process.env.AUTH_ALLOW_HEADER_IDENTITY === 'true';

    if (!allowHeaderIdentity) {
      throw new UnauthorizedException('Authentification Bearer requise.');
    }

    return this.contextFromHeaders(request.headers);
  }

  private contextFromJwt(
    token: string,
    request: Record<string, unknown>,
  ): AuthContext {
    let claims: JwtClaims;
    try {
      claims = this.jwtService.verify<JwtClaims>(token);
    } catch {
      throw new UnauthorizedException('Jeton invalide ou expiré.');
    }

    const role = toBackendRole(claims.role);
    if (!role) {
      throw new UnauthorizedException(`Rôle invalide: ${claims.role}`);
    }

    const authContext: AuthContext = { userId: String(claims.sub), role };
    if (claims.mentionId) {
      authContext.mentionId = claims.mentionId;
    }

    if (role === Role.RESPONSABLE_MENTION) {
      authContext.cycles = (claims.cycles ?? []).map((c) => c.toUpperCase());
      authContext.parcours = claims.parcours ?? '';
      if (!authContext.mentionId || authContext.cycles.length === 0 || !authContext.parcours) {
        throw new UnauthorizedException(
          'Le périmètre (mention, cycles et parcours) est requis pour un responsable de mention.',
        );
      }
    }

    // Compat avec les contrôleurs lisant request.user (id numérique, RoleName brut).
    request.user = { id: claims.sub, email: claims.email, role: claims.role };
    return authContext;
  }

  private contextFromHeaders(headers: Record<string, string | undefined>): AuthContext {
    const userId = headers[AUTH_HEADERS.userId] ?? '';
    const rawRole = headers[AUTH_HEADERS.role] ?? '';

    if (!userId.trim() || !rawRole.trim()) {
      throw new UnauthorizedException(
        `Identité requise (headers ${AUTH_HEADERS.userId} et ${AUTH_HEADERS.role})`,
      );
    }

    if (!(rawRole in Role)) {
      throw new UnauthorizedException(`Rôle invalide: ${rawRole}`);
    }

    const role = rawRole as Role;
    const authContext: AuthContext = {
      userId: userId.trim(),
      role,
    };

    if (role === Role.RESPONSABLE_MENTION) {
      // Responsable de parcours : son périmètre est un couple (cycle, parcours).
      // Le parcours n'est pas unique à lui seul (Licence Informatique et
      // Master Informatique partagent « Informatique »), le cycle est donc
      // obligatoire pour interdire toute fuite entre les deux cycles.
      const cycles = (headers[AUTH_HEADERS.cycles] ?? '')
        .split(',')
        .map((c) => c.trim().toUpperCase())
        .filter((c) => c.length > 0);
      if (cycles.length === 0) {
        throw new UnauthorizedException(
          `Header ${AUTH_HEADERS.cycles} requis pour le rôle RESPONSABLE_MENTION`,
        );
      }
      authContext.cycles = cycles;

      const parcours = (headers[AUTH_HEADERS.parcours] ?? '').trim();
      if (!parcours) {
        throw new UnauthorizedException(
          `Header ${AUTH_HEADERS.parcours} requis pour le rôle RESPONSABLE_MENTION`,
        );
      }
      authContext.parcours = parcours;
    }

    const mentionId = (headers[AUTH_HEADERS.mentionId] ?? '').trim();
    if (mentionId) {
      authContext.mentionId = mentionId;
    }

    if (role === Role.RESPONSABLE_MENTION && !authContext.mentionId) {
      throw new UnauthorizedException(
        `Header ${AUTH_HEADERS.mentionId} requis pour le rôle RESPONSABLE_MENTION`,
      );
    }

    return authContext;
  }
}

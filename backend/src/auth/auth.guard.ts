import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthContext, AUTH_HEADERS } from './auth-context';
import { Role } from './roles.enum';
import { ROLES_KEY } from './roles.decorator';

/**
 * Construit le contexte utilisateur à partir des headers d'identité
 * (x-user-id, x-user-role, x-user-mention, x-user-cycle) puis vérifie
 * le rôle autorisé pour la route via @Roles(...).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const headers = request.headers as Record<string, string | undefined>;

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

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(role)) {
      throw new ForbiddenException(
        `Le rôle ${role} n'est pas autorisé pour cette opération`,
      );
    }

    request.authContext = authContext;
    return true;
  }
}
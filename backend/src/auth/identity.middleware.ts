import { NextFunction, Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AuthContext, AUTH_HEADERS } from './auth-context.js';
import { Role } from './roles.enum.js';
import { toBackendRole } from './role-mapping.js';

interface JwtClaims {
  sub: number;
  email: string;
  role: string;
  mentionId?: string;
  cycles?: string[];
  parcours?: string;
}

function unauthorized(res: Response, message: string): void {
  res.status(401).json({ statusCode: 401, message });
}

/**
 * Les routers Express du module emploi du temps (src/controllers/api.router.ts)
 * sont montés hors du pipeline Nest : le AuthGuard global (APP_GUARD) ne
 * s'applique pas à eux. Ce middleware reproduit exactement le même contrôle
 * dual-mode (Bearer JWT, sinon headers x-user-*) pour que ces routes exigent
 * la même identité que le reste de l'API.
 */
export function createIdentityMiddleware(jwtService: JwtService) {
  return function identityMiddleware(req: Request, res: Response, next: NextFunction): void {
    const authorization = req.headers.authorization;

    if (authorization) {
      if (!authorization.startsWith('Bearer ')) {
        unauthorized(res, 'En-tête Authorization invalide.');
        return;
      }
      let claims: JwtClaims;
      try {
        claims = jwtService.verify<JwtClaims>(authorization.slice('Bearer '.length).trim());
      } catch {
        unauthorized(res, 'Jeton invalide ou expiré.');
        return;
      }

      const role = toBackendRole(claims.role);
      if (!role) {
        unauthorized(res, `Rôle invalide: ${claims.role}`);
        return;
      }

      const authContext: AuthContext = { userId: String(claims.sub), role };
      const mentionId = (claims.mentionId ?? '').trim();
      if (mentionId) authContext.mentionId = mentionId;
      if (role === Role.RESPONSABLE_MENTION) {
        authContext.cycles = (claims.cycles ?? []).map((c) => c.toUpperCase());
        authContext.parcours = claims.parcours ?? '';
        if (!authContext.mentionId || authContext.cycles.length === 0 || !authContext.parcours.trim()) {
          unauthorized(res, 'Périmètre responsable incomplet.');
          return;
        }
        // Synchronisation des en-têtes HTTP avec les claims JWT pour cohérence.
        // Les routes /exams utilisent le middleware Express hors pipeline Nest qui
        // peut basculer vers le chemin des en-têtes selon les circonstances.
        // En alignant les en-têtes avec les claims JWT, on s'assure que l'identité
        // est cohérente quel que soit le chemin d'authentification utilisé.
        if (claims.parcours) {
          req.headers[AUTH_HEADERS.parcours] = claims.parcours;
        }
        if (claims.cycles && claims.cycles.length > 0) {
          req.headers[AUTH_HEADERS.cycles] = claims.cycles
            .map((c) => c.toUpperCase())
            .filter((c) => c.length > 0)
            .join(',');
        }
      }

      Object.assign(req, {
        user: { id: claims.sub, email: claims.email, role: claims.role },
        authContext,
      });
      next();
      return;
    }

    const allowHeaderIdentity =
      process.env.NODE_ENV !== 'production' &&
      process.env.AUTH_ALLOW_HEADER_IDENTITY === 'true';

    if (!allowHeaderIdentity) {
      unauthorized(res, 'Authentification Bearer requise.');
      return;
    }

    const userId = (req.headers[AUTH_HEADERS.userId] ?? '').toString().trim();
    const rawRole = (req.headers[AUTH_HEADERS.role] ?? '').toString().trim();
    if (!userId || !rawRole || !(rawRole in Role)) {
      unauthorized(res, `Identité requise (Bearer JWT ou headers ${AUTH_HEADERS.userId} et ${AUTH_HEADERS.role})`);
      return;
    }

    const authContext: AuthContext = { userId, role: rawRole as Role };
    const mentionId = (req.headers[AUTH_HEADERS.mentionId] ?? '').toString().trim();
    if (mentionId) authContext.mentionId = mentionId;
    if (authContext.role === Role.RESPONSABLE_MENTION) {
      authContext.cycles = (req.headers[AUTH_HEADERS.cycles] ?? '').toString()
        .split(',')
        .map((c) => c.trim().toUpperCase())
        .filter((c) => c.length > 0);
      authContext.parcours = (req.headers[AUTH_HEADERS.parcours] ?? '').toString().trim();
      if (!authContext.mentionId || authContext.cycles.length === 0 || !authContext.parcours) {
        unauthorized(res, 'Périmètre responsable incomplet.');
        return;
      }
    }

    Object.assign(req, { authContext });
    next();
  };
}

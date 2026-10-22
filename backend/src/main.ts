import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module.js';
import { createIdentityMiddleware } from './auth/identity.middleware.js';
import { apiRouter } from './controllers/api.router.js';
import { bootstrapPlanningDataStore } from './database/bootstrap-planning.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Routers Express du module emploi du temps (Membre 5) : montés sous /api
  // avant le routeur Nest. Seuls leurs chemins sont interceptés (les routes
  // Nest /api/auth, /api/users, /api/exams… passent au guard global). Le
  // AuthGuard APP_GUARD ne s'applique pas aux routers Express, d'où le
  // middleware d'identité dual-mode (Bearer JWT ou headers x-user-*).
  const PLANNING_PATHS = /^\/(rooms|planning|conflicts|constraints|teachings|health)(\/|$)/;
  const identity = createIdentityMiddleware(app.get(JwtService));
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    // Health-check public : le lanceur frontend l'utilise pour réutiliser le
    // backend déjà démarré au lieu de lancer une seconde instance.
    if (req.path === '/health') {
      apiRouter(req, res, next);
      return;
    }
    if (!PLANNING_PATHS.test(req.path)) {
      next();
      return;
    }
    identity(req, res, () => apiRouter(req, res, next));
  });

  try {
    await bootstrapPlanningDataStore();
  } catch (error) {
    Logger.warn(
      `Initialisation du module planning échouée : ${error instanceof Error ? error.message : String(error)}`,
      'Bootstrap',
    );
  }

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
}
await bootstrap();

import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthGuard } from '../auth/auth.guard.js';
import { ExamsController } from './exams.controller.js';
import { ExamsService } from './exams.service.js';

const TOKENS = {
  administrator: 'test-administrator-token',
  chefScolarite: 'test-chef-scolarite-token',
  teacher: 'test-teacher-token',
};

const examId = '8f5b3d42-3a77-4a1f-9b1c-6e0f7c19d842';
const sessionId = 'bf2c8348-d886-4bd2-a5bb-73b38fb7f1f1';
const alertId = '09f19258-2256-4617-a8b8-576fd29c0223';

describe('ExamsController permissions (HTTP)', () => {
  let app: INestApplication<App>;
  const service = {
    findSessions: vi.fn().mockResolvedValue([]),
    createSession: vi.fn().mockResolvedValue({ id: sessionId }),
    cloturerSession: vi.fn().mockResolvedValue({ id: sessionId, estCloturee: true }),
    findExamens: vi.fn().mockResolvedValue([]),
    createExamen: vi.fn().mockResolvedValue({ id: examId }),
    changerStatut: vi.fn().mockResolvedValue({ id: examId, statut: 'TERMINE' }),
    marquerNotesRemises: vi.fn().mockResolvedValue({ id: examId, notesRemises: true }),
    findAlertes: vi.fn().mockResolvedValue([]),
    createAlerte: vi.fn().mockResolvedValue({ id: alertId }),
    marquerLue: vi.fn().mockResolvedValue({ id: alertId, estLue: true }),
    marquerTraitee: vi.fn().mockResolvedValue({ id: alertId, estTraitee: true }),
  };

  beforeAll(async () => {
    const jwtService = {
      verify: vi.fn((token: string) => {
        const rolesByToken: Record<string, string> = {
          [TOKENS.administrator]: 'ADMINISTRATEUR',
          [TOKENS.chefScolarite]: 'CHEF_SCOLARITE',
          [TOKENS.teacher]: 'ENSEIGNANT',
        };
        const role = rolesByToken[token];
        if (!role) throw new Error('Invalid test token');
        return { sub: 1, email: 'm6-test@emit.mg', role };
      }),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [ExamsController],
      providers: [
        { provide: ExamsService, useValue: service },
        { provide: JwtService, useValue: jwtService },
        { provide: APP_GUARD, useClass: AuthGuard },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  beforeEach(() => {
    Object.values(service).forEach((method) => method.mockClear());
  });

  afterAll(async () => {
    await app.close();
  });

  const authenticated = (token: string) => `Bearer ${token}`;

  it.each([TOKENS.administrator, TOKENS.chefScolarite])(
    'autorise la lecture des sessions, examens et alertes (%s)',
    async (token) => {
      const auth = authenticated(token);
      await request(app.getHttpServer()).get('/api/exams/sessions').set('Authorization', auth).expect(200);
      await request(app.getHttpServer()).get('/api/exams').set('Authorization', auth).expect(200);
      await request(app.getHttpServer()).get('/api/exams/alertes/all').set('Authorization', auth).expect(200);
    },
  );

  it('refuse par HTTP 401 les appels M6 sans authentification', async () => {
    await request(app.getHttpServer()).get('/api/exams/sessions').expect(401);
  });

  it.each([TOKENS.administrator, TOKENS.teacher])(
    'refuse directement toutes les écritures M6 pour le rôle non autorisé (%s)',
    async (token) => {
      const auth = authenticated(token);
      const responses = await Promise.all([
        request(app.getHttpServer()).post('/api/exams/sessions').set('Authorization', auth).send({}),
        request(app.getHttpServer()).patch(`/api/exams/sessions/${sessionId}/cloturer`).set('Authorization', auth),
        request(app.getHttpServer()).post('/api/exams').set('Authorization', auth).send({}),
        request(app.getHttpServer()).patch(`/api/exams/${examId}/statut`).set('Authorization', auth).send({ statut: 'TERMINE' }),
        request(app.getHttpServer()).patch(`/api/exams/${examId}/notes-remises`).set('Authorization', auth),
        request(app.getHttpServer()).post('/api/exams/alertes').set('Authorization', auth).send({}),
        request(app.getHttpServer()).patch(`/api/exams/alertes/${alertId}/lue`).set('Authorization', auth),
        request(app.getHttpServer()).patch(`/api/exams/alertes/${alertId}/traitee`).set('Authorization', auth),
      ]);

      expect(responses.map((response) => response.status)).toEqual(Array(8).fill(403));
      Object.values(service).forEach((method) => expect(method).not.toHaveBeenCalled());
    },
  );

  it('mappe CHEF_SCOLARITE vers SCOLARITE et autorise la modification du statut', async () => {
    await request(app.getHttpServer())
      .patch(`/api/exams/${examId}/statut`)
      .set('Authorization', authenticated(TOKENS.chefScolarite))
      .send({ statut: 'TERMINE' })
      .expect(200);

    expect(service.changerStatut).toHaveBeenCalledWith(examId, 'TERMINE');
  });

  it('autorise les opérations de gestion existantes pour CHEF_SCOLARITE', async () => {
    const auth = authenticated(TOKENS.chefScolarite);
    await request(app.getHttpServer()).post('/api/exams/sessions').set('Authorization', auth).send({}).expect(201);
    await request(app.getHttpServer()).patch(`/api/exams/sessions/${sessionId}/cloturer`).set('Authorization', auth).expect(200);
    await request(app.getHttpServer()).post('/api/exams').set('Authorization', auth).send({}).expect(201);
    await request(app.getHttpServer()).patch(`/api/exams/${examId}/notes-remises`).set('Authorization', auth).expect(200);
    await request(app.getHttpServer()).post('/api/exams/alertes').set('Authorization', auth).send({}).expect(201);
    await request(app.getHttpServer()).patch(`/api/exams/alertes/${alertId}/lue`).set('Authorization', auth).expect(200);
    await request(app.getHttpServer()).patch(`/api/exams/alertes/${alertId}/traitee`).set('Authorization', auth).expect(200);

    expect(service.createSession).toHaveBeenCalledOnce();
    expect(service.cloturerSession).toHaveBeenCalledWith(sessionId);
    expect(service.createExamen).toHaveBeenCalledOnce();
    expect(service.marquerNotesRemises).toHaveBeenCalledWith(examId);
    expect(service.createAlerte).toHaveBeenCalledOnce();
    expect(service.marquerLue).toHaveBeenCalledWith(alertId);
    expect(service.marquerTraitee).toHaveBeenCalledWith(alertId);
  });
});

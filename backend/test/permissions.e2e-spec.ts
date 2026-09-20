import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';

describe('Permissions par rôle (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let enseignantToken: string;
  let enseignantEmail: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Connexion avec le compte admin seedé
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@emit.mg', password: '12345678' });
    adminToken = adminLogin.body.accessToken;

    // Création d'un enseignant de test dédié à cette suite (email unique)
    enseignantEmail = `test.enseignant.${Date.now()}@emit.mg`;
    const rolesResponse = await request(app.getHttpServer())
      .get('/roles')
      .set('Authorization', `Bearer ${adminToken}`);
    const enseignantRole = rolesResponse.body.find((r: { name: string }) => r.name === 'ENSEIGNANT');

    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: enseignantEmail,
        password: 'Test123!',
        firstName: 'Test',
        lastName: 'Enseignant',
        roleId: enseignantRole.id,
      });

    const enseignantLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: enseignantEmail, password: 'Test123!' });
    enseignantToken = enseignantLogin.body.accessToken;
  });

  afterAll(async () => {
    // Nettoyage minimal : désactivation du compte de test (pas de suppression
    // dans le périmètre T02 — la suppression physique n'est pas prévue).
    await request(app.getHttpServer())
      .patch(`/users/${(await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: enseignantEmail, password: 'Test123!' })
      ).body.user.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    await app.close();
  });

  describe('Accès non authentifié', () => {
    it('GET /users sans token → 401', () => {
      return request(app.getHttpServer()).get('/users').expect(401);
    });

    it('GET /auth/profile sans token → 401', () => {
      return request(app.getHttpServer()).get('/auth/profile').expect(401);
    });
  });

  describe('Accès administrateur (rôle autorisé)', () => {
    it('GET /users avec token admin → 200', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('GET /roles avec token admin → 200', () => {
      return request(app.getHttpServer())
        .get('/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Accès enseignant (rôle non autorisé pour la gestion des comptes)', () => {
    it('GET /users avec token enseignant → 403', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${enseignantToken}`)
        .expect(403);
    });

    it('POST /users avec token enseignant → 403', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${enseignantToken}`)
        .send({
          email: 'hack@emit.mg',
          password: 'Test123!',
          firstName: 'X',
          lastName: 'Y',
          roleId: 1,
        })
        .expect(403);
    });

    it('GET /users/me avec token enseignant → 200 (accès à son propre profil autorisé)', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${enseignantToken}`)
        .expect(200);
    });
  });

  describe('Token invalide', () => {
    it('GET /users/me avec token invalide → 401', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', 'Bearer token.invalide.ici')
        .expect(401);
    });
  });
});
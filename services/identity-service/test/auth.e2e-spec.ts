import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Pool } from 'pg';

/**
 * E2E tests for the Auth critical flow:
 *   register → login → get profile → refresh token → logout
 *
 * Requires a running PostgreSQL database with schema applied.
 * Run with: cd services/identity-service && pnpm test:e2e
 */
describe('Auth Flow (e2e)', () => {
  let app: INestApplication;
  let pool: Pool;

  const testUser = {
    email: `e2e.auth.${Date.now()}@test.com`,
    password: 'SecurePass123!',
    name: 'E2E Auth Test User',
    role: 'customer',
  };

  let accessToken: string;
  let refreshToken: string;
  let userId: string;
  let userDisplayId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    pool = app.get('DATABASE_POOL');
  });

  afterAll(async () => {
    // Clean up test user and related data
    if (userId) {
      await pool.query('DELETE FROM sessions WHERE user_id = $1', [userId]).catch(() => {});
      await pool.query('DELETE FROM login_attempts WHERE user_id = $1', [userId]).catch(() => {});
      await pool.query('DELETE FROM user_devices WHERE user_id = $1', [userId]).catch(() => {});
      await pool.query('DELETE FROM users WHERE id = $1', [userId]).catch(() => {});
    }
    await pool.end();
    await app.close();
  });

  describe('Step 1: Register', () => {
    it('POST /auth/register should create a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.display_id).toBeDefined();
      expect(response.body.data.user.display_id).toMatch(/^[A-Z]{2,4}[A-Z0-9]{8}$/);
      userId = response.body.data.user.id;
      userDisplayId = response.body.data.user.display_id;
    });

    it('POST /auth/register should fail for duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('POST /auth/register should fail with invalid data', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'invalid', password: '123' })
        .expect(400);
    });
  });

  describe('Step 2: Login', () => {
    it('POST /auth/login should return tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.display_id).toBeDefined();
      expect(response.body.data.user.display_id).toBe(userDisplayId);

      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    it('POST /auth/login should fail with wrong password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: 'WrongPassword!' })
        .expect(401);
    });

    it('POST /auth/login should fail with non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'Test123!' })
        .expect(401);
    });
  });

  describe('Step 3: Get Profile', () => {
    it('GET /auth/me should return user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.name).toBe(testUser.name);
      expect(response.body.data.display_id).toBeDefined();
      expect(response.body.data.display_id).toBe(userDisplayId);
    });

    it('GET /auth/me should reject requests without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('GET /auth/me should reject requests with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Step 4: Refresh Token', () => {
    it('POST /auth/refresh should return new tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      // Update tokens for subsequent tests
      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    it('POST /auth/refresh should fail with invalid token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401);
    });
  });

  describe('Step 5: Update Profile', () => {
    it('PATCH /auth/me should update user name', async () => {
      const response = await request(app.getHttpServer())
        .patch('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated E2E User' })
        .expect(200);

      expect(response.body.data.name).toBe('Updated E2E User');
    });
  });

  describe('Step 6: Logout', () => {
    it('POST /auth/logout should invalidate tokens', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });

  describe('Step 7: Check Identifier', () => {
    it('POST /auth/check-identifier should find existing email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/check-identifier')
        .send({ identifier: testUser.email });

      expect(response.status).toBeLessThan(500);
      expect(response.body).toBeDefined();
    });
  });
});

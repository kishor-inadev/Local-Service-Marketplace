import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { Pool } from 'pg';

describe('AdminController (e2e)', () => {
  let app: INestApplication;
  let pool: Pool;
  let testUserId: string;
  let testAdminId: string;
  let testDisputeId: string;
  let testJobId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    const logger = app.get('winston');
    app.useGlobalFilters(new HttpExceptionFilter(logger));

    await app.init();

    pool = moduleFixture.get<Pool>('DATABASE_POOL');

    // Create test admin
    const adminResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      ['admin@example.com', 'hashedpassword', 'Admin', 'User', 'admin'],
    );
    testAdminId = adminResult.rows[0].id;

    // Create test user
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, suspended)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        'testuser@example.com',
        'hashedpassword',
        'Test',
        'User',
        'user',
        false,
      ],
    );
    testUserId = userResult.rows[0].id;

    // Create test job
    const jobResult = await pool.query(
      `INSERT INTO jobs (request_id, proposal_id, provider_id, client_id, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002',
        testUserId,
        testUserId,
        'completed',
      ],
    );
    testJobId = jobResult.rows[0].id;

    // Create test dispute
    const disputeResult = await pool.query(
      `INSERT INTO disputes (job_id, opened_by, reason, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [testJobId, testUserId, 'Payment issue', 'open'],
    );
    testDisputeId = disputeResult.rows[0].id;

    // Create system setting
    await pool.query(
      `INSERT INTO system_settings (key, value, description)
       VALUES ($1, $2, $3)`,
      ['platform_fee', '10', 'Platform fee percentage'],
    );
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM admin_actions WHERE admin_id = $1', [
      testAdminId,
    ]);
    await pool.query('DELETE FROM audit_logs WHERE user_id = $1', [testAdminId]);
    await pool.query('DELETE FROM disputes WHERE id = $1', [testDisputeId]);
    await pool.query('DELETE FROM jobs WHERE id = $1', [testJobId]);
    await pool.query('DELETE FROM users WHERE id IN ($1, $2)', [
      testUserId,
      testAdminId,
    ]);
    await pool.query('DELETE FROM system_settings WHERE key = $1', [
      'platform_fee',
    ]);

    await pool.end();
    await app.close();
  });

  describe('GET /admin/users', () => {
    it('should get all users with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users?limit=10&offset=0')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('email');
      expect(response.body[0]).toHaveProperty('firstName');
      expect(response.body[0]).toHaveProperty('lastName');
      expect(response.body[0]).toHaveProperty('role');
      expect(response.body[0]).toHaveProperty('suspended');
    });

    it('should search users by query', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users?search=testuser')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get user by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/users/${testUserId}`)
        .expect(200);

      expect(response.body.id).toBe(testUserId);
      expect(response.body.email).toBe('testuser@example.com');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .get('/admin/users/550e8400-e29b-41d4-a716-446655440099')
        .expect(404);
    });
  });

  describe('PATCH /admin/users/:id/suspend', () => {
    it('should suspend a user', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/admin/users/${testUserId}/suspend`)
        .set('x-admin-id', testAdminId)
        .send({
          suspended: true,
          reason: 'Violation of terms',
        })
        .expect(200);

      expect(response.body.id).toBe(testUserId);
      expect(response.body.suspended).toBe(true);
    });

    it('should unsuspend a user', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/admin/users/${testUserId}/suspend`)
        .set('x-admin-id', testAdminId)
        .send({
          suspended: false,
          reason: 'Reinstated',
        })
        .expect(200);

      expect(response.body.id).toBe(testUserId);
      expect(response.body.suspended).toBe(false);
    });

    it('should fail validation with missing suspended field', async () => {
      await request(app.getHttpServer())
        .patch(`/admin/users/${testUserId}/suspend`)
        .set('x-admin-id', testAdminId)
        .send({
          reason: 'Missing suspended field',
        })
        .expect(400);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .patch('/admin/users/550e8400-e29b-41d4-a716-446655440099/suspend')
        .set('x-admin-id', testAdminId)
        .send({
          suspended: true,
          reason: 'Test',
        })
        .expect(404);
    });
  });

  describe('GET /admin/disputes', () => {
    it('should get all disputes with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/disputes?limit=10&offset=0')
        .expect(200);

      expect(response.body).toHaveProperty('disputes');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.disputes)).toBe(true);
      expect(response.body.disputes.length).toBeGreaterThan(0);
    });

    it('should get disputes by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/disputes?status=open')
        .expect(200);

      expect(response.body).toHaveProperty('disputes');
      expect(Array.isArray(response.body.disputes)).toBe(true);
    });

    it('should get dispute by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/disputes/${testDisputeId}`)
        .expect(200);

      expect(response.body.id).toBe(testDisputeId);
      expect(response.body.jobId).toBe(testJobId);
      expect(response.body.status).toBe('open');
    });

    it('should return 404 for non-existent dispute', async () => {
      await request(app.getHttpServer())
        .get('/admin/disputes/550e8400-e29b-41d4-a716-446655440099')
        .expect(404);
    });
  });

  describe('PATCH /admin/disputes/:id', () => {
    it('should update a dispute', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/admin/disputes/${testDisputeId}`)
        .set('x-admin-id', testAdminId)
        .send({
          status: 'resolved',
          resolution: 'Issue resolved through mediation',
        })
        .expect(200);

      expect(response.body.id).toBe(testDisputeId);
      expect(response.body.status).toBe('resolved');
      expect(response.body.resolution).toBe('Issue resolved through mediation');
      expect(response.body.resolvedBy).toBe(testAdminId);
      expect(response.body).toHaveProperty('resolvedAt');
    });

    it('should fail validation with invalid status', async () => {
      await request(app.getHttpServer())
        .patch(`/admin/disputes/${testDisputeId}`)
        .set('x-admin-id', testAdminId)
        .send({
          status: 'invalid_status',
          resolution: 'Test',
        })
        .expect(400);
    });

    it('should fail validation with missing required fields', async () => {
      await request(app.getHttpServer())
        .patch(`/admin/disputes/${testDisputeId}`)
        .set('x-admin-id', testAdminId)
        .send({
          status: 'resolved',
        })
        .expect(400);
    });

    it('should return 404 for non-existent dispute', async () => {
      await request(app.getHttpServer())
        .patch('/admin/disputes/550e8400-e29b-41d4-a716-446655440099')
        .set('x-admin-id', testAdminId)
        .send({
          status: 'resolved',
          resolution: 'Test',
        })
        .expect(404);
    });
  });

  describe('GET /admin/audit-logs', () => {
    it('should get audit logs with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/audit-logs?limit=50&offset=0')
        .expect(200);

      expect(response.body).toHaveProperty('logs');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.logs)).toBe(true);
    });

    it('should get audit logs by user ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/audit-logs?userId=${testAdminId}`)
        .expect(200);

      expect(response.body).toHaveProperty('logs');
      expect(Array.isArray(response.body.logs)).toBe(true);
    });

    it('should get audit logs by entity', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/audit-logs/entity/dispute/${testDisputeId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /admin/settings', () => {
    it('should get all system settings', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/settings')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get system setting by key', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/settings/platform_fee')
        .expect(200);

      expect(response.body.key).toBe('platform_fee');
      expect(response.body.value).toBe('10');
    });

    it('should return 404 for non-existent setting', async () => {
      await request(app.getHttpServer())
        .get('/admin/settings/non_existent_key')
        .expect(404);
    });
  });

  describe('PATCH /admin/settings/:key', () => {
    it('should update a system setting', async () => {
      const response = await request(app.getHttpServer())
        .patch('/admin/settings/platform_fee')
        .set('x-admin-id', testAdminId)
        .send({
          value: '15',
        })
        .expect(200);

      expect(response.body.key).toBe('platform_fee');
      expect(response.body.value).toBe('15');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should fail validation with missing value field', async () => {
      await request(app.getHttpServer())
        .patch('/admin/settings/platform_fee')
        .set('x-admin-id', testAdminId)
        .send({})
        .expect(400);
    });

    it('should return 404 for non-existent setting', async () => {
      await request(app.getHttpServer())
        .patch('/admin/settings/non_existent_key')
        .set('x-admin-id', testAdminId)
        .send({
          value: '20',
        })
        .expect(404);
    });
  });
});

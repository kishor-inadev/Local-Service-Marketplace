import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Pool } from 'pg';

/**
 * E2E tests for the marketplace critical flow:
 *   create request → submit proposal → accept proposal (creates job)
 *
 * Requires a running PostgreSQL database with schema applied.
 * Run with: cd services/marketplace-service && pnpm test:e2e
 */
describe('Marketplace Flow (e2e)', () => {
  let app: INestApplication;
  let pool: Pool;

  const customerId = 'e2e-customer-' + Date.now();
  const providerId = 'e2e-provider-' + Date.now();
  let categoryId: string;
  let requestId: string;
  let requestDisplayId: string;
  let proposalId: string;
  let proposalDisplayId: string;
  let jobId: string;
  let jobDisplayId: string;

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

    // Ensure a test category exists
    const catResult = await pool.query(
      `INSERT INTO service_categories (id, name, slug, description)
       VALUES (gen_random_uuid(), 'E2E Test Category', 'e2e-test-cat-${Date.now()}', 'For E2E testing')
       ON CONFLICT DO NOTHING
       RETURNING id`,
    );
    if (catResult.rows.length > 0) {
      categoryId = catResult.rows[0].id;
    } else {
      const existing = await pool.query(
        `SELECT id FROM service_categories LIMIT 1`,
      );
      categoryId = existing.rows[0]?.id;
    }
  });

  afterAll(async () => {
    // Clean up in reverse order of creation
    if (jobId) {
      await pool.query('DELETE FROM jobs WHERE id = $1', [jobId]).catch(() => {});
    }
    if (proposalId) {
      await pool.query('DELETE FROM proposals WHERE id = $1', [proposalId]).catch(() => {});
    }
    if (requestId) {
      await pool.query('DELETE FROM service_requests WHERE id = $1', [requestId]).catch(() => {});
    }
    if (categoryId) {
      await pool.query(`DELETE FROM service_categories WHERE slug LIKE 'e2e-test-cat-%'`).catch(() => {});
    }
    await pool.end();
    await app.close();
  });

  // ==================== SERVICE REQUESTS ====================

  describe('Step 1: Create Service Request', () => {
    it('POST /requests should create a new request', async () => {
      const response = await request(app.getHttpServer())
        .post('/requests')
        .set('x-user-id', customerId)
        .set('x-user-role', 'customer')
        .send({
          title: 'E2E Test Request - Plumbing Fix',
          description: 'Need a plumber to fix a leaking pipe in the kitchen',
          categoryId: categoryId,
          budget: 150.00,
          urgency: 'medium',
          location: '123 Test Street, Test City',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      requestId = response.body.data.id;
      requestDisplayId = response.body.data.display_id;
      expect(requestId).toBeDefined();
      expect(requestDisplayId).toBeDefined();
      expect(requestDisplayId).toMatch(/^[A-Z]{2,4}[A-Z0-9]{8}$/);
    });

    it('POST /requests should fail without required fields', async () => {
      await request(app.getHttpServer())
        .post('/requests')
        .set('x-user-id', customerId)
        .set('x-user-role', 'customer')
        .send({ description: 'Incomplete' })
        .expect(400);
    });
  });

  describe('Step 2: Browse Requests', () => {
    it('GET /requests should list requests with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/requests')
        .set('x-user-id', providerId)
        .set('x-user-role', 'provider')
        .query({ limit: 10, page: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('GET /requests/:id should return the created request', async () => {
      const response = await request(app.getHttpServer())
        .get(`/requests/${requestId}`)
        .set('x-user-id', customerId)
        .set('x-user-role', 'customer')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(requestId);
      expect(response.body.data.display_id).toBe(requestDisplayId);
    });

    it('GET /requests/:id should accept display_id path values', async () => {
      const response = await request(app.getHttpServer())
        .get(`/requests/${requestDisplayId}`)
        .set('x-user-id', customerId)
        .set('x-user-role', 'customer')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(requestId);
      expect(response.body.data.display_id).toBe(requestDisplayId);
    });

    it('GET /requests/:id should reject invalid id format', async () => {
      await request(app.getHttpServer())
        .get('/requests/not-a-valid-id')
        .set('x-user-id', customerId)
        .set('x-user-role', 'customer')
        .expect(400);
    });

    it('GET /requests/my should return user requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/requests/my')
        .set('x-user-id', customerId)
        .set('x-user-role', 'customer')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // ==================== PROPOSALS ====================

  describe('Step 3: Submit Proposal', () => {
    it('POST /proposals should create a proposal on the request', async () => {
      const response = await request(app.getHttpServer())
        .post('/proposals')
        .set('x-user-id', providerId)
        .set('x-user-role', 'provider')
        .send({
          requestId: requestId,
          price: 120.00,
          estimatedDuration: '2 hours',
          message: 'I can fix your leaking pipe. I have 10 years of plumbing experience.',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      proposalId = response.body.data.id;
      proposalDisplayId = response.body.data.display_id;
      expect(proposalId).toBeDefined();
      expect(proposalDisplayId).toBeDefined();
      expect(proposalDisplayId).toMatch(/^[A-Z]{2,4}[A-Z0-9]{8}$/);
    });

    it('GET /requests/:requestId/proposals should list proposals for the request', async () => {
      const response = await request(app.getHttpServer())
        .get(`/requests/${requestId}/proposals`)
        .set('x-user-id', customerId)
        .set('x-user-role', 'customer')
        .expect(200);

      expect(response.body.success).toBe(true);
      const proposals = response.body.data;
      expect(Array.isArray(proposals)).toBe(true);
      expect(proposals.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /proposals/my should return provider proposals', async () => {
      const response = await request(app.getHttpServer())
        .get('/proposals/my')
        .set('x-user-id', providerId)
        .set('x-user-role', 'provider')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('GET /proposals/:id should return the proposal', async () => {
      const response = await request(app.getHttpServer())
        .get(`/proposals/${proposalId}`)
        .set('x-user-id', providerId)
        .set('x-user-role', 'provider')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(proposalId);
      expect(response.body.data.display_id).toBe(proposalDisplayId);
    });

    it('GET /proposals/:id should accept display_id path values', async () => {
      const response = await request(app.getHttpServer())
        .get(`/proposals/${proposalDisplayId}`)
        .set('x-user-id', providerId)
        .set('x-user-role', 'provider')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(proposalId);
      expect(response.body.data.display_id).toBe(proposalDisplayId);
    });
  });

  // ==================== ACCEPT PROPOSAL → JOB ====================

  describe('Step 4: Accept Proposal (creates Job)', () => {
    it('POST /proposals/:id/accept should create a job', async () => {
      const response = await request(app.getHttpServer())
        .post(`/proposals/${proposalId}/accept`)
        .set('x-user-id', customerId)
        .set('x-user-role', 'customer')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      // The accept endpoint may return the job or the updated proposal
      jobId = response.body.data.jobId || response.body.data.id;
      jobDisplayId = response.body.data.job_display_id || response.body.data.display_id;
    });
  });

  // ==================== JOBS ====================

  describe('Step 5: Manage Job', () => {
    it('GET /jobs/my should return user jobs', async () => {
      const response = await request(app.getHttpServer())
        .get('/jobs/my')
        .set('x-user-id', customerId)
        .set('x-user-role', 'customer')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('GET /jobs should list jobs with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/jobs')
        .set('x-user-id', customerId)
        .set('x-user-role', 'customer')
        .query({ limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      if (response.body.data.length > 0) {
        const createdJob = response.body.data.find((j: any) => j.id === jobId);
        if (createdJob?.display_id) {
          jobDisplayId = createdJob.display_id;
        }
      }
    });

    it('PATCH /jobs/:id/status should update job status', async () => {
      if (!jobId) return; // Skip if no job was created

      const response = await request(app.getHttpServer())
        .patch(`/jobs/${jobId}/status`)
        .set('x-user-id', providerId)
        .set('x-user-role', 'provider')
        .send({ status: 'in_progress' })
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data?.display_id) {
        expect(response.body.data.display_id).toMatch(/^[A-Z]{2,4}[A-Z0-9]{8}$/);
      }
    });

    it('PATCH /jobs/:id/status should accept display_id path values', async () => {
      if (!jobDisplayId) return;

      const response = await request(app.getHttpServer())
        .patch(`/jobs/${jobDisplayId}/status`)
        .set('x-user-id', providerId)
        .set('x-user-role', 'provider')
        .send({ status: 'in_progress' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // ==================== REQUEST UPDATE ====================

  describe('Step 6: Update Request', () => {
    it('PATCH /requests/:id should update the request', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/requests/${requestId}`)
        .set('x-user-id', customerId)
        .set('x-user-role', 'customer')
        .send({ description: 'Updated: Need urgent plumbing fix' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});

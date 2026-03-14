import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Pool } from 'pg';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Proposal Service (e2e)', () => {
  let app: INestApplication;
  let pool: Pool;
  let requestId: string;
  let providerId: string;
  let proposalId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Apply exception filter
    const logger = app.get('winston');
    app.useGlobalFilters(new HttpExceptionFilter(logger));

    await app.init();

    // Get database pool
    pool = app.get<Pool>('DATABASE_POOL');

    // Setup test data
    requestId = '123e4567-e89b-12d3-a456-426614174000';
    providerId = '123e4567-e89b-12d3-a456-426614174001';
  });

  afterAll(async () => {
    // Cleanup test data
    await pool.query('DELETE FROM proposals WHERE request_id = $1', [requestId]);

    await pool.end();
    await app.close();
  });

  describe('POST /proposals', () => {
    it('should create a new proposal', async () => {
      const createDto = {
        request_id: requestId,
        provider_id: providerId,
        price: 150,
        message: 'I can complete this job within 2 days with high quality work',
      };

      const response = await request(app.getHttpServer())
        .post('/proposals')
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.request_id).toBe(createDto.request_id);
      expect(response.body.provider_id).toBe(createDto.provider_id);
      expect(response.body.price).toBe(createDto.price);
      expect(response.body.message).toBe(createDto.message);
      expect(response.body.status).toBe('pending');
      expect(response.body).toHaveProperty('created_at');

      proposalId = response.body.id;
    });

    it('should fail with validation error for short message', async () => {
      const createDto = {
        request_id: requestId,
        provider_id: '123e4567-e89b-12d3-a456-426614174002',
        price: 150,
        message: 'Short',
      };

      await request(app.getHttpServer())
        .post('/proposals')
        .send(createDto)
        .expect(400);
    });

    it('should fail with validation error for negative price', async () => {
      const createDto = {
        request_id: requestId,
        provider_id: '123e4567-e89b-12d3-a456-426614174002',
        price: -10,
        message: 'I can complete this job',
      };

      await request(app.getHttpServer())
        .post('/proposals')
        .send(createDto)
        .expect(400);
    });

    it('should fail with validation error for invalid request_id', async () => {
      const createDto = {
        request_id: 'not-a-uuid',
        provider_id: providerId,
        price: 150,
        message: 'I can complete this job',
      };

      await request(app.getHttpServer())
        .post('/proposals')
        .send(createDto)
        .expect(400);
    });

    it('should fail if provider already submitted a proposal', async () => {
      const createDto = {
        request_id: requestId,
        provider_id: providerId,
        price: 200,
        message: 'Another proposal from the same provider',
      };

      await request(app.getHttpServer())
        .post('/proposals')
        .send(createDto)
        .expect(409);
    });
  });

  describe('GET /requests/:requestId/proposals', () => {
    it('should retrieve proposals for a request', async () => {
      const response = await request(app.getHttpServer())
        .get(`/requests/${requestId}/proposals`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('hasMore');
      expect(response.body.data.length).toBeGreaterThan(0);
      
      response.body.data.forEach((proposal) => {
        expect(proposal.request_id).toBe(requestId);
      });
    });

    it('should return empty array for request with no proposals', async () => {
      const nonExistentRequestId = '123e4567-e89b-12d3-a456-426614174999';

      const response = await request(app.getHttpServer())
        .get(`/requests/${nonExistentRequestId}/proposals`)
        .expect(200);

      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /proposals/:id', () => {
    it('should retrieve a proposal by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/proposals/${proposalId}`)
        .expect(200);

      expect(response.body.id).toBe(proposalId);
      expect(response.body.request_id).toBe(requestId);
      expect(response.body.provider_id).toBe(providerId);
    });

    it('should return 404 for non-existent proposal', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';

      await request(app.getHttpServer())
        .get(`/proposals/${nonExistentId}`)
        .expect(404);
    });
  });

  describe('POST /proposals/:id/accept', () => {
    it('should accept a proposal', async () => {
      const response = await request(app.getHttpServer())
        .post(`/proposals/${proposalId}/accept`)
        .expect(200);

      expect(response.body.id).toBe(proposalId);
      expect(response.body.status).toBe('accepted');
    });

    it('should fail to accept already accepted proposal', async () => {
      await request(app.getHttpServer())
        .post(`/proposals/${proposalId}/accept`)
        .expect(400);
    });

    it('should return 404 for non-existent proposal', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';

      await request(app.getHttpServer())
        .post(`/proposals/${nonExistentId}/accept`)
        .expect(404);
    });
  });

  describe('POST /proposals/:id/reject', () => {
    let rejectProposalId: string;

    beforeAll(async () => {
      // Create a new proposal to reject
      const createDto = {
        request_id: requestId,
        provider_id: '123e4567-e89b-12d3-a456-426614174003',
        price: 180,
        message: 'Another proposal to be rejected',
      };

      const response = await request(app.getHttpServer())
        .post('/proposals')
        .send(createDto);

      rejectProposalId = response.body.id;
    });

    it('should reject a proposal', async () => {
      const response = await request(app.getHttpServer())
        .post(`/proposals/${rejectProposalId}/reject`)
        .expect(200);

      expect(response.body.id).toBe(rejectProposalId);
      expect(response.body.status).toBe('rejected');
    });

    it('should fail to reject already rejected proposal', async () => {
      await request(app.getHttpServer())
        .post(`/proposals/${rejectProposalId}/reject`)
        .expect(400);
    });

    it('should return 404 for non-existent proposal', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';

      await request(app.getHttpServer())
        .post(`/proposals/${nonExistentId}/reject`)
        .expect(404);
    });
  });
});

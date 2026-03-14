import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Pool } from 'pg';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Job Service (e2e)', () => {
  let app: INestApplication;
  let pool: Pool;
  let requestId: string;
  let providerId: string;
  let jobId: string;

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
    await pool.query('DELETE FROM jobs WHERE request_id = $1', [requestId]);

    await pool.end();
    await app.close();
  });

  describe('POST /jobs', () => {
    it('should create a new job', async () => {
      const createDto = {
        request_id: requestId,
        provider_id: providerId,
      };

      const response = await request(app.getHttpServer())
        .post('/jobs')
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.request_id).toBe(createDto.request_id);
      expect(response.body.provider_id).toBe(createDto.provider_id);
      expect(response.body.status).toBe('pending');
      expect(response.body).toHaveProperty('started_at');
      expect(response.body.completed_at).toBeNull();

      jobId = response.body.id;
    });

    it('should fail with validation error for invalid request_id', async () => {
      const createDto = {
        request_id: 'not-a-uuid',
        provider_id: providerId,
      };

      await request(app.getHttpServer())
        .post('/jobs')
        .send(createDto)
        .expect(400);
    });

    it('should fail if job already exists for request', async () => {
      const createDto = {
        request_id: requestId,
        provider_id: providerId,
      };

      await request(app.getHttpServer())
        .post('/jobs')
        .send(createDto)
        .expect(409);
    });
  });

  describe('GET /jobs/:id', () => {
    it('should retrieve a job by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/jobs/${jobId}`)
        .expect(200);

      expect(response.body.id).toBe(jobId);
      expect(response.body.request_id).toBe(requestId);
      expect(response.body.provider_id).toBe(providerId);
      expect(response.body.status).toBe('pending');
    });

    it('should return 404 for non-existent job', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';

      await request(app.getHttpServer())
        .get(`/jobs/${nonExistentId}`)
        .expect(404);
    });
  });

  describe('PATCH /jobs/:id/status', () => {
    it('should update job status', async () => {
      const updateDto = {
        status: 'in_progress',
      };

      const response = await request(app.getHttpServer())
        .patch(`/jobs/${jobId}/status`)
        .send(updateDto)
        .expect(200);

      expect(response.body.id).toBe(jobId);
      expect(response.body.status).toBe('in_progress');
    });

    it('should fail with validation error for invalid status', async () => {
      const updateDto = {
        status: 'invalid_status',
      };

      await request(app.getHttpServer())
        .patch(`/jobs/${jobId}/status`)
        .send(updateDto)
        .expect(400);
    });

    it('should return 404 for non-existent job', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';
      const updateDto = {
        status: 'in_progress',
      };

      await request(app.getHttpServer())
        .patch(`/jobs/${nonExistentId}/status`)
        .send(updateDto)
        .expect(404);
    });
  });

  describe('POST /jobs/:id/complete', () => {
    it('should complete a job', async () => {
      const response = await request(app.getHttpServer())
        .post(`/jobs/${jobId}/complete`)
        .expect(200);

      expect(response.body.id).toBe(jobId);
      expect(response.body.status).toBe('completed');
      expect(response.body.completed_at).not.toBeNull();
    });

    it('should fail to complete already completed job', async () => {
      await request(app.getHttpServer())
        .post(`/jobs/${jobId}/complete`)
        .expect(400);
    });

    it('should return 404 for non-existent job', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';

      await request(app.getHttpServer())
        .post(`/jobs/${nonExistentId}/complete`)
        .expect(404);
    });
  });

  describe('GET /jobs/provider/:providerId', () => {
    it('should retrieve jobs for a provider', async () => {
      const response = await request(app.getHttpServer())
        .get(`/jobs/provider/${providerId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      response.body.forEach((job) => {
        expect(job.provider_id).toBe(providerId);
      });
    });

    it('should return empty array for provider with no jobs', async () => {
      const nonExistentProviderId = '123e4567-e89b-12d3-a456-426614174999';

      const response = await request(app.getHttpServer())
        .get(`/jobs/provider/${nonExistentProviderId}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /jobs/status/:status', () => {
    it('should retrieve jobs by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/jobs/status/completed')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      response.body.forEach((job) => {
        expect(job.status).toBe('completed');
      });
    });
  });

  describe('Job Lifecycle', () => {
    let lifecycleJobId: string;

    it('should create, update, and complete a job', async () => {
      // Create job
      const createDto = {
        request_id: '123e4567-e89b-12d3-a456-426614174002',
        provider_id: '123e4567-e89b-12d3-a456-426614174003',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/jobs')
        .send(createDto)
        .expect(201);

      lifecycleJobId = createResponse.body.id;
      expect(createResponse.body.status).toBe('pending');

      // Update status to in_progress
      const updateDto = {
        status: 'in_progress',
      };

      const updateResponse = await request(app.getHttpServer())
        .patch(`/jobs/${lifecycleJobId}/status`)
        .send(updateDto)
        .expect(200);

      expect(updateResponse.body.status).toBe('in_progress');

      // Complete job
      const completeResponse = await request(app.getHttpServer())
        .post(`/jobs/${lifecycleJobId}/complete`)
        .expect(200);

      expect(completeResponse.body.status).toBe('completed');
      expect(completeResponse.body.completed_at).not.toBeNull();

      // Cleanup
      await pool.query('DELETE FROM jobs WHERE id = $1', [lifecycleJobId]);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Pool } from 'pg';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Request Service (e2e)', () => {
  let app: INestApplication;
  let pool: Pool;
  let categoryId: string;
  let userId: string;
  let requestId: string;

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

    // Get logger from DI container and apply exception filter
    const logger = app.get('winston');
    app.useGlobalFilters(new HttpExceptionFilter(logger));

    await app.init();

    // Get database pool
    pool = app.get<Pool>('DATABASE_POOL');

    // Setup test data
    userId = '123e4567-e89b-12d3-a456-426614174000';

    // Create a test category
    const categoryResult = await pool.query(
      `INSERT INTO service_categories (name) VALUES ('Test Category') RETURNING id`,
    );
    categoryId = categoryResult.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup test data
    await pool.query('DELETE FROM service_requests WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM service_categories WHERE id = $1', [categoryId]);

    await pool.end();
    await app.close();
  });

  describe('POST /requests', () => {
    it('should create a new request', async () => {
      const createDto = {
        user_id: userId,
        category_id: categoryId,
        description: 'Need a plumber to fix a leaky faucet',
        budget: 100,
      };

      const response = await request(app.getHttpServer())
        .post('/requests')
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.user_id).toBe(createDto.user_id);
      expect(response.body.category_id).toBe(createDto.category_id);
      expect(response.body.description).toBe(createDto.description);
      expect(response.body.budget).toBe(createDto.budget);
      expect(response.body.status).toBe('pending');
      expect(response.body).toHaveProperty('created_at');

      requestId = response.body.id;
    });

    it('should fail with validation error for short description', async () => {
      const createDto = {
        user_id: userId,
        category_id: categoryId,
        description: 'Short',
        budget: 100,
      };

      await request(app.getHttpServer())
        .post('/requests')
        .send(createDto)
        .expect(400);
    });

    it('should fail with validation error for negative budget', async () => {
      const createDto = {
        user_id: userId,
        category_id: categoryId,
        description: 'Need a plumber to fix a leaky faucet',
        budget: -10,
      };

      await request(app.getHttpServer())
        .post('/requests')
        .send(createDto)
        .expect(400);
    });

    it('should fail with validation error for invalid category_id', async () => {
      const createDto = {
        user_id: userId,
        category_id: 'not-a-uuid',
        description: 'Need a plumber to fix a leaky faucet',
        budget: 100,
      };

      await request(app.getHttpServer())
        .post('/requests')
        .send(createDto)
        .expect(400);
    });
  });

  describe('GET /requests', () => {
    it('should retrieve requests with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/requests')
        .query({ limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('hasMore');
    });

    it('should filter requests by user_id', async () => {
      const response = await request(app.getHttpServer())
        .get('/requests')
        .query({ user_id: userId })
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      response.body.data.forEach((req) => {
        expect(req.user_id).toBe(userId);
      });
    });

    it('should filter requests by category_id', async () => {
      const response = await request(app.getHttpServer())
        .get('/requests')
        .query({ category_id: categoryId })
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      response.body.data.forEach((req) => {
        expect(req.category_id).toBe(categoryId);
      });
    });

    it('should filter requests by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/requests')
        .query({ status: 'pending' })
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      response.body.data.forEach((req) => {
        expect(req.status).toBe('pending');
      });
    });
  });

  describe('GET /requests/:id', () => {
    it('should retrieve a request by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/requests/${requestId}`)
        .expect(200);

      expect(response.body.id).toBe(requestId);
      expect(response.body.user_id).toBe(userId);
      expect(response.body.category_id).toBe(categoryId);
    });

    it('should return 404 for non-existent request', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';

      await request(app.getHttpServer())
        .get(`/requests/${nonExistentId}`)
        .expect(404);
    });
  });

  describe('PATCH /requests/:id', () => {
    it('should update a request', async () => {
      const updateDto = {
        description: 'Updated description for plumbing work',
        budget: 150,
      };

      const response = await request(app.getHttpServer())
        .patch(`/requests/${requestId}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.id).toBe(requestId);
      expect(response.body.description).toBe(updateDto.description);
      expect(response.body.budget).toBe(updateDto.budget);
    });

    it('should update request status', async () => {
      const updateDto = {
        status: 'in_progress',
      };

      const response = await request(app.getHttpServer())
        .patch(`/requests/${requestId}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.status).toBe('in_progress');
    });

    it('should return 404 for non-existent request', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';
      const updateDto = {
        description: 'Updated description',
      };

      await request(app.getHttpServer())
        .patch(`/requests/${nonExistentId}`)
        .send(updateDto)
        .expect(404);
    });
  });

  describe('GET /requests/user/:userId', () => {
    it('should retrieve all requests for a user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/requests/user/${userId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((req) => {
        expect(req.user_id).toBe(userId);
      });
    });
  });

  describe('DELETE /requests/:id', () => {
    it('should delete a request', async () => {
      await request(app.getHttpServer())
        .delete(`/requests/${requestId}`)
        .expect(204);

      // Verify deletion
      await request(app.getHttpServer())
        .get(`/requests/${requestId}`)
        .expect(404);
    });

    it('should return 404 for non-existent request', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';

      await request(app.getHttpServer())
        .delete(`/requests/${nonExistentId}`)
        .expect(404);
    });
  });

  describe('GET /categories', () => {
    it('should retrieve all categories', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /categories/:id', () => {
    it('should retrieve a category by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/categories/${categoryId}`)
        .expect(200);

      expect(response.body.id).toBe(categoryId);
      expect(response.body.name).toBe('Test Category');
    });

    it('should return 404 for non-existent category', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';

      await request(app.getHttpServer())
        .get(`/categories/${nonExistentId}`)
        .expect(404);
    });
  });

  describe('POST /categories', () => {
    it('should create a new category', async () => {
      const response = await request(app.getHttpServer())
        .post('/categories')
        .send({ name: 'Electrical Services' })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Electrical Services');
      expect(response.body).toHaveProperty('created_at');

      // Cleanup
      await pool.query('DELETE FROM service_categories WHERE id = $1', [response.body.id]);
    });
  });
});

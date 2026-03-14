import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { Pool } from 'pg';

describe('ReviewController (e2e)', () => {
  let app: INestApplication;
  let pool: Pool;
  let testUserId: string;
  let testProviderId: string;
  let testJobId: string;
  let testReviewId: string;

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

    // Create test user
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      ['testuser@example.com', 'hashedpassword', 'Test', 'User'],
    );
    testUserId = userResult.rows[0].id;

    // Create test provider
    const providerResult = await pool.query(
      `INSERT INTO providers (user_id, business_name, description)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [testUserId, 'Test Provider', 'Test Description'],
    );
    testProviderId = providerResult.rows[0].id;

    // Create test job
    const jobResult = await pool.query(
      `INSERT INTO jobs (request_id, proposal_id, provider_id, client_id, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002',
        testProviderId,
        testUserId,
        'completed',
      ],
    );
    testJobId = jobResult.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM reviews WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM jobs WHERE id = $1', [testJobId]);
    await pool.query('DELETE FROM providers WHERE id = $1', [testProviderId]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);

    await pool.end();
    await app.close();
  });

  describe('POST /reviews', () => {
    it('should create a new review', async () => {
      const createReviewDto = {
        jobId: testJobId,
        userId: testUserId,
        providerId: testProviderId,
        rating: 5,
        comment: 'Excellent service! Highly recommended.',
      };

      const response = await request(app.getHttpServer())
        .post('/reviews')
        .send(createReviewDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.jobId).toBe(testJobId);
      expect(response.body.userId).toBe(testUserId);
      expect(response.body.providerId).toBe(testProviderId);
      expect(response.body.rating).toBe(5);
      expect(response.body.comment).toBe('Excellent service! Highly recommended.');
      expect(response.body).toHaveProperty('createdAt');

      testReviewId = response.body.id;
    });

    it('should fail validation with invalid rating', async () => {
      const createReviewDto = {
        jobId: testJobId,
        userId: testUserId,
        providerId: testProviderId,
        rating: 6, // Invalid: rating should be 1-5
        comment: 'Test comment',
      };

      await request(app.getHttpServer())
        .post('/reviews')
        .send(createReviewDto)
        .expect(400);
    });

    it('should fail validation with missing required fields', async () => {
      const createReviewDto = {
        jobId: testJobId,
        // Missing userId, providerId, rating, comment
      };

      await request(app.getHttpServer())
        .post('/reviews')
        .send(createReviewDto)
        .expect(400);
    });

    it('should fail validation with invalid UUID', async () => {
      const createReviewDto = {
        jobId: 'invalid-uuid',
        userId: testUserId,
        providerId: testProviderId,
        rating: 5,
        comment: 'Test comment',
      };

      await request(app.getHttpServer())
        .post('/reviews')
        .send(createReviewDto)
        .expect(400);
    });
  });

  describe('GET /reviews/:id', () => {
    it('should get a review by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/reviews/${testReviewId}`)
        .expect(200);

      expect(response.body.id).toBe(testReviewId);
      expect(response.body.jobId).toBe(testJobId);
      expect(response.body.userId).toBe(testUserId);
      expect(response.body.providerId).toBe(testProviderId);
      expect(response.body.rating).toBe(5);
      expect(response.body).toHaveProperty('comment');
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should return 404 for non-existent review', async () => {
      await request(app.getHttpServer())
        .get('/reviews/550e8400-e29b-41d4-a716-446655440099')
        .expect(404);
    });
  });

  describe('GET /providers/:providerId/reviews', () => {
    beforeAll(async () => {
      // Create additional reviews for pagination testing
      for (let i = 0; i < 5; i++) {
        await pool.query(
          `INSERT INTO reviews (job_id, user_id, provider_id, rating, comment)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            testJobId,
            testUserId,
            testProviderId,
            4 + (i % 2), // Rating alternates between 4 and 5
            `Test review ${i + 1}`,
          ],
        );
      }
    });

    it('should get reviews for a provider', async () => {
      const response = await request(app.getHttpServer())
        .get(`/providers/${testProviderId}/reviews`)
        .expect(200);

      expect(response.body).toHaveProperty('reviews');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('averageRating');
      expect(Array.isArray(response.body.reviews)).toBe(true);
      expect(response.body.reviews.length).toBeGreaterThan(0);
      expect(response.body.total).toBeGreaterThan(0);
      expect(response.body.averageRating).toBeGreaterThan(0);
    });

    it('should support pagination with limit', async () => {
      const response = await request(app.getHttpServer())
        .get(`/providers/${testProviderId}/reviews?limit=3`)
        .expect(200);

      expect(response.body.reviews.length).toBeLessThanOrEqual(3);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('averageRating');
    });

    it('should support pagination with limit and offset', async () => {
      const firstResponse = await request(app.getHttpServer())
        .get(`/providers/${testProviderId}/reviews?limit=2&offset=0`)
        .expect(200);

      const secondResponse = await request(app.getHttpServer())
        .get(`/providers/${testProviderId}/reviews?limit=2&offset=2`)
        .expect(200);

      expect(firstResponse.body.reviews.length).toBeLessThanOrEqual(2);
      expect(secondResponse.body.reviews.length).toBeLessThanOrEqual(2);

      // Ensure different reviews are returned
      if (
        firstResponse.body.reviews.length > 0 &&
        secondResponse.body.reviews.length > 0
      ) {
        expect(firstResponse.body.reviews[0].id).not.toBe(
          secondResponse.body.reviews[0].id,
        );
      }
    });

    it('should return empty array for provider with no reviews', async () => {
      const response = await request(app.getHttpServer())
        .get('/providers/550e8400-e29b-41d4-a716-446655440099/reviews')
        .expect(200);

      expect(response.body.reviews).toEqual([]);
      expect(response.body.total).toBe(0);
      expect(response.body.averageRating).toBe(0);
    });
  });

  describe('GET /providers/:providerId/rating', () => {
    it('should calculate provider rating', async () => {
      const response = await request(app.getHttpServer())
        .get(`/providers/${testProviderId}/rating`)
        .expect(200);

      expect(response.body).toHaveProperty('averageRating');
      expect(response.body).toHaveProperty('totalReviews');
      expect(response.body.averageRating).toBeGreaterThan(0);
      expect(response.body.totalReviews).toBeGreaterThan(0);
      expect(response.body.averageRating).toBeGreaterThanOrEqual(1);
      expect(response.body.averageRating).toBeLessThanOrEqual(5);
    });

    it('should return zero rating for provider with no reviews', async () => {
      const response = await request(app.getHttpServer())
        .get('/providers/550e8400-e29b-41d4-a716-446655440099/rating')
        .expect(200);

      expect(response.body.averageRating).toBe(0);
      expect(response.body.totalReviews).toBe(0);
    });
  });
});

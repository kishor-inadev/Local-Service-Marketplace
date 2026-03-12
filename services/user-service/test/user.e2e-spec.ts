import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('User Service (e2e)', () => {
  let app: INestApplication;
  let testProviderId: string;
  let testUserId: string;

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

    // Get logger from DI container and apply exception filter
    const logger = app.get('winston');
    app.useGlobalFilters(new HttpExceptionFilter(logger));

    await app.init();

    // Generate a test user ID (in production, this would come from auth service)
    testUserId = '550e8400-e29b-41d4-a716-446655440000';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/providers (POST)', () => {
    it('should create a new provider profile', () => {
      return request(app.getHttpServer())
        .post('/providers')
        .send({
          user_id: testUserId,
          business_name: 'Test Plumbing Services',
          description: 'Professional plumbing services',
          service_categories: [],
          availability: [
            {
              day_of_week: 1,
              start_time: '09:00',
              end_time: '17:00',
            },
          ],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.business_name).toBe('Test Plumbing Services');
          expect(res.body.user_id).toBe(testUserId);
          expect(res.body.availability).toHaveLength(1);
          testProviderId = res.body.id;
        });
    });

    it('should fail if provider already exists for user', () => {
      return request(app.getHttpServer())
        .post('/providers')
        .send({
          user_id: testUserId,
          business_name: 'Another Business',
          description: 'Test',
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('already exists');
        });
    });

    it('should fail with invalid user_id format', () => {
      return request(app.getHttpServer())
        .post('/providers')
        .send({
          user_id: 'invalid-uuid',
          business_name: 'Test Business',
        })
        .expect(400);
    });

    it('should fail with missing required fields', () => {
      return request(app.getHttpServer())
        .post('/providers')
        .send({
          user_id: testUserId,
        })
        .expect(400);
    });
  });

  describe('/providers/:id (GET)', () => {
    it('should get provider by id', () => {
      return request(app.getHttpServer())
        .get(`/providers/${testProviderId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testProviderId);
          expect(res.body.business_name).toBe('Test Plumbing Services');
          expect(res.body).toHaveProperty('services');
          expect(res.body).toHaveProperty('availability');
        });
    });

    it('should return 404 for non-existent provider', () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440099';
      return request(app.getHttpServer())
        .get(`/providers/${fakeId}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('not found');
        });
    });

    it('should fail with invalid UUID format', () => {
      return request(app.getHttpServer())
        .get('/providers/invalid-id')
        .expect(500); // Database will reject invalid UUID
    });
  });

  describe('/providers (GET)', () => {
    it('should list providers with default pagination', () => {
      return request(app.getHttpServer())
        .get('/providers')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('pagination');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.pagination).toHaveProperty('limit');
          expect(res.body.pagination).toHaveProperty('hasMore');
        });
    });

    it('should respect custom limit parameter', () => {
      return request(app.getHttpServer())
        .get('/providers?limit=5')
        .expect(200)
        .expect((res) => {
          expect(res.body.pagination.limit).toBe(5);
          expect(res.body.data.length).toBeLessThanOrEqual(5);
        });
    });

    it('should fail if limit exceeds max', () => {
      return request(app.getHttpServer())
        .get('/providers?limit=200')
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('cannot exceed');
        });
    });

    it('should support search parameter', () => {
      return request(app.getHttpServer())
        .get('/providers?search=Plumbing')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
        });
    });

    it('should support cursor-based pagination', () => {
      return request(app.getHttpServer())
        .get(`/providers?cursor=${testProviderId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
        });
    });
  });

  describe('/providers/:id (PATCH)', () => {
    it('should update provider business name', () => {
      return request(app.getHttpServer())
        .patch(`/providers/${testProviderId}`)
        .send({
          business_name: 'Updated Plumbing Services',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.business_name).toBe('Updated Plumbing Services');
        });
    });

    it('should update provider description', () => {
      return request(app.getHttpServer())
        .patch(`/providers/${testProviderId}`)
        .send({
          description: 'Updated professional plumbing services',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.description).toBe('Updated professional plumbing services');
        });
    });

    it('should update provider availability', () => {
      return request(app.getHttpServer())
        .patch(`/providers/${testProviderId}`)
        .send({
          availability: [
            {
              day_of_week: 1,
              start_time: '08:00',
              end_time: '18:00',
            },
            {
              day_of_week: 2,
              start_time: '08:00',
              end_time: '18:00',
            },
          ],
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.availability).toHaveLength(2);
        });
    });

    it('should return 404 for non-existent provider', () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440099';
      return request(app.getHttpServer())
        .patch(`/providers/${fakeId}`)
        .send({
          business_name: 'Updated Name',
        })
        .expect(404);
    });
  });

  describe('/favorites (POST)', () => {
    it('should save a favorite provider', () => {
      const anotherUserId = '550e8400-e29b-41d4-a716-446655440001';
      return request(app.getHttpServer())
        .post('/favorites')
        .send({
          user_id: anotherUserId,
          provider_id: testProviderId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.user_id).toBe(anotherUserId);
          expect(res.body.provider_id).toBe(testProviderId);
        });
    });

    it('should fail if provider does not exist', () => {
      const fakeProviderId = '550e8400-e29b-41d4-a716-446655440099';
      return request(app.getHttpServer())
        .post('/favorites')
        .send({
          user_id: testUserId,
          provider_id: fakeProviderId,
        })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('not found');
        });
    });

    it('should fail with invalid UUID', () => {
      return request(app.getHttpServer())
        .post('/favorites')
        .send({
          user_id: 'invalid',
          provider_id: testProviderId,
        })
        .expect(400);
    });
  });

  describe('/favorites (GET)', () => {
    it('should get user favorites', () => {
      const anotherUserId = '550e8400-e29b-41d4-a716-446655440001';
      return request(app.getHttpServer())
        .get(`/favorites?user_id=${anotherUserId}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('provider_id');
            expect(res.body[0]).toHaveProperty('provider_name');
          }
        });
    });

    it('should return empty array for user with no favorites', () => {
      const newUserId = '550e8400-e29b-41d4-a716-446655440099';
      return request(app.getHttpServer())
        .get(`/favorites?user_id=${newUserId}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(0);
        });
    });
  });

  describe('/providers/:id (DELETE)', () => {
    it('should delete a provider', () => {
      return request(app.getHttpServer())
        .delete(`/providers/${testProviderId}`)
        .expect(204);
    });

    it('should return 404 after deletion', () => {
      return request(app.getHttpServer())
        .get(`/providers/${testProviderId}`)
        .expect(404);
    });

    it('should return 404 when deleting non-existent provider', () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440099';
      return request(app.getHttpServer())
        .delete(`/providers/${fakeId}`)
        .expect(404);
    });
  });

  describe('Validation', () => {
    it('should reject additional fields in request body', () => {
      return request(app.getHttpServer())
        .post('/providers')
        .send({
          user_id: '550e8400-e29b-41d4-a716-446655440002',
          business_name: 'Test',
          extra_field: 'should be rejected',
        })
        .expect(400);
    });

    it('should validate day_of_week range', () => {
      return request(app.getHttpServer())
        .post('/providers')
        .send({
          user_id: '550e8400-e29b-41d4-a716-446655440003',
          business_name: 'Test',
          availability: [
            {
              day_of_week: 8, // Invalid
              start_time: '09:00',
              end_time: '17:00',
            },
          ],
        })
        .expect(400);
    });
  });
});

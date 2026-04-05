import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('InfrastructureController (e2e)', () => {
  let app: INestApplication;

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

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ========================================
  // EVENT TESTS
  // ========================================

  describe('/events (POST)', () => {
    it('should create an event', () => {
      return request(app.getHttpServer())
        .post('/events')
        .send({
          eventType: 'user_created',
          payload: { userId: '123', email: 'test@example.com' },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.statusCode).toBe(201);
          expect(res.body.message).toBe('Event created successfully');
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data).toHaveProperty('display_id');
          expect(res.body.data.eventType).toBe('user_created');
        });
    });

    it('should reject invalid event data', () => {
      return request(app.getHttpServer())
        .post('/events')
        .send({
          payload: { userId: '123' },
        })
        .expect(400);
    });
  });

  describe('/events (GET)', () => {
    it('should retrieve all events with pagination', () => {
      return request(app.getHttpServer())
        .get('/events?limit=10&offset=0')
        .expect(200)
        .expect((res) => {
          expect(res.body.statusCode).toBe(200);
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.pagination).toHaveProperty('total');
          if (res.body.data.length > 0) {
            expect(res.body.data[0]).toHaveProperty('display_id');
          }
        });
    });
  });

  describe('/events/type/:eventType (GET)', () => {
    it('should retrieve events by type', () => {
      return request(app.getHttpServer())
        .get('/events/type/user_created')
        .expect(200)
        .expect((res) => {
          expect(res.body.statusCode).toBe(200);
          expect(res.body.data).toBeInstanceOf(Array);
        });
    });
  });

  // ========================================
  // BACKGROUND JOB TESTS
  // ========================================

  describe('/background-jobs (POST)', () => {
    it('should create a background job', () => {
      return request(app.getHttpServer())
        .post('/background-jobs')
        .send({
          jobType: 'send_email',
          payload: { to: 'test@example.com', subject: 'Test Email' },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.statusCode).toBe(201);
          expect(res.body.message).toBe('Background job created successfully');
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data).toHaveProperty('display_id');
          expect(res.body.data.jobType).toBe('send_email');
          expect(res.body.data.status).toBe('pending');
        });
    });
  });

  describe('/background-jobs (GET)', () => {
    it('should retrieve all background jobs', () => {
      return request(app.getHttpServer())
        .get('/background-jobs')
        .expect(200)
        .expect((res) => {
          expect(res.body.statusCode).toBe(200);
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.pagination).toHaveProperty('total');
          if (res.body.data.length > 0) {
            expect(res.body.data[0]).toHaveProperty('display_id');
          }
        });
    });
  });

  describe('/background-jobs/status/:status (GET)', () => {
    it('should retrieve jobs by status', () => {
      return request(app.getHttpServer())
        .get('/background-jobs/status/pending')
        .expect(200)
        .expect((res) => {
          expect(res.body.statusCode).toBe(200);
          expect(res.body.data).toBeInstanceOf(Array);
        });
    });
  });

  describe('/background-jobs/stats (GET)', () => {
    it('should retrieve queue statistics', () => {
      return request(app.getHttpServer())
        .get('/background-jobs/stats')
        .expect(200)
        .expect((res) => {
          expect(res.body.statusCode).toBe(200);
          expect(res.body.data).toBeDefined();
        });
    });
  });

  // ========================================
  // RATE LIMIT TESTS
  // ========================================

  describe('/rate-limits/check (POST)', () => {
    it('should check rate limit for a key', () => {
      return request(app.getHttpServer())
        .post('/rate-limits/check')
        .send({ key: 'user:123' })
        .expect(200)
        .expect((res) => {
          expect(res.body.statusCode).toBe(200);
          expect(res.body.data).toHaveProperty('allowed');
          expect(res.body.data).toHaveProperty('remaining');
          expect(res.body.data).toHaveProperty('resetAt');
        });
    });

    it('should reject invalid rate limit check', () => {
      return request(app.getHttpServer())
        .post('/rate-limits/check')
        .send({})
        .expect(400);
    });
  });

  describe('/rate-limits/:key (DELETE)', () => {
    it('should reset rate limit for a key', () => {
      return request(app.getHttpServer())
        .delete('/rate-limits/user:123')
        .expect(200)
        .expect((res) => {
          expect(res.body.statusCode).toBe(200);
          expect(res.body.message).toBe('Rate limit reset successfully');
        });
    });
  });

  describe('/rate-limits/cleanup (POST)', () => {
    it('should cleanup expired rate limits', () => {
      return request(app.getHttpServer())
        .post('/rate-limits/cleanup')
        .expect(200)
        .expect((res) => {
          expect(res.body.statusCode).toBe(200);
          expect(res.body.message).toBe('Expired rate limits cleaned up successfully');
        });
    });
  });

  // ========================================
  // FEATURE FLAG TESTS
  // ========================================

  describe('/feature-flags (POST)', () => {
    it('should create a feature flag', () => {
      return request(app.getHttpServer())
        .post('/feature-flags')
        .send({
          key: 'new_ui_enabled',
          enabled: true,
          rolloutPercentage: 50,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.statusCode).toBe(201);
          expect(res.body.message).toBe('Feature flag created successfully');
          expect(res.body.data).toHaveProperty('key');
          expect(res.body.data.key).toBe('new_ui_enabled');
        });
    });

    it('should reject invalid feature flag data', () => {
      return request(app.getHttpServer())
        .post('/feature-flags')
        .send({
          enabled: true,
        })
        .expect(400);
    });

    it('should reject invalid rollout percentage', () => {
      return request(app.getHttpServer())
        .post('/feature-flags')
        .send({
          key: 'test_feature',
          enabled: true,
          rolloutPercentage: 150,
        })
        .expect(400);
    });
  });

  describe('/feature-flags (GET)', () => {
    it('should retrieve all feature flags', () => {
      return request(app.getHttpServer())
        .get('/feature-flags')
        .expect(200)
        .expect((res) => {
          expect(res.body.statusCode).toBe(200);
          expect(res.body.data).toBeInstanceOf(Array);
        });
    });
  });

  describe('/feature-flags/:key (GET)', () => {
    it('should retrieve feature flag by key', () => {
      return request(app.getHttpServer())
        .get('/feature-flags/new_ui_enabled')
        .expect(200)
        .expect((res) => {
          expect(res.body.statusCode).toBe(200);
          expect(res.body.data).toBeDefined();
        });
    });
  });

  describe('/feature-flags/:key/enabled (GET)', () => {
    it('should check if feature is enabled', () => {
      return request(app.getHttpServer())
        .get('/feature-flags/new_ui_enabled/enabled')
        .expect(200)
        .expect((res) => {
          expect(res.body.statusCode).toBe(200);
          expect(res.body.data).toHaveProperty('enabled');
          expect(typeof res.body.data.enabled).toBe('boolean');
        });
    });

    it('should check feature with userId for rollout', () => {
      return request(app.getHttpServer())
        .get('/feature-flags/new_ui_enabled/enabled?userId=user123')
        .expect(200)
        .expect((res) => {
          expect(res.body.statusCode).toBe(200);
          expect(res.body.data).toHaveProperty('enabled');
        });
    });
  });

  describe('/feature-flags/:key (PATCH)', () => {
    it('should update feature flag', () => {
      return request(app.getHttpServer())
        .patch('/feature-flags/new_ui_enabled')
        .send({ enabled: false })
        .expect(200)
        .expect((res) => {
          expect(res.body.statusCode).toBe(200);
          expect(res.body.message).toBe('Feature flag updated successfully');
        });
    });
  });

  describe('/feature-flags/:key (DELETE)', () => {
    it('should delete feature flag', () => {
      return request(app.getHttpServer())
        .delete('/feature-flags/new_ui_enabled')
        .expect(200)
        .expect((res) => {
          expect(res.body.statusCode).toBe(200);
          expect(res.body.message).toBe('Feature flag deleted successfully');
        });
    });
  });
});

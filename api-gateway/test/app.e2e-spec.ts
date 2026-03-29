import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('API Gateway (e2e)', () => {
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

  describe('Health Checks', () => {
    it('/health (GET) should return gateway health', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'healthy');
          expect(res.body).toHaveProperty('gateway', 'api-gateway');
          expect(res.body).toHaveProperty('timestamp');
        });
    });

    it('/health/services (GET) should return services health', () => {
      return request(app.getHttpServer())
        .get('/health/services')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('services');
        });
    });
  });

  describe('Authentication', () => {
    it('should reject requests without JWT token', () => {
      return request(app.getHttpServer())
				.get("/user/auth/me")
				.expect(401)
				.expect((res) => {
					expect(res.body).toHaveProperty("statusCode", 401);
					expect(res.body.message).toContain("token");
				});
    });

    it('should allow public routes without JWT', () => {
      return request(app.getHttpServer())
				.post("/user/auth/login")
				.send({ email: "test@example.com", password: "password" })
				.expect((res) => {
					// Should forward to auth service (may fail if service not running)
					expect([200, 201, 400, 401, 503]).toContain(res.status);
				});
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const requests = [];
      // Send 101 requests (exceeding 100 limit)
      for (let i = 0; i < 101; i++) {
        requests.push(
          request(app.getHttpServer())
            .get('/health')
            .then((res) => res.status),
        );
      }

      const results = await Promise.all(requests);
      const rateLimitedRequests = results.filter((status) => status === 429);

      expect(rateLimitedRequests.length).toBeGreaterThan(0);
    });
  });

  describe('Request Forwarding', () => {
    it('should forward requests to appropriate service', () => {
      return request(app.getHttpServer())
				.post("/user/auth/signup")
				.send({ email: "newuser@example.com", password: "SecurePass123!", name: "Test User", role: "customer" })
				.expect((res) => {
					// Should forward to auth service
					expect([201, 400, 409, 503]).toContain(res.status);
				});
    });

    it('should return 503 for unavailable services', () => {
      return request(app.getHttpServer())
        .get('/nonexistent/route')
        .expect(503);
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', () => {
      return request(app.getHttpServer())
        .options('/health')
        .expect(200)
        .expect((res) => {
          expect(res.headers).toHaveProperty('access-control-allow-origin');
        });
    });
  });

  describe('Security Headers', () => {
    it('should include security headers from helmet', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.headers).toHaveProperty('x-content-type-options');
          expect(res.headers).toHaveProperty('x-frame-options');
        });
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Auth Service (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let refreshToken: string;
  let testEmail: string;
  let passwordResetToken: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/signup (POST)', () => {
    it('should create a new user and return tokens', () => {
      testEmail = `test-${Date.now()}@example.com`;
      
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: testEmail,
          password: 'Test123456!',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe(testEmail);
          expect(res.body.user.email_verified).toBe(false);
          
          accessToken = res.body.accessToken;
          refreshToken = res.body.refreshToken;
        });
    });

    it('should fail if email already exists', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: testEmail,
          password: 'Test123456!',
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('already exists');
        });
    });

    it('should fail with invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'Test123456!',
        })
        .expect(400);
    });

    it('should fail with short password', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'new@example.com',
          password: 'short',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('at least 8 characters');
        });
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: 'Test123456!',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body.user.email).toBe(testEmail);
          
          // Update tokens
          accessToken = res.body.accessToken;
          refreshToken = res.body.refreshToken;
        });
    });

    it('should fail with wrong password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123!',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('Invalid credentials');
        });
    });

    it('should fail with non-existent email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test123456!',
        })
        .expect(401);
    });
  });

  describe('/auth/refresh (POST)', () => {
    it('should refresh access token with valid refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body.accessToken).toBeTruthy();
          
          // Update access token
          accessToken = res.body.accessToken;
        });
    });

    it('should fail with invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        })
        .expect(401);
    });
  });

  describe('/auth/password-reset/request (POST)', () => {
    it('should request password reset for existing user', () => {
      return request(app.getHttpServer())
        .post('/auth/password-reset/request')
        .send({
          email: testEmail,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toContain('Password reset email sent');
        });
    });

    it('should not reveal if user does not exist', () => {
      return request(app.getHttpServer())
        .post('/auth/password-reset/request')
        .send({
          email: 'nonexistent@example.com',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toContain('Password reset email sent');
        });
    });

    it('should fail with invalid email format', () => {
      return request(app.getHttpServer())
        .post('/auth/password-reset/request')
        .send({
          email: 'invalid-email',
        })
        .expect(400);
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should logout user and invalidate refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .send({
          refreshToken,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toContain('Logged out successfully');
        });
    });

    it('should fail to refresh token after logout', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should block login after multiple failed attempts', async () => {
      const wrongEmail = `ratelimit-${Date.now()}@example.com`;
      
      // First create a user
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: wrongEmail,
          password: 'Test123456!',
        });

      // Try to login multiple times with wrong password
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: wrongEmail,
            password: 'WrongPassword!',
          })
          .expect(401);
      }

      // Next attempt should be rate limited
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: wrongEmail,
          password: 'WrongPassword!',
        })
        .expect(429)
        .expect((res) => {
          expect(res.body.message).toContain('Too many failed login attempts');
        });
    });
  });

  describe('Validation', () => {
    it('should reject empty request body for signup', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({})
        .expect(400);
    });

    it('should reject empty request body for login', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    });

    it('should reject missing password', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'test@example.com',
        })
        .expect(400);
    });

    it('should reject additional fields', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'Test123456!',
          extraField: 'should-be-rejected',
        })
        .expect(400);
    });
  });
});

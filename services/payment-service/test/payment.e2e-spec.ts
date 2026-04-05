import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { Pool } from 'pg';

describe('PaymentController (e2e)', () => {
  let app: INestApplication;
  let pool: Pool;
  let paymentId: string;
  let jobId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.useGlobalFilters(new HttpExceptionFilter(app.get('WINSTON_MODULE_NEST_PROVIDER')));
    await app.init();

    pool = app.get('DATABASE_POOL');

    // Create a test job_id (in a real scenario, this would be created by job-service)
    const jobResult = await pool.query(
      'INSERT INTO jobs (id, request_id, proposal_id, status, created_at) VALUES (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), $1, NOW()) RETURNING id',
      ['active'],
    );
    jobId = jobResult.rows[0].id;

    // Create a test coupon
    await pool.query(
      'INSERT INTO coupons (id, code, discount_percent, expires_at) VALUES (gen_random_uuid(), $1, $2, NOW() + INTERVAL \'30 days\')',
      ['TEST10', 10],
    );
  });

  afterAll(async () => {
    // Clean up test data
    if (paymentId) {
      await pool.query('DELETE FROM refunds WHERE payment_id = $1', [paymentId]);
      await pool.query('DELETE FROM payments WHERE id = $1', [paymentId]);
    }
    if (jobId) {
      await pool.query('DELETE FROM jobs WHERE id = $1', [jobId]);
    }
    await pool.query('DELETE FROM coupons WHERE code = $1', ['TEST10']);
    await pool.query('DELETE FROM payment_webhooks');
    await pool.end();
    await app.close();
  });

  describe('POST /payments', () => {
    it('should create a payment', async () => {
      const response = await request(app.getHttpServer())
        .post('/payments')
        .set('x-user-id', 'test-user-123')
        .send({
          jobId: jobId,
          amount: 100,
          currency: 'USD',
        })
        .expect(201);

      expect(response.body.payment).toBeDefined();
      expect(response.body.payment.id).toBeDefined();
      expect(response.body.payment.display_id).toBeDefined();
      expect(response.body.payment.display_id).toMatch(/^[A-Z]{2,4}[A-Z0-9]{8}$/);
      expect(response.body.payment.jobId).toBe(jobId);
      expect(response.body.payment.amount).toBe(100);
      expect(response.body.payment.currency).toBe('USD');
      expect(response.body.payment.status).toBe('completed');
      paymentId = response.body.payment.id;
    });

    it('should create a payment with coupon discount', async () => {
      const response = await request(app.getHttpServer())
        .post('/payments')
        .set('x-user-id', 'test-user-456')
        .send({
          jobId: jobId,
          amount: 100,
          currency: 'USD',
          couponCode: 'TEST10',
        })
        .expect(201);

      expect(response.body.payment).toBeDefined();
      expect(response.body.payment.amount).toBe(90); // 10% discount
      expect(response.body.payment.display_id).toBeDefined();
    });

    it('should fail with invalid job id', async () => {
      await request(app.getHttpServer())
        .post('/payments')
        .set('x-user-id', 'test-user-123')
        .send({
          jobId: 'invalid-uuid',
          amount: 100,
          currency: 'USD',
        })
        .expect(400);
    });

    it('should fail with negative amount', async () => {
      await request(app.getHttpServer())
        .post('/payments')
        .set('x-user-id', 'test-user-123')
        .send({
          jobId: jobId,
          amount: -50,
          currency: 'USD',
        })
        .expect(400);
    });
  });

  describe('GET /payments/:id', () => {
    it('should retrieve a payment by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/payments/${paymentId}`)
        .expect(200);

      expect(response.body.payment).toBeDefined();
      expect(response.body.payment.id).toBe(paymentId);
      expect(response.body.payment.display_id).toBeDefined();
      expect(response.body.payment.jobId).toBe(jobId);
    });

    it('should return 404 for non-existent payment', async () => {
      await request(app.getHttpServer())
        .get(`/payments/00000000-0000-0000-0000-000000000000`)
        .expect(404);
    });
  });

  describe('GET /payments/job/:jobId', () => {
    it('should retrieve payments by job id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/payments/job/${jobId}`)
        .expect(200);

      expect(response.body.payments).toBeDefined();
      expect(Array.isArray(response.body.payments)).toBe(true);
      expect(response.body.payments.length).toBeGreaterThan(0);
      expect(response.body.payments[0].display_id).toBeDefined();
    });
  });

  describe('POST /payments/:id/refund', () => {
    it('should create a full refund', async () => {
      const response = await request(app.getHttpServer())
        .post(`/payments/${paymentId}/refund`)
        .send({})
        .expect(201);

      expect(response.body.refund).toBeDefined();
      expect(response.body.refund.paymentId).toBe(paymentId);
      expect(response.body.refund.status).toBe('completed');
      expect(response.body.refund.display_id).toBeDefined();
    });

    it('should fail to refund non-existent payment', async () => {
      await request(app.getHttpServer())
        .post(`/payments/00000000-0000-0000-0000-000000000000/refund`)
        .send({})
        .expect(404);
    });
  });

  describe('GET /payments/:id/refunds', () => {
    it('should retrieve refunds for a payment', async () => {
      const response = await request(app.getHttpServer())
        .get(`/payments/${paymentId}/refunds`)
        .expect(200);

      expect(response.body.refunds).toBeDefined();
      expect(Array.isArray(response.body.refunds)).toBe(true);
      expect(response.body.refunds.length).toBeGreaterThan(0);
      expect(response.body.refunds[0].display_id).toBeDefined();
    });
  });

  describe('POST /payments/webhook', () => {
    it('should handle a webhook', async () => {
      const response = await request(app.getHttpServer())
        .post('/payments/webhook')
        .send({
          gateway: 'stripe',
          payload: {
            paymentId: paymentId,
            status: 'completed',
            transactionId: 'txn_test_123',
          },
        })
        .expect(201);

      expect(response.body.webhook).toBeDefined();
      expect(response.body.webhook.gateway).toBe('stripe');
    });
  });

  describe('GET /payments/webhooks/unprocessed', () => {
    it('should retrieve unprocessed webhooks', async () => {
      const response = await request(app.getHttpServer())
        .get('/payments/webhooks/unprocessed')
        .expect(200);

      expect(response.body.webhooks).toBeDefined();
      expect(Array.isArray(response.body.webhooks)).toBe(true);
    });
  });

  describe('POST /payments/coupons/validate', () => {
    it('should validate a coupon', async () => {
      const response = await request(app.getHttpServer())
        .post('/payments/coupons/validate')
        .send({
          couponCode: 'TEST10',
        })
        .expect(201);

      expect(response.body.coupon).toBeDefined();
      expect(response.body.coupon.code).toBe('TEST10');
      expect(response.body.coupon.discountPercent).toBe(10);
    });

    it('should fail for non-existent coupon', async () => {
      await request(app.getHttpServer())
        .post('/payments/coupons/validate')
        .send({
          couponCode: 'INVALID',
        })
        .expect(404);
    });
  });
});

import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { Payment } from '../entities/payment.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentRepository {
  constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

  async createPayment(
    jobId: string,
    userId: string,
    providerId: string,
    amount: number,
    currency: string,
    paymentMethod?: string,
    transactionId?: string,
  ): Promise<Payment> {
    const id = uuidv4();
    
    // Calculate platform fee (e.g., 10%)
    const platformFee = Math.floor(amount * 0.10);
    const providerAmount = amount - platformFee;
    
    const query = `
      INSERT INTO payments (
        id, job_id, user_id, provider_id, amount, platform_fee, 
        provider_amount, currency, payment_method, status, transaction_id, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *
    `;
    const values = [
      id, 
      jobId, 
      userId,           // ✅ NEW (required)
      providerId,       // ✅ NEW
      amount, 
      platformFee,      // ✅ NEW
      providerAmount,   // ✅ NEW
      currency, 
      paymentMethod,    // ✅ NEW
      'pending', 
      transactionId
    ];
    const result = await this.pool.query(query, values);
    return new Payment({
      id: result.rows[0].id,
      job_id: result.rows[0].job_id,
      user_id: result.rows[0].user_id,
      provider_id: result.rows[0].provider_id,
      amount: parseFloat(result.rows[0].amount),
      platform_fee: parseFloat(result.rows[0].platform_fee),
      provider_amount: parseFloat(result.rows[0].provider_amount),
      currency: result.rows[0].currency,
      payment_method: result.rows[0].payment_method,
      status: result.rows[0].status,
      transaction_id: result.rows[0].transaction_id,
      failed_reason: result.rows[0].failed_reason,
      created_at: result.rows[0].created_at,
    });
  }

  async getPaymentById(id: string): Promise<Payment | null> {
    const query = 'SELECT * FROM payments WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return new Payment({
      id: result.rows[0].id,
      job_id: result.rows[0].job_id,
      amount: parseFloat(result.rows[0].amount),
      currency: result.rows[0].currency,
      status: result.rows[0].status,
      transaction_id: result.rows[0].transaction_id,
      created_at: result.rows[0].created_at,
    });
  }

  async updatePaymentStatus(
    id: string,
    status: 'pending' | 'completed' | 'failed' | 'refunded',
    transactionId?: string,
    failedReason?: string,
  ): Promise<Payment> {
    const query = `
      UPDATE payments 
      SET status = $1, 
          transaction_id = COALESCE($2, transaction_id),
          failed_reason = $3,
          paid_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE paid_at END
      WHERE id = $4
      RETURNING *
    `;
    const result = await this.pool.query(query, [status, transactionId, failedReason, id]);
    return new Payment({
      id: result.rows[0].id,
      job_id: result.rows[0].job_id,
      user_id: result.rows[0].user_id,
      provider_id: result.rows[0].provider_id,
      amount: parseFloat(result.rows[0].amount),
      platform_fee: parseFloat(result.rows[0].platform_fee),
      provider_amount: parseFloat(result.rows[0].provider_amount),
      currency: result.rows[0].currency,
      payment_method: result.rows[0].payment_method,
      status: result.rows[0].status,
      transaction_id: result.rows[0].transaction_id,
      failed_reason: result.rows[0].failed_reason,
      created_at: result.rows[0].created_at,
      paid_at: result.rows[0].paid_at,
    });
  }

  async getPaymentsByJobId(jobId: string): Promise<Payment[]> {
    const query = 'SELECT * FROM payments WHERE job_id = $1 ORDER BY created_at DESC';
    const result = await this.pool.query(query, [jobId]);
    return result.rows.map(
      (row) =>
        new Payment({
          id: row.id,
          job_id: row.job_id,
          amount: parseFloat(row.amount),
          currency: row.currency,
          status: row.status,
          transaction_id: row.transaction_id,
          created_at: row.created_at,
        }),
    );
  }

  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    const query = `
      SELECT p.*
      FROM payments p
      INNER JOIN jobs j ON p.job_id = j.id
      INNER JOIN service_requests sr ON j.request_id = sr.id
      LEFT JOIN providers prov ON j.provider_id = prov.id
      WHERE sr.user_id = $1 OR prov.user_id = $1
      ORDER BY p.created_at DESC
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows.map(
      (row) =>
        new Payment({
          id: row.id,
          job_id: row.job_id,
          amount: parseFloat(row.amount),
          currency: row.currency,
          status: row.status,
          transaction_id: row.transaction_id,
          created_at: row.created_at,
        }),
    );
  }

  // ✅ NEW: Advanced query methods
  async getPaymentsByPaymentMethod(
    paymentMethod: string,
    limit: number = 50
  ): Promise<Payment[]> {
    const query = `
      SELECT * FROM payments
      WHERE payment_method = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const result = await this.pool.query(query, [paymentMethod, limit]);
    return result.rows.map(row => new Payment({
      id: row.id,
      job_id: row.job_id,
      user_id: row.user_id,
      provider_id: row.provider_id,
      amount: parseFloat(row.amount),
      platform_fee: parseFloat(row.platform_fee),
      provider_amount: parseFloat(row.provider_amount),
      currency: row.currency,
      payment_method: row.payment_method,
      status: row.status,
      transaction_id: row.transaction_id,
      failed_reason: row.failed_reason,
      created_at: row.created_at,
    }));
  }

  async getFailedPayments(limit: number = 50): Promise<Payment[]> {
    const query = `
      SELECT * FROM payments
      WHERE status = 'failed'
        AND failed_reason IS NOT NULL
      ORDER BY created_at DESC
      LIMIT $1
    `;
    const result = await this.pool.query(query, [limit]);
    return result.rows.map(row => new Payment({
      id: row.id,
      job_id: row.job_id,
      user_id: row.user_id,
      provider_id: row.provider_id,
      amount: parseFloat(row.amount),
      platform_fee: parseFloat(row.platform_fee),
      provider_amount: parseFloat(row.provider_amount),
      currency: row.currency,
      payment_method: row.payment_method,
      status: row.status,
      transaction_id: row.transaction_id,
      failed_reason: row.failed_reason,
      created_at: row.created_at,
    }));
  }

  async getPlatformFeeTotal(
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    const query = `
      SELECT 
        SUM(platform_fee) as total_fees,
        COUNT(*) as payment_count,
        currency
      FROM payments
      WHERE status = 'completed'
        AND created_at BETWEEN COALESCE($1, '2020-01-01') AND COALESCE($2, NOW())
      GROUP BY currency
    `;
    const result = await this.pool.query(query, [startDate, endDate]);
    return result.rows;
  }

  async getProviderEarnings(
    providerId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    const query = `
      SELECT 
        COALESCE(SUM(provider_amount), 0) as total_earnings,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN provider_amount ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN provider_amount ELSE 0 END), 0) as pending_payout,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COALESCE(MAX(currency), 'USD') as currency
      FROM payments
      WHERE provider_id = $1
        AND created_at >= COALESCE($2, '2020-01-01')
        AND created_at <= COALESCE($3, NOW())
    `;
    const result = await this.pool.query(query, [providerId, startDate, endDate]);
    return result.rows[0] || { 
      total_earnings: 0, 
      total_paid: 0, 
      pending_payout: 0, 
      completed_count: 0, 
      currency: 'USD' 
    };
  }

  async getProviderEarningsByMonth(
    providerId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any[]> {
    const query = `
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        SUM(provider_amount) as earnings,
        COUNT(*) as job_count
      FROM payments
      WHERE provider_id = $1
        AND status = 'completed'
        AND created_at >= COALESCE($2, '2020-01-01')
        AND created_at <= COALESCE($3, NOW())
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `;
    const result = await this.pool.query(query, [providerId, startDate, endDate]);
    return result.rows;
  }

  async getProviderTransactions(
    providerId: string,
    limit: number = 20,
    cursor?: string,
    status?: string,
  ): Promise<any> {
    let query = `
      SELECT 
        p.*,
        u.name as customer_name
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.provider_id = $1
    `;
    
    const params: any[] = [providerId];
    let paramIndex = 2;

    if (status) {
      query += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (cursor) {
      query += ` AND p.created_at < $${paramIndex}`;
      params.push(cursor);
      paramIndex++;
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await this.pool.query(query, params);
    
    const nextCursor = result.rows.length === limit
      ? result.rows[result.rows.length - 1].created_at
      : null;

    return {
      data: result.rows,
      total: result.rowCount,
      cursor: nextCursor,
    };
  }

  async getProviderPayouts(providerId: string): Promise<any[]> {
    // For MVP, return empty array - payout system not yet implemented
    // This can be expanded later when payout tracking is added
    return [];
  }

  async getPaymentStats(): Promise<any> {
    const query = `
      SELECT 
        status,
        payment_method,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        SUM(platform_fee) as total_fees
      FROM payments
      GROUP BY status, payment_method
      ORDER BY count DESC
    `;
    const result = await this.pool.query(query);
    return result.rows;
  }
}

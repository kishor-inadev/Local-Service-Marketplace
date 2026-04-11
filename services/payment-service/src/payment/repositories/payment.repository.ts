import { Injectable, Inject } from "@nestjs/common";
import { Pool } from "pg";
import { Payment } from "../entities/payment.entity";
import { v4 as uuidv4 } from "uuid";
import {
  TransactionQueryDto,
  TransactionSortBy,
  SortOrder,
} from "../dto/transaction-query.dto";
import { resolveId } from "../../common/utils/resolve-id.util";

@Injectable()
export class PaymentRepository {
  constructor(@Inject("DATABASE_POOL") private pool: Pool) { }

  async createPayment(
    jobId: string,
    userId: string,
    providerId: string,
    amount: number,
    currency: string,
    paymentMethod?: string,
    transactionId?: string,
    gateway?: string,
  ): Promise<Payment> {
    const id = uuidv4();
    [jobId, providerId] = await Promise.all([
      resolveId(this.pool, "jobs", jobId),
      resolveId(this.pool, "providers", providerId),
    ]);

    // Calculate platform fee (10%)
    const platformFee = Math.floor(amount * 0.1);
    const providerAmount = amount - platformFee;

    const query = `
      INSERT INTO payments (
        id, job_id, user_id, provider_id, amount, platform_fee,
        provider_amount, currency, payment_method, gateway, status, transaction_id, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING *
    `;
    const values = [
      id,
      jobId,
      userId,
      providerId,
      amount,
      platformFee,
      providerAmount,
      currency,
      paymentMethod,
      gateway ?? "mock",
      "pending",
      transactionId,
    ];
    const result = await this.pool.query(query, values);
    return new Payment({
      id: result.rows[0].id,
      display_id: result.rows[0].display_id,
      job_id: result.rows[0].job_id,
      user_id: result.rows[0].user_id,
      provider_id: result.rows[0].provider_id,
      amount: parseFloat(result.rows[0].amount),
      platform_fee: parseFloat(result.rows[0].platform_fee),
      provider_amount: parseFloat(result.rows[0].provider_amount),
      currency: result.rows[0].currency,
      payment_method: result.rows[0].payment_method,
      gateway: result.rows[0].gateway,
      status: result.rows[0].status,
      transaction_id: result.rows[0].transaction_id,
      failed_reason: result.rows[0].failed_reason,
      created_at: result.rows[0].created_at,
    });
  }

  async getPaymentById(id: string): Promise<Payment | null> {
    id = await resolveId(this.pool, "payments", id);
    const query = "SELECT * FROM payments WHERE id = $1";
    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return new Payment({
      id: result.rows[0].id,
      display_id: result.rows[0].display_id,
      job_id: result.rows[0].job_id,
      amount: parseFloat(result.rows[0].amount),
      currency: result.rows[0].currency,
      status: result.rows[0].status,
      transaction_id: result.rows[0].transaction_id,
      created_at: result.rows[0].created_at,
    });
  }

  async getPaymentByTransactionId(
    transactionId: string,
  ): Promise<Payment | null> {
    const query = "SELECT * FROM payments WHERE transaction_id = $1 LIMIT 1";
    const result = await this.pool.query(query, [transactionId]);
    if (result.rows.length === 0) {
      return null;
    }
    return new Payment({
      id: result.rows[0].id,
      display_id: result.rows[0].display_id,
      job_id: result.rows[0].job_id,
      user_id: result.rows[0].user_id,
      provider_id: result.rows[0].provider_id,
      amount: parseFloat(result.rows[0].amount),
      platform_fee: parseFloat(result.rows[0].platform_fee),
      provider_amount: parseFloat(result.rows[0].provider_amount),
      currency: result.rows[0].currency,
      payment_method: result.rows[0].payment_method,
      gateway: result.rows[0].gateway,
      status: result.rows[0].status,
      transaction_id: result.rows[0].transaction_id,
      failed_reason: result.rows[0].failed_reason,
      created_at: result.rows[0].created_at,
      paid_at: result.rows[0].paid_at,
    });
  }

  async updatePaymentStatus(
    id: string,
    status: "pending" | "completed" | "failed" | "refunded",
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
    const result = await this.pool.query(query, [
      status,
      transactionId,
      failedReason,
      id,
    ]);
    return new Payment({
      id: result.rows[0].id,
      display_id: result.rows[0].display_id,
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
    jobId = await resolveId(this.pool, "jobs", jobId);
    const query =
      "SELECT * FROM payments WHERE job_id = $1 ORDER BY created_at DESC LIMIT 20";
    const result = await this.pool.query(query, [jobId]);
    return result.rows.map(
      (row) =>
        new Payment({
          id: row.id,
          display_id: row.display_id,
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
    // payments table already has user_id and provider_id — no cross-service JOIN needed
    const query = `
      SELECT * FROM payments
      WHERE user_id = $1 OR provider_id = $1
      ORDER BY created_at DESC
      LIMIT 100
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows.map(
      (row) =>
        new Payment({
          id: row.id,
          display_id: row.display_id,
          job_id: row.job_id,
          user_id: row.user_id,
          provider_id: row.provider_id,
          amount: parseFloat(row.amount),
          platform_fee: row.platform_fee
            ? parseFloat(row.platform_fee)
            : undefined,
          provider_amount: row.provider_amount
            ? parseFloat(row.provider_amount)
            : undefined,
          currency: row.currency,
          payment_method: row.payment_method,
          status: row.status,
          transaction_id: row.transaction_id,
          failed_reason: row.failed_reason,
          created_at: row.created_at,
          paid_at: row.paid_at,
        }),
    );
  }

  async getPaymentsByUserPaginated(
    userId: string,
    queryDto: TransactionQueryDto,
  ): Promise<Payment[]> {
    const {
      limit = 20,
      page,
      cursor,
      status,
      payment_method,
      created_from,
      created_to,
      sortBy = TransactionSortBy.CREATED_AT,
      sortOrder = SortOrder.DESC,
    } = queryDto;

    // payments table has user_id and provider_id — no cross-service JOIN needed
    let query = `
      SELECT p.*
      FROM payments p
      WHERE p.user_id = $1 OR p.provider_id = $1
    `;

    const values: any[] = [userId];
    let paramIndex = 2;
    const usingOffset = page !== undefined && page > 0;

    if (status) {
      query += ` AND p.status = $${paramIndex++}`;
      values.push(status);
    }

    if (payment_method) {
      query += ` AND p.payment_method = $${paramIndex++}`;
      values.push(payment_method);
    }

    if (created_from) {
      query += ` AND p.created_at >= $${paramIndex++}`;
      values.push(created_from);
    }

    if (created_to) {
      query += ` AND p.created_at <= $${paramIndex++}`;
      values.push(created_to);
    }

    if (cursor && !usingOffset) {
      query += ` AND p.created_at < $${paramIndex++}`;
      values.push(cursor);
    }

    const sortMap: Record<TransactionSortBy, string> = {
      [TransactionSortBy.CREATED_AT]: "p.created_at",
      [TransactionSortBy.PAID_AT]: "p.paid_at",
      [TransactionSortBy.AMOUNT]: "p.amount",
    };

    query += ` ORDER BY ${sortMap[sortBy] || "p.created_at"} ${sortOrder === SortOrder.ASC ? "ASC" : "DESC"}, p.id DESC`;

    if (usingOffset) {
      const offset = ((page || 1) - 1) * limit;
      query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      values.push(limit, offset);
    } else {
      query += ` LIMIT $${paramIndex++}`;
      values.push(limit + 1);
    }

    const result = await this.pool.query(query, values);
    return result.rows.map(
      (row) =>
        new Payment({
          id: row.id,
          display_id: row.display_id,
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
          paid_at: row.paid_at,
        }),
    );
  }

  async countPaymentsByUser(
    userId: string,
    queryDto: TransactionQueryDto,
  ): Promise<number> {
    const { status, payment_method, created_from, created_to } = queryDto;
    // payments table has user_id and provider_id — no cross-service JOIN needed
    let query = `
      SELECT COUNT(*)::int AS total
      FROM payments p
      WHERE p.user_id = $1 OR p.provider_id = $1
    `;

    const values: any[] = [userId];
    let paramIndex = 2;

    if (status) {
      query += ` AND p.status = $${paramIndex++}`;
      values.push(status);
    }
    if (payment_method) {
      query += ` AND p.payment_method = $${paramIndex++}`;
      values.push(payment_method);
    }
    if (created_from) {
      query += ` AND p.created_at >= $${paramIndex++}`;
      values.push(created_from);
    }
    if (created_to) {
      query += ` AND p.created_at <= $${paramIndex++}`;
      values.push(created_to);
    }

    const result = await this.pool.query(query, values);
    return result.rows[0].total;
  }

  // ✅ NEW: Advanced query methods
  async getPaymentsByPaymentMethod(
    paymentMethod: string,
    limit: number = 50,
  ): Promise<Payment[]> {
    const query = `
      SELECT * FROM payments
      WHERE payment_method = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const result = await this.pool.query(query, [paymentMethod, limit]);
    return result.rows.map(
      (row) =>
        new Payment({
          id: row.id,
          display_id: row.display_id,
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
        }),
    );
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
    return result.rows.map(
      (row) =>
        new Payment({
          id: row.id,
          display_id: row.display_id,
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
        }),
    );
  }

  async getPlatformFeeTotal(startDate?: Date, endDate?: Date): Promise<any> {
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
    endDate?: Date,
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
    const result = await this.pool.query(query, [
      providerId,
      startDate,
      endDate,
    ]);
    return (
      result.rows[0] || {
        total_earnings: 0,
        total_paid: 0,
        pending_payout: 0,
        completed_count: 0,
        currency: "USD",
      }
    );
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
    const result = await this.pool.query(query, [
      providerId,
      startDate,
      endDate,
    ]);
    return result.rows;
  }

  async getProviderTransactions(
    providerId: string,
    queryDto: TransactionQueryDto,
  ): Promise<any> {
    const {
      limit = 20,
      page,
      cursor,
      status,
      payment_method,
      created_from,
      created_to,
      sortBy = TransactionSortBy.CREATED_AT,
      sortOrder = SortOrder.DESC,
    } = queryDto;

    let query = `
      SELECT 
        p.*
      FROM payments p
      WHERE p.provider_id = $1
    `;

    const params: any[] = [providerId];
    let paramIndex = 2;
    const usingOffset = page !== undefined && page > 0;

    if (status) {
      query += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (payment_method) {
      query += ` AND p.payment_method = $${paramIndex}`;
      params.push(payment_method);
      paramIndex++;
    }

    if (created_from) {
      query += ` AND p.created_at >= $${paramIndex}`;
      params.push(created_from);
      paramIndex++;
    }

    if (created_to) {
      query += ` AND p.created_at <= $${paramIndex}`;
      params.push(created_to);
      paramIndex++;
    }

    if (cursor && !usingOffset) {
      query += ` AND p.created_at < $${paramIndex}`;
      params.push(cursor);
      paramIndex++;
    }

    const sortMap: Record<TransactionSortBy, string> = {
      [TransactionSortBy.CREATED_AT]: "p.created_at",
      [TransactionSortBy.PAID_AT]: "p.paid_at",
      [TransactionSortBy.AMOUNT]: "p.amount",
    };

    query += ` ORDER BY ${sortMap[sortBy] || "p.created_at"} ${sortOrder === SortOrder.ASC ? "ASC" : "DESC"}, p.id DESC`;

    if (usingOffset) {
      const offset = ((page || 1) - 1) * limit;
      query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(limit, offset);
    } else {
      query += ` LIMIT $${paramIndex}`;
      params.push(limit + 1);
    }

    const result = await this.pool.query(query, params);

    const hasMore = !usingOffset && result.rows.length > limit;
    const data = usingOffset ? result.rows : result.rows.slice(0, limit);
    const nextCursor =
      hasMore && data.length > 0 ? data[data.length - 1].created_at : null;

    return {
      data,
      total: usingOffset
        ? await this.countProviderTransactions(providerId, queryDto)
        : data.length,
      nextCursor,
      hasMore,
    };
  }

  async countProviderTransactions(
    providerId: string,
    queryDto: TransactionQueryDto,
  ): Promise<number> {
    const { status, payment_method, created_from, created_to } = queryDto;
    let query = `SELECT COUNT(*)::int AS total FROM payments p WHERE p.provider_id = $1`;
    const params: any[] = [providerId];
    let paramIndex = 2;

    if (status) {
      query += ` AND p.status = $${paramIndex++}`;
      params.push(status);
    }
    if (payment_method) {
      query += ` AND p.payment_method = $${paramIndex++}`;
      params.push(payment_method);
    }
    if (created_from) {
      query += ` AND p.created_at >= $${paramIndex++}`;
      params.push(created_from);
    }
    if (created_to) {
      query += ` AND p.created_at <= $${paramIndex++}`;
      params.push(created_to);
    }

    const result = await this.pool.query(query, params);
    return result.rows[0].total;
  }

  async getProviderPayouts(providerId: string): Promise<any[]> {
    const query = `
			SELECT
				MD5(
					p.provider_id
					|| '|' || TO_CHAR(DATE(COALESCE(p.paid_at, p.created_at)), 'YYYY-MM-DD')
					|| '|' || COALESCE(p.payment_method, 'card')
					|| '|' || CASE
						WHEN p.status = 'pending' THEN 'pending'
						WHEN p.status = 'refunded' THEN 'adjusted'
						ELSE 'available'
					END
				) AS id,
				COALESCE(
					SUM(
						CASE
							WHEN p.status = 'refunded' THEN -ABS(COALESCE(p.provider_amount, 0))
							ELSE COALESCE(p.provider_amount, 0)
						END
					),
					0
				)::numeric AS amount,
				CASE
					WHEN p.status = 'pending' THEN 'pending'
					WHEN p.status = 'refunded' THEN 'adjusted'
					ELSE 'available'
				END AS status,
				COALESCE(p.payment_method, 'card') AS payout_method,
				DATE(COALESCE(p.paid_at, p.created_at)) AS payout_date,
				COUNT(*)::int AS transaction_count
			FROM payments p
			WHERE p.provider_id = $1
				AND p.status IN ('pending', 'completed', 'refunded')
			GROUP BY
				p.provider_id,
				DATE(COALESCE(p.paid_at, p.created_at)),
				COALESCE(p.payment_method, 'card'),
				CASE
					WHEN p.status = 'pending' THEN 'pending'
					WHEN p.status = 'refunded' THEN 'adjusted'
					ELSE 'available'
				END
			HAVING COALESCE(
				SUM(
					CASE
						WHEN p.status = 'refunded' THEN -ABS(COALESCE(p.provider_amount, 0))
						ELSE COALESCE(p.provider_amount, 0)
					END
				),
				0
			) <> 0
			ORDER BY payout_date DESC, payout_method ASC
		`;

    const result = await this.pool.query(query, [providerId]);

    return result.rows.map((row) => ({
      id: row.id,
      amount: parseFloat(row.amount) || 0,
      status: row.status,
      payout_method: row.payout_method,
      payout_date: row.payout_date,
      transaction_count: parseInt(row.transaction_count, 10) || 0,
    }));
  }

  async getPaymentStats(): Promise<{
    total: number;
    totalRevenue: number;
    byStatus: {
      pending: number;
      completed: number;
      failed: number;
      refunded: number;
    };
  }> {
    const query = `
      SELECT
        COUNT(*)::int AS total,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0)::numeric AS total_revenue,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
        COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
        COUNT(*) FILTER (WHERE status = 'refunded')::int AS refunded
      FROM payments
    `;
    const result = await this.pool.query(query);
    const row = result.rows[0];
    return {
      total: row.total,
      totalRevenue: parseFloat(row.total_revenue),
      byStatus: {
        pending: row.pending,
        completed: row.completed,
        failed: row.failed,
        refunded: row.refunded,
      },
    };
  }
}

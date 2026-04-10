import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DailyMetric } from '../entities/daily-metric.entity';

@Injectable()
export class MetricsRepository {
  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  async getDailyMetrics(
    startDate?: string,
    endDate?: string,
    limit: number = 30,
  ): Promise<DailyMetric[]> {
    let query = `
      SELECT date, total_users, total_requests, 
             total_jobs, total_payments
      FROM daily_metrics
    `;

    const values: any[] = [];
    const conditions: string[] = [];

    if (startDate) {
      conditions.push(`date >= $${values.length + 1}`);
      values.push(startDate);
    }

    if (endDate) {
      conditions.push(`date <= $${values.length + 1}`);
      values.push(endDate);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY date DESC LIMIT $${values.length + 1}`;
    values.push(limit);

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  async getMetricByDate(date: string): Promise<DailyMetric | null> {
    const query = `
      SELECT date, total_users, total_requests, 
             total_jobs, total_payments
      FROM daily_metrics
      WHERE date = $1
    `;

    const result = await this.pool.query(query, [date]);
    return result.rows[0] || null;
  }

  async upsertDailyMetric(
    date: string,
    total_users: number,
    total_requests: number,
    total_jobs: number,
    total_payments: number,
  ): Promise<DailyMetric> {
    const query = `
      INSERT INTO daily_metrics (date, total_users, total_requests, total_jobs, total_payments)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (date) 
      DO UPDATE SET 
        total_users = EXCLUDED.total_users,
        total_requests = EXCLUDED.total_requests,
        total_jobs = EXCLUDED.total_jobs,
        total_payments = EXCLUDED.total_payments
      RETURNING date, total_users, total_requests, 
                total_jobs, total_payments
    `;

    const values = [date, total_users, total_requests, total_jobs, total_payments];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async aggregateDailyMetrics(date: string): Promise<DailyMetric> {
    // Get counts from various tables for the specified date
    const usersQuery = `SELECT COUNT(DISTINCT id) as count FROM users WHERE DATE(created_at) <= $1`;
    const requestsQuery = `SELECT COUNT(*) as count FROM service_requests WHERE DATE(created_at) = $1`;
    const jobsQuery = `SELECT COUNT(*) as count FROM jobs WHERE DATE(created_at) = $1`;
    const paymentsQuery = `SELECT COUNT(*) as count FROM payments WHERE DATE(created_at) = $1`;

    const [usersResult, requestsResult, jobsResult, paymentsResult] =
      await Promise.all([
        this.pool.query(usersQuery, [date]),
        this.pool.query(requestsQuery, [date]),
        this.pool.query(jobsQuery, [date]),
        this.pool.query(paymentsQuery, [date]),
      ]);

    const total_users = parseInt(usersResult.rows[0].count) || 0;
    const total_requests = parseInt(requestsResult.rows[0].count) || 0;
    const total_jobs = parseInt(jobsResult.rows[0].count) || 0;
    const total_payments = parseInt(paymentsResult.rows[0].count) || 0;

    return this.upsertDailyMetric(
      date,
      total_users,
      total_requests,
      total_jobs,
      total_payments,
    );
  }

  async getMetricsCount(): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM daily_metrics`;
    const result = await this.pool.query(query);
    return parseInt(result.rows[0].count) || 0;
  }

  async aggregateYesterdayMetrics(): Promise<void> {
    // Inserts or updates a daily_metrics row for yesterday's date
    // based on counts from other tables (implement as needed)
    await this.pool.query(`
      INSERT INTO daily_metrics (date, total_users, total_requests, total_proposals, total_jobs, total_payments)
      SELECT
        CURRENT_DATE - 1 AS date,
        (SELECT COUNT(*) FROM users WHERE created_at::date = CURRENT_DATE - 1) AS total_users,
        (SELECT COUNT(*) FROM service_requests WHERE created_at::date = CURRENT_DATE - 1) AS total_requests,
        (SELECT COUNT(*) FROM proposals WHERE created_at::date = CURRENT_DATE - 1) AS total_proposals,
        (SELECT COUNT(*) FROM jobs WHERE created_at::date = CURRENT_DATE - 1) AS total_jobs,
        (SELECT COUNT(*) FROM payments WHERE created_at::date = CURRENT_DATE - 1) AS total_payments
      ON CONFLICT (date) DO UPDATE SET
        total_users = EXCLUDED.total_users,
        total_requests = EXCLUDED.total_requests,
        total_proposals = EXCLUDED.total_proposals,
        total_jobs = EXCLUDED.total_jobs,
        total_payments = EXCLUDED.total_payments
    `);
  }
}

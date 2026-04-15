import { Injectable, Inject } from "@nestjs/common";
import { Pool } from "pg";
import { Job } from "../entities/job.entity";
import { CreateJobDto } from "../dto/create-job.dto";
import { JobStatus } from "../dto/update-job-status.dto";
import { JobQueryDto, JobSortBy, SortOrder } from "../dto/job-query.dto";
import { resolveId } from "@/common/utils/resolve-id.util";

@Injectable()
export class JobRepository {
  constructor(@Inject("DATABASE_POOL") private readonly pool: Pool) { }

  async getSystemSetting(key: string, defaultValue: string): Promise<string> {
    try {
      const res = await this.pool.query(
        'SELECT value FROM system_settings WHERE key = $1',
        [key],
      );
      return res.rows[0]?.value ?? defaultValue;
    } catch {
      return defaultValue;
    }
  }

  async createJob(dto: CreateJobDto): Promise<Job> {
    const [requestId, providerId, proposalId] = await Promise.all([
      resolveId(this.pool, "service_requests", dto.request_id),
      resolveId(this.pool, "providers", dto.provider_id),
      dto.proposal_id
        ? resolveId(this.pool, "proposals", dto.proposal_id)
        : Promise.resolve(null),
    ]);
    const query = `
      INSERT INTO jobs (
        request_id, provider_id, customer_id, proposal_id, status, started_at
      )
      VALUES ($1, $2, $3, $4, 'scheduled', NOW())
      RETURNING *
    `;

    const values = [
      requestId,
      providerId,
      dto.customer_id, // ✅ NEW
      proposalId, // ✅ NEW
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getJobById(id: string): Promise<Job | null> {
    id = await resolveId(this.pool, "jobs", id);
    const query = `
      SELECT *
      FROM jobs
      WHERE id = $1
    `;

    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async updateJobStatus(id: string, status: JobStatus): Promise<Job | null> {
    const query = `
      UPDATE jobs
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await this.pool.query(query, [status, id]);
    return result.rows[0] || null;
  }

  async completeJob(id: string): Promise<Job | null> {
    const query = `
      UPDATE jobs
      SET status = 'completed', completed_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async getJobByRequestId(requestId: string): Promise<Job | null> {
    requestId = await resolveId(this.pool, "service_requests", requestId);
    const query = `
      SELECT id, display_id, request_id, provider_id, status, started_at, completed_at
      FROM jobs
      WHERE request_id = $1
    `;

    const result = await this.pool.query(query, [requestId]);
    return result.rows[0] || null;
  }

  async getJobsPaginated(queryDto: JobQueryDto): Promise<Job[]> {
    let {
      provider_id,
      customer_id,
      request_id,
      status,
      started_from,
      started_to,
      completed_from,
      completed_to,
      limit = 20,
      page,
      cursor,
      sortBy = JobSortBy.STARTED_AT,
      sortOrder = SortOrder.DESC,
    } = queryDto;

    [provider_id, customer_id, request_id] = await Promise.all([
      provider_id
        ? resolveId(this.pool, "providers", provider_id)
        : Promise.resolve(undefined),
      customer_id
        ? resolveId(this.pool, "users", customer_id)
        : Promise.resolve(undefined),
      request_id
        ? resolveId(this.pool, "service_requests", request_id)
        : Promise.resolve(undefined),
    ]);

    let query = `
      SELECT *
      FROM jobs
      WHERE 1=1
    `;

    const values: any[] = [];
    let paramIndex = 1;
    const usingOffset = page !== undefined && page > 0;

    if (provider_id) {
      query += ` AND provider_id = $${paramIndex++}`;
      values.push(provider_id);
    }

    if (customer_id) {
      query += ` AND customer_id = $${paramIndex++}`;
      values.push(customer_id);
    }

    if (request_id) {
      query += ` AND request_id = $${paramIndex++}`;
      values.push(request_id);
    }

    if (status) {
      query += ` AND status = $${paramIndex++}`;
      values.push(status);
    }

    if (started_from) {
      query += ` AND started_at >= $${paramIndex++}`;
      values.push(started_from);
    }

    if (started_to) {
      query += ` AND started_at <= $${paramIndex++}`;
      values.push(started_to);
    }

    if (completed_from) {
      query += ` AND completed_at >= $${paramIndex++}`;
      values.push(completed_from);
    }

    if (completed_to) {
      query += ` AND completed_at <= $${paramIndex++}`;
      values.push(completed_to);
    }

    if (cursor && !usingOffset) {
      query += ` AND started_at < (SELECT started_at FROM jobs WHERE id = $${paramIndex++})`;
      values.push(cursor);
    }

    const sortMap: Record<JobSortBy, string> = {
      [JobSortBy.STARTED_AT]: "started_at",
      [JobSortBy.COMPLETED_AT]: "completed_at",
      [JobSortBy.CREATED_AT]: "created_at",
    };
    const safeSortColumn = sortMap[sortBy] || "started_at";
    const safeSortOrder = sortOrder === SortOrder.ASC ? "ASC" : "DESC";

    query += ` ORDER BY ${safeSortColumn} ${safeSortOrder}, id DESC`;

    if (usingOffset) {
      const offset = ((page || 1) - 1) * limit;
      query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      values.push(limit, offset);
    } else {
      query += ` LIMIT $${paramIndex++}`;
      values.push(limit + 1);
    }

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  async getJobStats(): Promise<{
    total: number;
    byStatus: {
      scheduled: number;
      in_progress: number;
      completed: number;
      cancelled: number;
      disputed: number;
    };
  }> {
    const query = `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'scheduled')::int AS scheduled,
        COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
        COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled,
        COUNT(*) FILTER (WHERE status = 'disputed')::int AS disputed
      FROM jobs
    `;
    const result = await this.pool.query(query);
    const row = result.rows[0];
    return {
      total: row.total,
      byStatus: {
        scheduled: row.scheduled,
        in_progress: row.in_progress,
        completed: row.completed,
        cancelled: row.cancelled,
        disputed: row.disputed,
      },
    };
  }

  async countJobs(queryDto: JobQueryDto): Promise<number> {
    let {
      provider_id,
      customer_id,
      request_id,
      status,
      started_from,
      started_to,
      completed_from,
      completed_to,
    } = queryDto;

    [provider_id, customer_id, request_id] = await Promise.all([
      provider_id
        ? resolveId(this.pool, "providers", provider_id)
        : Promise.resolve(undefined),
      customer_id
        ? resolveId(this.pool, "users", customer_id)
        : Promise.resolve(undefined),
      request_id
        ? resolveId(this.pool, "service_requests", request_id)
        : Promise.resolve(undefined),
    ]);

    let query = `SELECT COUNT(*)::int AS total FROM jobs WHERE 1=1`;
    const values: any[] = [];
    let paramIndex = 1;

    if (provider_id) {
      query += ` AND provider_id = $${paramIndex++}`;
      values.push(provider_id);
    }

    if (customer_id) {
      query += ` AND customer_id = $${paramIndex++}`;
      values.push(customer_id);
    }

    if (request_id) {
      query += ` AND request_id = $${paramIndex++}`;
      values.push(request_id);
    }

    if (status) {
      query += ` AND status = $${paramIndex++}`;
      values.push(status);
    }

    if (started_from) {
      query += ` AND started_at >= $${paramIndex++}`;
      values.push(started_from);
    }

    if (started_to) {
      query += ` AND started_at <= $${paramIndex++}`;
      values.push(started_to);
    }

    if (completed_from) {
      query += ` AND completed_at >= $${paramIndex++}`;
      values.push(completed_from);
    }

    if (completed_to) {
      query += ` AND completed_at <= $${paramIndex++}`;
      values.push(completed_to);
    }

    const result = await this.pool.query(query, values);
    return result.rows[0].total;
  }

  async getJobsByProvider(providerId: string): Promise<Job[]> {
    const query = `
      SELECT *
      FROM jobs
      WHERE provider_id = $1
      ORDER BY started_at DESC
    `;

    const result = await this.pool.query(query, [providerId]);
    return result.rows;
  }

  async getJobsByStatus(status: string): Promise<Job[]> {
    const query = `
      SELECT *
      FROM jobs
      WHERE status = $1
      ORDER BY started_at DESC
    `;

    const result = await this.pool.query(query, [status]);
    return result.rows;
  }

  async getJobsByCustomer(userId: string): Promise<Job[]> {
    const query = `
      SELECT j.*
      FROM jobs j
      INNER JOIN service_requests sr ON j.request_id = sr.id
      WHERE sr.user_id = $1
      ORDER BY j.started_at DESC
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async getJobsByProviderUser(userId: string): Promise<Job[]> {
    const query = `
      SELECT j.*
      FROM jobs j
      INNER JOIN providers p ON j.provider_id = p.id
      WHERE p.user_id = $1
      ORDER BY j.started_at DESC
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  // ✅ NEW METHOD: Cancel job with reason
  async cancelJob(
    jobId: string,
    cancelledBy: string,
    reason: string,
  ): Promise<Job | null> {
    const query = `
      UPDATE jobs 
      SET status = 'cancelled',
          cancelled_by = $1,
          cancellation_reason = $2,
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    const result = await this.pool.query(query, [cancelledBy, reason, jobId]);
    return result.rows[0] || null;
  }

  // ✅ NEW: Advanced query methods
  async getCancellationStats(startDate?: Date, endDate?: Date): Promise<any[]> {
    const query = `
      SELECT 
        cancelled_by,
        COUNT(*) as count,
        ARRAY_AGG(DISTINCT cancellation_reason) as reasons
      FROM jobs
      WHERE status = 'cancelled'
        AND created_at BETWEEN COALESCE($1, '2020-01-01') AND COALESCE($2, NOW())
      GROUP BY cancelled_by
    `;
    const result = await this.pool.query(query, [startDate, endDate]);
    return result.rows;
  }

  async getJobsByCancellationType(
    cancelledBy: string,
    limit: number = 20,
  ): Promise<Job[]> {
    const query = `
      SELECT * FROM jobs
      WHERE status = 'cancelled'
        AND cancelled_by = $1
      ORDER BY updated_at DESC
      LIMIT $2
    `;
    const result = await this.pool.query(query, [cancelledBy, limit]);
    return result.rows;
  }

  async getJobsWithActualAmount(
    minAmount: number,
    maxAmount: number,
    limit: number = 20,
  ): Promise<Job[]> {
    const query = `
      SELECT * FROM jobs
      WHERE actual_amount BETWEEN $1 AND $2
        AND actual_amount IS NOT NULL
      ORDER BY actual_amount DESC
      LIMIT $3
    `;
    const result = await this.pool.query(query, [minAmount, maxAmount, limit]);
    return result.rows;
  }

  async getAverageJobDuration(): Promise<any> {
    const query = `
      SELECT 
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/3600) as avg_hours,
        COUNT(*) as completed_count
      FROM jobs
      WHERE status = 'completed'
        AND completed_at IS NOT NULL
        AND started_at IS NOT NULL
    `;
    const result = await this.pool.query(query);
    return result.rows[0];
  }

  async updateActualAmount(jobId: string, amount: number): Promise<Job | null> {
    const query = `
      UPDATE jobs 
      SET actual_amount = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await this.pool.query(query, [amount, jobId]);
    return result.rows[0] || null;
  }

}

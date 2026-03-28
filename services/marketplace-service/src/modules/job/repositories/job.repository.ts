import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { Job } from '../entities/job.entity';
import { CreateJobDto } from '../dto/create-job.dto';
import { JobStatus } from '../dto/update-job-status.dto';
import { JobQueryDto, JobSortBy, SortOrder } from "../dto/job-query.dto";

@Injectable()
export class JobRepository {
	constructor(@Inject("DATABASE_POOL") private readonly pool: Pool) {}

	async createJob(dto: CreateJobDto): Promise<Job> {
		const query = `
      INSERT INTO jobs (
        request_id, provider_id, customer_id, proposal_id, status, started_at
      )
      VALUES ($1, $2, $3, $4, 'pending', NOW())
      RETURNING *
    `;

		const values = [
			dto.request_id,
			dto.provider_id,
			dto.customer_id, // ✅ NEW
			dto.proposal_id || null, // ✅ NEW
		];

		const result = await this.pool.query(query, values);
		return result.rows[0];
	}

	async getJobById(id: string): Promise<Job | null> {
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
		const query = `
      SELECT id, request_id, provider_id, status, started_at, completed_at
      FROM jobs
      WHERE request_id = $1
    `;

		const result = await this.pool.query(query, [requestId]);
		return result.rows[0] || null;
	}

	async getJobsPaginated(queryDto: JobQueryDto): Promise<Job[]> {
		const {
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

	async countJobs(queryDto: JobQueryDto): Promise<number> {
		const { provider_id, customer_id, request_id, status, started_from, started_to, completed_from, completed_to } =
			queryDto;

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
	async cancelJob(jobId: string, cancelledBy: string, reason: string): Promise<Job | null> {
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

	async getJobsByCancellationType(cancelledBy: string, limit: number = 20): Promise<Job[]> {
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

	async getJobsWithActualAmount(minAmount: number, maxAmount: number, limit: number = 20): Promise<Job[]> {
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

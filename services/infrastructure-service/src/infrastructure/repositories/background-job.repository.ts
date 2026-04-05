import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { BackgroundJob } from '../entities/background-job.entity';
import { CreateBackgroundJobDto } from '../dto/create-background-job.dto';
import { BackgroundJobQueryDto, BackgroundJobSortBy } from "../dto/background-job-query.dto";
import { ResolvedPagination } from "../../common/pagination/list-query-validation.util";
import { resolveId } from '@/common/utils/resolve-id.util';

@Injectable()
export class BackgroundJobRepository {
	constructor(@Inject("DATABASE_POOL") private readonly pool: Pool) {}

	async createJob(createJobDto: CreateBackgroundJobDto): Promise<BackgroundJob> {
		const query = `
      INSERT INTO background_jobs (job_type, payload, status, attempts)
      VALUES ($1, $2, 'pending', 0)
      RETURNING id, display_id as "displayId", job_type as "jobType", payload, status, attempts, last_error as "lastError", created_at as "createdAt", updated_at as "updatedAt", scheduled_for as "scheduledFor"
    `;

		const values = [createJobDto.jobType, createJobDto.payload || null];

		const result = await this.pool.query(query, values);
		return result.rows[0];
	}

	async getJobById(id: string): Promise<BackgroundJob | null> {
		id = await resolveId(this.pool, 'background_jobs', id);
		const query = `
      SELECT id, display_id as "displayId", job_type as "jobType", payload, status, attempts, last_error as "lastError", created_at as "createdAt", updated_at as "updatedAt", scheduled_for as "scheduledFor"
      FROM background_jobs
      WHERE id = $1
    `;

		const result = await this.pool.query(query, [id]);
		return result.rows[0] || null;
	}

	async getAllJobs(limit: number = 100, offset: number = 0): Promise<BackgroundJob[]> {
		const query = `
      SELECT id, display_id as "displayId", job_type as "jobType", payload, status, attempts, last_error as "lastError", created_at as "createdAt", updated_at as "updatedAt", scheduled_for as "scheduledFor"
      FROM background_jobs
      ORDER BY attempts ASC
      LIMIT $1 OFFSET $2
    `;

		const result = await this.pool.query(query, [limit, offset]);
		return result.rows;
	}

	async findJobs(queryDto: BackgroundJobQueryDto, pagination: ResolvedPagination): Promise<BackgroundJob[]> {
		const { whereClause, values, nextIndex } = this.buildWhereClause(queryDto);
		const sortColumn = this.getSortColumn(queryDto.sortBy);
		const sortOrder = queryDto.sortOrder?.toUpperCase() === "ASC" ? "ASC" : "DESC";
		const query = `
      SELECT id, display_id as "displayId", job_type as "jobType", payload, status, attempts, last_error as "lastError", created_at as "createdAt", updated_at as "updatedAt", scheduled_for as "scheduledFor"
      FROM background_jobs
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder} NULLS LAST, id ${sortOrder}
      LIMIT $${nextIndex} OFFSET $${nextIndex + 1}
    `;

		const result = await this.pool.query(query, [...values, pagination.limit, pagination.offset]);
		return result.rows;
	}

	async countJobs(queryDto: BackgroundJobQueryDto): Promise<number> {
		const { whereClause, values } = this.buildWhereClause(queryDto);
		const query = `SELECT COUNT(*)::int AS total FROM background_jobs ${whereClause}`;
		const result = await this.pool.query(query, values);
		return result.rows[0]?.total || 0;
	}

	async getJobsByStatus(status: string): Promise<BackgroundJob[]> {
		const query = `
      SELECT id, display_id as "displayId", job_type as "jobType", payload, status, attempts, last_error as "lastError", created_at as "createdAt", updated_at as "updatedAt", scheduled_for as "scheduledFor"
      FROM background_jobs
      WHERE status = $1
      ORDER BY attempts ASC
    `;

		const result = await this.pool.query(query, [status]);
		return result.rows;
	}

	async updateJobStatus(id: string, status: string): Promise<BackgroundJob | null> {
		id = await resolveId(this.pool, 'background_jobs', id);
		const query = `
      UPDATE background_jobs
      SET status = $1
      WHERE id = $2
      RETURNING id, display_id as "displayId", job_type as "jobType", payload, status, attempts, last_error as "lastError", created_at as "createdAt", updated_at as "updatedAt", scheduled_for as "scheduledFor"
    `;

		const result = await this.pool.query(query, [status, id]);
		return result.rows[0] || null;
	}

	async incrementJobAttempts(id: string): Promise<BackgroundJob | null> {
		id = await resolveId(this.pool, 'background_jobs', id);
		const query = `
      UPDATE background_jobs
      SET attempts = attempts + 1
      WHERE id = $1
      RETURNING id, display_id as "displayId", job_type as "jobType", payload, status, attempts, last_error as "lastError", created_at as "createdAt", updated_at as "updatedAt", scheduled_for as "scheduledFor"
    `;

		const result = await this.pool.query(query, [id]);
		return result.rows[0] || null;
	}

	async deleteJob(id: string): Promise<void> {
		id = await resolveId(this.pool, 'background_jobs', id);
		const query = `DELETE FROM background_jobs WHERE id = $1`;
		await this.pool.query(query, [id]);
	}

	async getJobsCount(): Promise<number> {
		const query = `SELECT COUNT(*) as count FROM background_jobs`;
		const result = await this.pool.query(query);
		return parseInt(result.rows[0].count) || 0;
	}

	private buildWhereClause(queryDto: BackgroundJobQueryDto): {
		whereClause: string;
		values: unknown[];
		nextIndex: number;
	} {
		const conditions: string[] = [];
		const values: unknown[] = [];

		if (queryDto.jobType) {
			values.push(queryDto.jobType);
			conditions.push(`job_type = $${values.length}`);
		}

		if (queryDto.status) {
			values.push(queryDto.status);
			conditions.push(`status = $${values.length}`);
		}

		if (queryDto.minAttempts !== undefined) {
			values.push(queryDto.minAttempts);
			conditions.push(`attempts >= $${values.length}`);
		}

		if (queryDto.maxAttempts !== undefined) {
			values.push(queryDto.maxAttempts);
			conditions.push(`attempts <= $${values.length}`);
		}

		if (queryDto.createdFrom) {
			values.push(queryDto.createdFrom);
			conditions.push(`created_at >= $${values.length}`);
		}

		if (queryDto.createdTo) {
			values.push(queryDto.createdTo);
			conditions.push(`created_at <= $${values.length}`);
		}

		if (queryDto.scheduledFrom) {
			values.push(queryDto.scheduledFrom);
			conditions.push(`scheduled_for >= $${values.length}`);
		}

		if (queryDto.scheduledTo) {
			values.push(queryDto.scheduledTo);
			conditions.push(`scheduled_for <= $${values.length}`);
		}

		return {
			whereClause: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
			values,
			nextIndex: values.length + 1,
		};
	}

	private getSortColumn(sortBy?: BackgroundJobSortBy): string {
		switch (sortBy) {
			case BackgroundJobSortBy.ATTEMPTS:
				return "attempts";
			case BackgroundJobSortBy.STATUS:
				return "status";
			case BackgroundJobSortBy.JOB_TYPE:
				return "job_type";
			case BackgroundJobSortBy.CREATED_AT:
				return "created_at";
			case BackgroundJobSortBy.SCHEDULED_FOR:
			default:
				return "scheduled_for";
		}
	}
}

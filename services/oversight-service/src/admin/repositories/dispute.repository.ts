import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { Dispute } from '../entities/dispute.entity';
import { DisputeListQueryDto, DisputeSortBy } from "../dto/dispute-list-query.dto";
import { ResolvedPagination } from "../../common/pagination/list-query-validation.util";

@Injectable()
export class DisputeRepository {
	constructor(@Inject("DATABASE_POOL") private readonly pool: Pool) {}

	async getDisputeById(id: string): Promise<Dispute | null> {
		const query = `
      SELECT id, job_id, opened_by, reason, status, 
             resolution, resolved_by, resolved_at, created_at
      FROM disputes
      WHERE id = $1
    `;

		const result = await this.pool.query(query, [id]);
		return result.rows[0] || null;
	}

	async getAllDisputes(limit: number = 50, offset: number = 0): Promise<Dispute[]> {
		const query = `
      SELECT id, job_id, opened_by, reason, status, 
             resolution, resolved_by, resolved_at, created_at
      FROM disputes
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

		const result = await this.pool.query(query, [limit, offset]);
		return result.rows;
	}

	async getDisputesByStatus(status: string): Promise<Dispute[]> {
		const query = `
      SELECT id, job_id, opened_by, reason, status, 
             resolution, resolved_by, resolved_at, created_at
      FROM disputes
      WHERE status = $1
      ORDER BY created_at DESC
    `;

		const result = await this.pool.query(query, [status]);
		return result.rows;
	}

	async updateDispute(id: string, status: string, resolution: string, resolvedBy: string): Promise<Dispute> {
		const query = `
      UPDATE disputes
      SET status = $1, resolution = $2, resolved_by = $3, resolved_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, job_id, opened_by, reason, status, 
                resolution, resolved_by, resolved_at, created_at
    `;

		const values = [status, resolution, resolvedBy, id];
		const result = await this.pool.query(query, values);
		return result.rows[0];
	}

	async getDisputeCount(): Promise<number> {
		const query = `SELECT COUNT(*) as count FROM disputes`;
		const result = await this.pool.query(query);
		return parseInt(result.rows[0].count) || 0;
	}

	async getDisputeStats(): Promise<{
		total: number;
		byStatus: { open: number; investigating: number; resolved: number; closed: number };
	}> {
		const query = `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'open')::int AS open,
        COUNT(*) FILTER (WHERE status = 'investigating')::int AS investigating,
        COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved,
        COUNT(*) FILTER (WHERE status = 'closed')::int AS closed
      FROM disputes
    `;
		const result = await this.pool.query(query);
		const row = result.rows[0];
		return {
			total: row.total || 0,
			byStatus: {
				open: row.open || 0,
				investigating: row.investigating || 0,
				resolved: row.resolved || 0,
				closed: row.closed || 0,
			},
		};
	}

	async findDisputes(queryDto: DisputeListQueryDto, pagination: ResolvedPagination): Promise<Dispute[]> {
		const { whereClause, values, nextIndex } = this.buildWhereClause(queryDto);
		const sortColumn = this.getSortColumn(queryDto.sortBy);
		const sortOrder = queryDto.sortOrder?.toUpperCase() === "ASC" ? "ASC" : "DESC";

		const query = `
      SELECT id, job_id, opened_by, reason, status,
             resolution, resolved_by, resolved_at, created_at
      FROM disputes
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}, id ${sortOrder}
      LIMIT $${nextIndex} OFFSET $${nextIndex + 1}
    `;

		const result = await this.pool.query(query, [...values, pagination.limit, pagination.offset]);
		return result.rows;
	}

	async countDisputes(queryDto: DisputeListQueryDto): Promise<number> {
		const { whereClause, values } = this.buildWhereClause(queryDto);
		const query = `SELECT COUNT(*)::int AS total FROM disputes ${whereClause}`;
		const result = await this.pool.query(query, values);
		return result.rows[0]?.total || 0;
	}

	private buildWhereClause(queryDto: DisputeListQueryDto): {
		whereClause: string;
		values: unknown[];
		nextIndex: number;
	} {
		const conditions: string[] = [];
		const values: unknown[] = [];

		if (queryDto.status) {
			values.push(queryDto.status);
			conditions.push(`status = $${values.length}`);
		}

		if (queryDto.jobId) {
			values.push(queryDto.jobId);
			conditions.push(`job_id = $${values.length}`);
		}

		if (queryDto.openedBy) {
			values.push(queryDto.openedBy);
			conditions.push(`opened_by = $${values.length}`);
		}

		if (queryDto.createdFrom) {
			values.push(queryDto.createdFrom);
			conditions.push(`created_at >= $${values.length}`);
		}

		if (queryDto.createdTo) {
			values.push(queryDto.createdTo);
			conditions.push(`created_at <= $${values.length}`);
		}

		return {
			whereClause: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
			values,
			nextIndex: values.length + 1,
		};
	}

	private getSortColumn(sortBy?: DisputeSortBy): string {
		switch (sortBy) {
			case DisputeSortBy.STATUS:
				return "status";
			case DisputeSortBy.RESOLVED_AT:
				return "resolved_at";
			case DisputeSortBy.CREATED_AT:
			default:
				return "created_at";
		}
	}
}

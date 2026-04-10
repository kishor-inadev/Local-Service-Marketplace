import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { AuditLog } from '../entities/audit-log.entity';
import { AuditLogQueryDto, AuditLogSortBy } from "../dto/audit-log-query.dto";
import { ResolvedPagination } from "../../common/pagination/list-query-validation.util";

@Injectable()
export class AuditLogRepository {
	constructor(@Inject("DATABASE_POOL") private readonly pool: Pool) {}

	async createAuditLog(
		userId: string,
		action: string,
		entity: string,
		entityId: string,
		metadata?: any,
	): Promise<AuditLog> {
		const query = `
      INSERT INTO audit_logs (user_id, action, entity, entity_id, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, action, entity, entity_id, metadata, created_at
    `;

		const values = [userId, action, entity, entityId, metadata || null];
		const result = await this.pool.query(query, values);
		return result.rows[0];
	}

	async getAuditLogs(limit: number = 100, offset: number = 0): Promise<AuditLog[]> {
		const query = `
      SELECT id, user_id, action, entity, entity_id, metadata, created_at
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

		const result = await this.pool.query(query, [limit, offset]);
		return result.rows;
	}

	async getAuditLogsByUserId(userId: string): Promise<AuditLog[]> {
		const query = `
      SELECT id, user_id, action, entity, entity_id, metadata, created_at
      FROM audit_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

		const result = await this.pool.query(query, [userId]);
		return result.rows;
	}

	async getAuditLogsByEntity(entity: string, entityId: string): Promise<AuditLog[]> {
		const query = `
      SELECT id, user_id, action, entity, entity_id, metadata, created_at
      FROM audit_logs
      WHERE entity = $1 AND entity_id = $2
      ORDER BY created_at DESC
    `;

		const result = await this.pool.query(query, [entity, entityId]);
		return result.rows;
	}

	async getAuditLogCount(): Promise<number> {
		const query = `SELECT COUNT(*) as count FROM audit_logs`;
		const result = await this.pool.query(query);
		return parseInt(result.rows[0].count) || 0;
	}

	async findAuditLogs(queryDto: AuditLogQueryDto, pagination: ResolvedPagination): Promise<AuditLog[]> {
		const { whereClause, values, nextIndex } = this.buildWhereClause(queryDto);
		const sortColumn = this.getSortColumn(queryDto.sortBy);
		const sortOrder = queryDto.sortOrder?.toUpperCase() === "ASC" ? "ASC" : "DESC";

		const query = `
      SELECT id, user_id, action, entity, entity_id, metadata, created_at
      FROM audit_logs
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}, id ${sortOrder}
      LIMIT $${nextIndex} OFFSET $${nextIndex + 1}
    `;

		const result = await this.pool.query(query, [...values, pagination.limit, pagination.offset]);
		return result.rows;
	}

	async countAuditLogs(queryDto: AuditLogQueryDto): Promise<number> {
		const { whereClause, values } = this.buildWhereClause(queryDto);
		const query = `SELECT COUNT(*)::int AS total FROM audit_logs ${whereClause}`;
		const result = await this.pool.query(query, values);
		return result.rows[0]?.total || 0;
	}

	private buildWhereClause(queryDto: AuditLogQueryDto): { whereClause: string; values: unknown[]; nextIndex: number } {
		const conditions: string[] = [];
		const values: unknown[] = [];

		if (queryDto.userId) {
			values.push(queryDto.userId);
			conditions.push(`user_id = $${values.length}`);
		}

		if (queryDto.action) {
			values.push(queryDto.action);
			conditions.push(`action = $${values.length}`);
		}

		if (queryDto.entity) {
			values.push(queryDto.entity);
			conditions.push(`entity = $${values.length}`);
		}

		if (queryDto.entityId) {
			values.push(queryDto.entityId);
			conditions.push(`entity_id = $${values.length}`);
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

	private getSortColumn(sortBy?: AuditLogSortBy): string {
		switch (sortBy) {
			case AuditLogSortBy.ACTION:
				return "action";
			case AuditLogSortBy.ENTITY:
				return "entity";
			case AuditLogSortBy.CREATED_AT:
			default:
				return "created_at";
		}
	}

	async deleteOlderThan(cutoff: Date): Promise<number> {
		const result = await this.pool.query(
			'DELETE FROM audit_logs WHERE created_at < $1',
			[cutoff],
		);
		return result.rowCount ?? 0;
	}
}

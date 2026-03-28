import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { SystemSetting } from '../entities/system-setting.entity';
import { SystemSettingQueryDto, SystemSettingSortBy } from "../dto/system-setting-query.dto";
import { ResolvedPagination } from "../../common/pagination/list-query-validation.util";

@Injectable()
export class SystemSettingRepository {
	constructor(@Inject("DATABASE_POOL") private readonly pool: Pool) {}

	async getAllSettings(): Promise<SystemSetting[]> {
		const query = `
      SELECT key, value, description, updated_at as "updatedAt"
      FROM system_settings
      ORDER BY key
    `;

		const result = await this.pool.query(query);
		return result.rows;
	}

	async getSettingByKey(key: string): Promise<SystemSetting | null> {
		const query = `
      SELECT key, value, description, updated_at as "updatedAt"
      FROM system_settings
      WHERE key = $1
    `;

		const result = await this.pool.query(query, [key]);
		return result.rows[0] || null;
	}

	async updateSetting(key: string, value: string): Promise<SystemSetting> {
		const query = `
      UPDATE system_settings
      SET value = $1, updated_at = CURRENT_TIMESTAMP
      WHERE key = $2
      RETURNING key, value, description, updated_at as "updatedAt"
    `;

		const result = await this.pool.query(query, [value, key]);
		return result.rows[0];
	}

	async createSetting(key: string, value: string, description?: string): Promise<SystemSetting> {
		const query = `
      INSERT INTO system_settings (key, value, description)
      VALUES ($1, $2, $3)
      RETURNING key, value, description, updated_at as "updatedAt"
    `;

		const result = await this.pool.query(query, [key, value, description]);
		return result.rows[0];
	}

	async findSettings(queryDto: SystemSettingQueryDto, pagination: ResolvedPagination): Promise<SystemSetting[]> {
		const { whereClause, values, nextIndex } = this.buildWhereClause(queryDto);
		const sortColumn = this.getSortColumn(queryDto.sortBy);
		const sortOrder = queryDto.sortOrder?.toUpperCase() === "ASC" ? "ASC" : "DESC";
		const query = `
      SELECT key, value, description, updated_at as "updatedAt"
      FROM system_settings
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}, key ${sortOrder}
      LIMIT $${nextIndex} OFFSET $${nextIndex + 1}
    `;

		const result = await this.pool.query(query, [...values, pagination.limit, pagination.offset]);
		return result.rows;
	}

	async countSettings(queryDto: SystemSettingQueryDto): Promise<number> {
		const { whereClause, values } = this.buildWhereClause(queryDto);
		const query = `SELECT COUNT(*)::int AS total FROM system_settings ${whereClause}`;
		const result = await this.pool.query(query, values);
		return result.rows[0]?.total || 0;
	}

	private buildWhereClause(queryDto: SystemSettingQueryDto): {
		whereClause: string;
		values: unknown[];
		nextIndex: number;
	} {
		const conditions: string[] = [];
		const values: unknown[] = [];

		if (queryDto.search) {
			values.push(`%${queryDto.search}%`);
			conditions.push(
				`(key ILIKE $${values.length} OR value ILIKE $${values.length} OR description ILIKE $${values.length})`,
			);
		}

		return {
			whereClause: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
			values,
			nextIndex: values.length + 1,
		};
	}

	private getSortColumn(sortBy?: SystemSettingSortBy): string {
		switch (sortBy) {
			case SystemSettingSortBy.UPDATED_AT:
				return "updated_at";
			case SystemSettingSortBy.KEY:
			default:
				return "key";
		}
	}
}

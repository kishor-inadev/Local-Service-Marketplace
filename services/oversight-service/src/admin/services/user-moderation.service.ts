import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Pool } from 'pg';
import { AdminActionRepository } from '../repositories/admin-action.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { NotFoundException } from '../../common/exceptions/http.exceptions';
import { UserListQueryDto, UserSortBy } from "../dto/user-list-query.dto";
import { resolvePagination, validateDateRange } from "../../common/pagination/list-query-validation.util";

export interface User {
	id: string;
	email: string;
	name: string;
	role: string;
	status: string;
	createdAt: Date;
}

@Injectable()
export class UserModerationService {
	constructor(
		@Inject("DATABASE_POOL") private readonly pool: Pool,
		private readonly adminActionRepository: AdminActionRepository,
		private readonly auditLogRepository: AuditLogRepository,
		@Inject(WINSTON_MODULE_NEST_PROVIDER)
		private readonly logger: LoggerService,
	) {}

	async getAllUsers(queryDto: UserListQueryDto): Promise<{ data: User[]; total: number; page: number; limit: number }> {
		validateDateRange(queryDto.createdFrom, queryDto.createdTo, "createdAt");
		const pagination = resolvePagination(queryDto, { page: 1, limit: 50 });
		this.logger.log(
			`Fetching users (page: ${pagination.page}, limit: ${pagination.limit}, offset: ${pagination.offset})`,
			"UserModerationService",
		);

		const { whereClause, values, nextIndex } = this.buildUserWhereClause(queryDto);
		const sortColumn = this.getSortColumn(queryDto.sortBy);
		const sortOrder = queryDto.sortOrder?.toUpperCase() === "ASC" ? "ASC" : "DESC";

		const query = `
      SELECT id, email, name, role, status, created_at as "createdAt", last_login_at as "lastLoginAt"
      FROM users
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder} NULLS LAST, id ${sortOrder}
      LIMIT $${nextIndex} OFFSET $${nextIndex + 1}
    `;

		const countQuery = `SELECT COUNT(*)::int AS total FROM users ${whereClause}`;

		const [result, countResult] = await Promise.all([
			this.pool.query(query, [...values, pagination.limit, pagination.offset]),
			this.pool.query(countQuery, values),
		]);

		return { data: result.rows, total: countResult.rows[0].total, page: pagination.page, limit: pagination.limit };
	}

	async getUserById(id: string): Promise<User> {
		this.logger.log(`Fetching user with ID ${id}`, "UserModerationService");

		const query = `
      SELECT id, email, name, role, status, created_at as "createdAt"
      FROM users
      WHERE id = $1 AND deleted_at IS NULL
    `;

		const result = await this.pool.query(query, [id]);

		if (!result.rows[0]) {
			throw new NotFoundException("User not found");
		}

		return result.rows[0];
	}

	async suspendUser(userId: string, adminId: string, suspended: boolean, reason?: string): Promise<User> {
		const newStatus = suspended ? "suspended" : "active";

		this.logger.log(`Setting user ${userId} status to '${newStatus}' by admin ${adminId}`, "UserModerationService");

		const query = `
      UPDATE users
      SET status = $1
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING id, email, name, role, status, created_at as "createdAt"
    `;

		const result = await this.pool.query(query, [newStatus, userId]);

		if (!result.rows[0]) {
			throw new NotFoundException("User not found");
		}

		await this.adminActionRepository.createAdminAction(
			adminId,
			suspended ? "suspend_user" : "unsuspend_user",
			"user",
			userId,
			reason || "No reason provided",
		);

		await this.auditLogRepository.createAuditLog(
			adminId,
			suspended ? "suspend_user" : "unsuspend_user",
			"user",
			userId,
			{ reason, status: newStatus },
		);

		this.logger.log(`User ${userId} status set to '${newStatus}' successfully`, "UserModerationService");

		return result.rows[0];
	}

	async getStats(): Promise<{ total: number; active: number; suspended: number; providers: number }> {
		this.logger.log("Fetching user stats", "UserModerationService");

		const query = `
      SELECT
        COUNT(*) FILTER (WHERE deleted_at IS NULL) AS total,
        COUNT(*) FILTER (WHERE status = 'active' AND deleted_at IS NULL) AS active,
        COUNT(*) FILTER (WHERE status = 'suspended' AND deleted_at IS NULL) AS suspended,
        COUNT(*) FILTER (WHERE role = 'provider' AND deleted_at IS NULL) AS providers
      FROM users
    `;

		const result = await this.pool.query(query);
		const row = result.rows[0];

		return {
			total: parseInt(row.total, 10),
			active: parseInt(row.active, 10),
			suspended: parseInt(row.suspended, 10),
			providers: parseInt(row.providers, 10),
		};
	}

	async activateUser(userId: string, adminId: string): Promise<User> {
		return this.suspendUser(userId, adminId, false, "Account activated by admin");
	}

	async searchUsers(queryDto: UserListQueryDto): Promise<{ data: User[]; total: number; page: number; limit: number }> {
		return this.getAllUsers(queryDto);
	}

	private buildUserWhereClause(queryDto: UserListQueryDto): {
		whereClause: string;
		values: unknown[];
		nextIndex: number;
	} {
		const conditions: string[] = ["deleted_at IS NULL"];
		const values: unknown[] = [];

		if (queryDto.search) {
			values.push(`%${queryDto.search}%`);
			conditions.push(`(email ILIKE $${values.length} OR name ILIKE $${values.length})`);
		}

		if (queryDto.role) {
			values.push(queryDto.role);
			conditions.push(`role = $${values.length}`);
		}

		if (queryDto.status) {
			values.push(queryDto.status);
			conditions.push(`status = $${values.length}`);
		}

		if (queryDto.createdFrom) {
			values.push(queryDto.createdFrom);
			conditions.push(`created_at >= $${values.length}`);
		}

		if (queryDto.createdTo) {
			values.push(queryDto.createdTo);
			conditions.push(`created_at <= $${values.length}`);
		}

		return { whereClause: `WHERE ${conditions.join(" AND ")}`, values, nextIndex: values.length + 1 };
	}

	private getSortColumn(sortBy?: UserSortBy): string {
		switch (sortBy) {
			case UserSortBy.EMAIL:
				return "email";
			case UserSortBy.NAME:
				return "name";
			case UserSortBy.ROLE:
				return "role";
			case UserSortBy.LAST_LOGIN_AT:
				return "last_login_at";
			case UserSortBy.CREATED_AT:
			default:
				return "created_at";
		}
	}
}

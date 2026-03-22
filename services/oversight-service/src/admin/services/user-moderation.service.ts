import { Injectable, Inject, LoggerService } from "@nestjs/common";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { Pool } from "pg";
import { AdminActionRepository } from "../repositories/admin-action.repository";
import { AuditLogRepository } from "../repositories/audit-log.repository";
import { NotFoundException } from "../../common/exceptions/http.exceptions";

export interface User {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	role: string;
	suspended: boolean;
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

	async getAllUsers(limit: number = 50, offset: number = 0): Promise<User[]> {
		this.logger.log(`Fetching users (limit: ${limit}, offset: ${offset})`, "UserModerationService");

		const query = `
      SELECT id, email, first_name as "firstName", last_name as "lastName", role, suspended, created_at as "createdAt"
      FROM users
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

		const result = await this.pool.query(query, [limit, offset]);
		return result.rows;
	}

	async getUserById(id: string): Promise<User> {
		this.logger.log(`Fetching user with ID ${id}`, "UserModerationService");

		const query = `
      SELECT id, email, first_name as "firstName", last_name as "lastName", role, suspended, created_at as "createdAt"
      FROM users
      WHERE id = $1
    `;

		const result = await this.pool.query(query, [id]);

		if (!result.rows[0]) {
			throw new NotFoundException("User not found");
		}

		return result.rows[0];
	}

	async suspendUser(userId: string, adminId: string, suspended: boolean, reason?: string): Promise<User> {
		this.logger.log(
			`${suspended ? "Suspending" : "Unsuspending"} user ${userId} by admin ${adminId}`,
			"UserModerationService",
		);

		// Update user suspension status
		const query = `
      UPDATE users
      SET suspended = $1
      WHERE id = $2
      RETURNING id, email, first_name as "firstName", last_name as "lastName", role, suspended, created_at as "createdAt"
    `;

		const result = await this.pool.query(query, [suspended, userId]);

		if (!result.rows[0]) {
			throw new NotFoundException("User not found");
		}

		// Log admin action
		await this.adminActionRepository.createAdminAction(
			adminId,
			suspended ? "suspend_user" : "unsuspend_user",
			"user",
			userId,
			reason || "No reason provided",
		);

		// Create audit log
		await this.auditLogRepository.createAuditLog(
			adminId,
			suspended ? "suspend_user" : "unsuspend_user",
			"user",
			userId,
			{ reason, suspended },
		);

		this.logger.log(`User ${userId} ${suspended ? "suspended" : "unsuspended"} successfully`, "UserModerationService");

		return result.rows[0];
	}

	async searchUsers(query: string): Promise<User[]> {
		this.logger.log(`Searching users with query: ${query}`, "UserModerationService");

		const sql = `
      SELECT id, email, first_name as "firstName", last_name as "lastName", role, suspended, created_at as "createdAt"
      FROM users
      WHERE email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1
      ORDER BY created_at DESC
      LIMIT 50
    `;

		const result = await this.pool.query(sql, [`%${query}%`]);
		return result.rows;
	}

	async activateUser(userId: string, adminId: string): Promise<User> {
		return this.suspendUser(userId, adminId, false);
	}

	async getStats(): Promise<any> {
		this.logger.log("Fetching admin stats", "UserModerationService");
		const result = await this.pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) AS total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'provider' AND deleted_at IS NULL) AS total_providers,
        (SELECT COUNT(*) FROM users WHERE role = 'customer' AND deleted_at IS NULL) AS total_customers,
        (SELECT COUNT(*) FROM users WHERE suspended = true) AS suspended_users
    `);
		return result.rows[0];
	}
}

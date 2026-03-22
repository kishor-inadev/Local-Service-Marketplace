import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Pool } from 'pg';
import { AdminActionRepository } from '../repositories/admin-action.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { NotFoundException } from '../../common/exceptions/http.exceptions';

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
		@Inject('DATABASE_POOL') private readonly pool: Pool,
		private readonly adminActionRepository: AdminActionRepository,
		private readonly auditLogRepository: AuditLogRepository,
		@Inject(WINSTON_MODULE_NEST_PROVIDER)
		private readonly logger: LoggerService,
	) { }

	async getAllUsers(
		limit: number = 50,
		offset: number = 0,
	): Promise<User[]> {
		this.logger.log(
			`Fetching users (limit: ${limit}, offset: ${offset})`,
			'UserModerationService',
		);

		const query = `
      SELECT id, email, name, role, status, created_at as "createdAt"
      FROM users
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

		const result = await this.pool.query(query, [limit, offset]);
		return result.rows;
	}

	async getUserById(id: string): Promise<User> {
		this.logger.log(`Fetching user with ID ${id}`, 'UserModerationService');

		const query = `
      SELECT id, email, name, role, status, created_at as "createdAt"
      FROM users
      WHERE id = $1 AND deleted_at IS NULL
    `;

		const result = await this.pool.query(query, [id]);

		if (!result.rows[0]) {
			throw new NotFoundException('User not found');
		}

		return result.rows[0];
	}

	async suspendUser(
		userId: string,
		adminId: string,
		suspended: boolean,
		reason?: string,
	): Promise<User> {
		const newStatus = suspended ? 'suspended' : 'active';

		this.logger.log(
			`Setting user ${userId} status to '${newStatus}' by admin ${adminId}`,
			'UserModerationService',
		);

		const query = `
      UPDATE users
      SET status = $1
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING id, email, name, role, status, created_at as "createdAt"
    `;

		const result = await this.pool.query(query, [newStatus, userId]);

		if (!result.rows[0]) {
			throw new NotFoundException('User not found');
		}

		await this.adminActionRepository.createAdminAction(
			adminId,
			suspended ? 'suspend_user' : 'unsuspend_user',
			'user',
			userId,
			reason || 'No reason provided',
		);

		await this.auditLogRepository.createAuditLog(
			adminId,
			suspended ? 'suspend_user' : 'unsuspend_user',
			'user',
			userId,
			{ reason, status: newStatus },
		);

		this.logger.log(
			`User ${userId} status set to '${newStatus}' successfully`,
			'UserModerationService',
		);

		return result.rows[0];
	}

	async searchUsers(query: string): Promise<User[]> {
		this.logger.log(`Searching users with query: ${query}`, 'UserModerationService');

		const sql = `
      SELECT id, email, name, role, status, created_at as "createdAt"
      FROM users
      WHERE deleted_at IS NULL
        AND (email ILIKE $1 OR name ILIKE $1)
      ORDER BY created_at DESC
      LIMIT 50
    `;

		const result = await this.pool.query(sql, [`%${query}%`]);
		return result.rows;
	}
}

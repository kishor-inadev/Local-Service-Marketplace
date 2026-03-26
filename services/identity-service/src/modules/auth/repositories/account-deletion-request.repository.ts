import { Injectable, Inject } from "@nestjs/common";
import { Pool } from "pg";
import { DATABASE_POOL } from "@/common/database/database.module";
import { AccountDeletionRequest } from "../entities/account-deletion-request.entity";

@Injectable()
export class AccountDeletionRequestRepository {
	constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

	async create(userId: string, reason?: string): Promise<AccountDeletionRequest> {
		const query = `
      INSERT INTO account_deletion_requests (user_id, reason)
      VALUES ($1, $2)
      RETURNING *
    `;
		const result = await this.pool.query(query, [userId, reason]);
		return result.rows[0];
	}

	async findByUserId(userId: string): Promise<AccountDeletionRequest | null> {
		const query = `
      SELECT * FROM account_deletion_requests 
      WHERE user_id = $1 
      ORDER BY requested_at DESC 
      LIMIT 1
    `;
		const result = await this.pool.query(query, [userId]);
		return result.rows[0] || null;
	}

	async cancel(userId: string, reason?: string): Promise<void> {
		const query = `
      UPDATE account_deletion_requests 
      SET cancelled_at = NOW(), cancellation_reason = $2
      WHERE user_id = $1 AND completed_at IS NULL
    `;
		await this.pool.query(query, [userId, reason]);
	}

	async complete(userId: string): Promise<void> {
		const query = `
      UPDATE account_deletion_requests 
      SET completed_at = NOW()
      WHERE user_id = $1 AND completed_at IS NULL
    `;
		await this.pool.query(query, [userId]);
	}

	async getPendingRequests(limit: number = 100): Promise<AccountDeletionRequest[]> {
		const query = `
      SELECT adr.*, u.email, u.name
      FROM account_deletion_requests adr
      JOIN users u ON adr.user_id = u.id
      WHERE adr.completed_at IS NULL AND adr.cancelled_at IS NULL
      ORDER BY adr.requested_at ASC
      LIMIT $1
    `;
		const result = await this.pool.query(query, [limit]);
		return result.rows;
	}
}

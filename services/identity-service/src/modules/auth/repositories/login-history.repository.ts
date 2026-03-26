import { Injectable, Inject } from "@nestjs/common";
import { Pool } from "pg";
import { DATABASE_POOL } from "@/common/database/database.module";
import { LoginHistory } from "../entities/login-history.entity";

@Injectable()
export class LoginHistoryRepository {
	constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

	async create(history: {
		user_id?: string;
		ip_address?: string;
		user_agent?: string;
		location?: string;
		device_type?: string;
		success: boolean;
		failure_reason?: string;
	}): Promise<LoginHistory> {
		const query = `
      INSERT INTO login_history (user_id, ip_address, user_agent, location, device_type, success, failure_reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
		const result = await this.pool.query(query, [
			history.user_id,
			history.ip_address,
			history.user_agent,
			history.location,
			history.device_type,
			history.success,
			history.failure_reason,
		]);
		return result.rows[0];
	}

	async findByUserId(userId: string, limit: number = 50, offset: number = 0): Promise<LoginHistory[]> {
		const query = `
      SELECT * FROM login_history
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
		const result = await this.pool.query(query, [userId, limit, offset]);
		return result.rows;
	}

	async getRecentFailedAttempts(
		identifier: string, // email or IP
		hours: number = 24,
	): Promise<number> {
		const query = `
      SELECT COUNT(*) as count
      FROM login_history lh
      JOIN users u ON lh.user_id = u.id
      WHERE lh.success = false
        AND lh.created_at > NOW() - INTERVAL '1 hour' * $1
        AND (u.email = $2 OR lh.ip_address = $2)
    `;
		const result = await this.pool.query(query, [hours, identifier]);
		return parseInt(result.rows[0].count, 10);
	}
}

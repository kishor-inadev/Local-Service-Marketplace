import { Injectable, Inject } from "@nestjs/common";
import { Pool } from "pg";
import { DATABASE_POOL } from "@/common/database/database.module";
import { MagicLinkToken } from "../entities/magic-link-token.entity";

@Injectable()
export class MagicLinkTokenRepository {
	constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

	async create(email: string, token: string, expiresAt: Date, userId?: string): Promise<MagicLinkToken> {
		const query = `
      INSERT INTO magic_link_tokens (user_id, email, token, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
		const result = await this.pool.query(query, [userId, email, token, expiresAt]);
		return result.rows[0];
	}

	async findByToken(token: string): Promise<MagicLinkToken | null> {
		const query = `
      SELECT * FROM magic_link_tokens 
      WHERE token = $1 
        AND expires_at > NOW() 
        AND used_at IS NULL
    `;
		const result = await this.pool.query(query, [token]);
		return result.rows[0] || null;
	}

	async markAsUsed(tokenId: string): Promise<void> {
		const query = `
      UPDATE magic_link_tokens 
      SET used_at = NOW()
      WHERE id = $1
    `;
		await this.pool.query(query, [tokenId]);
	}

	async deleteExpired(): Promise<void> {
		const query = "DELETE FROM magic_link_tokens WHERE expires_at < NOW()";
		await this.pool.query(query);
	}
}

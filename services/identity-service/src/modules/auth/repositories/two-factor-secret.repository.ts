import { Injectable, Inject } from "@nestjs/common";
import { Pool } from "pg";
import { DATABASE_POOL } from "@/common/database/database.module";
import { TwoFactorSecret } from "../entities/two-factor-secret.entity";

@Injectable()
export class TwoFactorSecretRepository {
	constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

	async findByUserId(userId: string): Promise<TwoFactorSecret | null> {
		const query = "SELECT * FROM two_factor_secrets WHERE user_id = $1";
		const result = await this.pool.query(query, [userId]);
		return result.rows[0] || null;
	}

	async create(userId: string, secret: string, backupCodes: string[] = []): Promise<TwoFactorSecret> {
		const query = `
      INSERT INTO two_factor_secrets (user_id, secret, backup_codes, enabled)
      VALUES ($1, $2, $3, false)
      RETURNING *
    `;
		const result = await this.pool.query(query, [userId, secret, backupCodes]);
		return result.rows[0];
	}

	async enable(userId: string): Promise<void> {
		const query = `
      UPDATE two_factor_secrets 
      SET enabled = true, updated_at = NOW()
      WHERE user_id = $1
    `;
		await this.pool.query(query, [userId]);
	}

	async disable(userId: string): Promise<void> {
		const query = `
      UPDATE two_factor_secrets 
      SET enabled = false, updated_at = NOW(), backup_codes = '[]'
      WHERE user_id = $1
    `;
		await this.pool.query(query, [userId]);
	}

	async updateSecret(userId: string, secret: string): Promise<void> {
		const query = `
      UPDATE two_factor_secrets 
      SET secret = $1, updated_at = NOW()
      WHERE user_id = $2
    `;
		await this.pool.query(query, [secret, userId]);
	}

	async updateBackupCodes(userId: string, backupCodes: string[]): Promise<void> {
		const query = `
      UPDATE two_factor_secrets 
      SET backup_codes = $1, updated_at = NOW()
      WHERE user_id = $2
    `;
		await this.pool.query(query, [backupCodes, userId]);
	}

	async consumeBackupCode(userId: string, code: string): Promise<boolean> {
		// Find and remove the used backup code
		const query = `
      UPDATE two_factor_secrets
      SET backup_codes = array_remove(backup_codes, $1),
          updated_at = NOW()
      WHERE user_id = $2
        AND $1 = ANY(backup_codes)
      RETURNING id
    `;
		const result = await this.pool.query(query, [code, userId]);
		return result.rows.length > 0;
	}

	async is2FAEnabled(userId: string): Promise<boolean> {
		const query = `
      SELECT enabled FROM two_factor_secrets 
      WHERE user_id = $1 AND enabled = true
    `;
		const result = await this.pool.query(query, [userId]);
		return result.rows.length > 0;
	}
}

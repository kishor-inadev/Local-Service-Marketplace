import { Injectable, Inject } from "@nestjs/common";
import { Pool } from "pg";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";
import { Unsubscribe } from "../entities/unsubscribe.entity";

@Injectable()
export class UnsubscribeRepository {
  constructor(
    @Inject("DATABASE_POOL") private pool: Pool,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async create(
    email: string,
    userId?: string,
    reason?: string,
  ): Promise<Unsubscribe> {
    const query = `
      INSERT INTO unsubscribes (email, user_id, reason)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      email,
      userId || null,
      reason || null,
    ]);

    this.logger.info("Created unsubscribe record", {
      context: "UnsubscribeRepository",
      email,
    });

    return result.rows[0];
  }

  async findByEmail(email: string): Promise<Unsubscribe | null> {
    const query = `
      SELECT * FROM unsubscribes
      WHERE email = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await this.pool.query(query, [email]);
    return result.rows[0] || null;
  }

  async isUnsubscribed(email: string): Promise<boolean> {
    const record = await this.findByEmail(email);
    return record !== null;
  }

  async delete(email: string): Promise<void> {
    const query = `
      DELETE FROM unsubscribes
      WHERE email = $1
    `;

    await this.pool.query(query, [email]);

    this.logger.info("Deleted unsubscribe record (resubscribed)", {
      context: "UnsubscribeRepository",
      email,
    });
  }
}

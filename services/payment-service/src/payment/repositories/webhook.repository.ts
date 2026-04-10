import { Injectable, Inject } from "@nestjs/common";
import { Pool } from "pg";
import { PaymentWebhook } from "../entities/payment-webhook.entity";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class WebhookRepository {
  constructor(@Inject("DATABASE_POOL") private pool: Pool) {}

  async createWebhook(
    gateway: string,
    payload: Record<string, any>,
  ): Promise<PaymentWebhook> {
    const id = uuidv4();
    const query = `
      INSERT INTO payment_webhooks (id, gateway, payload, processed, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;
    const values = [id, gateway, JSON.stringify(payload), false];
    const result = await this.pool.query(query, values);
    return new PaymentWebhook({
      id: result.rows[0].id,
      gateway: result.rows[0].gateway,
      payload: result.rows[0].payload,
      processed: result.rows[0].processed,
      created_at: result.rows[0].created_at,
    });
  }

  async getWebhookById(id: string): Promise<PaymentWebhook | null> {
    const query = "SELECT * FROM payment_webhooks WHERE id = $1";
    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return new PaymentWebhook({
      id: result.rows[0].id,
      gateway: result.rows[0].gateway,
      payload: result.rows[0].payload,
      processed: result.rows[0].processed,
      created_at: result.rows[0].created_at,
    });
  }

  async markWebhookAsProcessed(id: string): Promise<PaymentWebhook> {
    const query = `
      UPDATE payment_webhooks 
      SET processed = true
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.pool.query(query, [id]);
    return new PaymentWebhook({
      id: result.rows[0].id,
      gateway: result.rows[0].gateway,
      payload: result.rows[0].payload,
      processed: result.rows[0].processed,
      created_at: result.rows[0].created_at,
    });
  }

  async markProcessed(id: string): Promise<void> {
    await this.pool.query(
      'UPDATE payment_webhooks SET processed = true, processed_at = NOW() WHERE id = $1',
      [id],
    );
  }

  async markFailed(id: string, errorMessage: string): Promise<void> {
    await this.pool.query(
      'UPDATE payment_webhooks SET processed = false, error_message = $2 WHERE id = $1',
      [id, errorMessage],
    );
  }

  async deleteProcessedBefore(cutoff: Date): Promise<number> {
    const result = await this.pool.query(
      'DELETE FROM payment_webhooks WHERE processed = true AND created_at < $1',
      [cutoff],
    );
    return result.rowCount ?? 0;
  }

  async getUnprocessedWebhooks(): Promise<PaymentWebhook[]> {
    const query =
      "SELECT * FROM payment_webhooks WHERE processed = false ORDER BY created_at ASC";
    const result = await this.pool.query(query);
    return result.rows.map(
      (row) =>
        new PaymentWebhook({
          id: row.id,
          gateway: row.gateway,
          payload: row.payload,
          processed: row.processed,
          created_at: row.created_at,
        }),
    );
  }
}

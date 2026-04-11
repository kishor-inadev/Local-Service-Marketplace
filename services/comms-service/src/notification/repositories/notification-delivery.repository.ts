import { Injectable, Inject } from "@nestjs/common";
import { Pool } from "pg";
import { NotificationDelivery } from "../entities/notification-delivery.entity";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class NotificationDeliveryRepository {
  constructor(@Inject("DATABASE_POOL") private pool: Pool) {}

  async createDelivery(
    notificationId: string,
    channel: string,
    status: string,
  ): Promise<NotificationDelivery> {
    const id = uuidv4();
    const query = `
      INSERT INTO notification_deliveries (id, notification_id, channel, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [id, notificationId, channel, status];
    const result = await this.pool.query(query, values);
    return new NotificationDelivery({
      id: result.rows[0].id,
      notification_id: result.rows[0].notification_id,
      channel: result.rows[0].channel,
      status: result.rows[0].status,
    });
  }

  async getDeliveryById(id: string): Promise<NotificationDelivery | null> {
    const query = "SELECT * FROM notification_deliveries WHERE id = $1";
    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return new NotificationDelivery({
      id: result.rows[0].id,
      notification_id: result.rows[0].notification_id,
      channel: result.rows[0].channel,
      status: result.rows[0].status,
    });
  }

  async getDeliveriesByNotificationId(
    notificationId: string,
  ): Promise<NotificationDelivery[]> {
    const query =
      "SELECT * FROM notification_deliveries WHERE notification_id = $1 ORDER BY created_at ASC";
    const result = await this.pool.query(query, [notificationId]);
    return result.rows.map(
      (row) =>
        new NotificationDelivery({
          id: row.id,
          notification_id: row.notification_id,
          channel: row.channel,
          status: row.status,
        }),
    );
  }

  async updateDeliveryStatus(
    id: string,
    status: string,
  ): Promise<NotificationDelivery> {
    const query = `
      UPDATE notification_deliveries 
      SET status = $1 
      WHERE id = $2 
      RETURNING *
    `;
    const result = await this.pool.query(query, [status, id]);
    return new NotificationDelivery({
      id: result.rows[0].id,
      notification_id: result.rows[0].notification_id,
      channel: result.rows[0].channel,
      status: result.rows[0].status,
    });
  }

  async getPendingDeliveries(): Promise<NotificationDelivery[]> {
    // Only pick up deliveries older than 5 minutes to avoid re-enqueuing jobs
    // that are currently being processed by the BullMQ workers.
    const query =
      "SELECT * FROM notification_deliveries WHERE status = $1 AND created_at < NOW() - INTERVAL '5 minutes' ORDER BY created_at ASC LIMIT 100";
    const result = await this.pool.query(query, ["pending"]);
    return result.rows.map(
      (row) =>
        new NotificationDelivery({
          id: row.id,
          notification_id: row.notification_id,
          channel: row.channel,
          status: row.status,
        }),
    );
  }

  async deleteFailedOlderThan(cutoff: Date): Promise<number> {
    const query =
      "DELETE FROM notification_deliveries WHERE status = 'failed' AND created_at < $1";
    const result = await this.pool.query(query, [cutoff]);
    return result.rowCount ?? 0;
  }
}

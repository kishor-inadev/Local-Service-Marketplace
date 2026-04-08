import { Injectable, Inject, BadRequestException } from "@nestjs/common";
import { Pool } from "pg";
import { NotificationPreferences } from "../entities/notification-preferences.entity";
import { UpdateNotificationPreferencesDto } from "../dto/update-notification-preferences.dto";

const ALLOWED_PREFERENCE_COLUMNS: Record<string, string> = {
  email_notifications: "email_notifications",
  sms_notifications: "sms_notifications",
  push_notifications: "push_notifications",
  marketing_emails: "marketing_emails",
  new_request_alerts: "new_request_alerts",
  proposal_alerts: "proposal_alerts",
  job_updates: "job_updates",
  payment_alerts: "payment_alerts",
  review_alerts: "review_alerts",
  message_alerts: "message_alerts",
};

@Injectable()
export class NotificationPreferencesRepository {
  constructor(@Inject("DATABASE_POOL") private readonly pool: Pool) {}

  async create(userId: string): Promise<NotificationPreferences> {
    const query = `
      INSERT INTO notification_preferences (
        user_id, email_notifications, sms_notifications, push_notifications,
        marketing_emails, new_request_alerts, proposal_alerts, job_updates,
        payment_alerts, review_alerts, message_alerts
      )
      VALUES ($1, true, true, true, false, true, true, true, true, true, true)
      RETURNING *
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows[0];
  }

  async findByUserId(userId: string): Promise<NotificationPreferences | null> {
    const query = `SELECT * FROM notification_preferences WHERE user_id = $1`;
    const result = await this.pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  async update(
    userId: string,
    data: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferences> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && ALLOWED_PREFERENCE_COLUMNS[key]) {
        updates.push(`${ALLOWED_PREFERENCE_COLUMNS[key]} = $${paramIndex++}`);
        values.push(data[key]);
      }
    });

    if (updates.length === 0) {
      return this.findByUserId(userId);
    }

    updates.push("updated_at = NOW()");
    values.push(userId);

    const query = `
      UPDATE notification_preferences
      SET ${updates.join(", ")}
      WHERE user_id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async delete(userId: string): Promise<void> {
    const query = `DELETE FROM notification_preferences WHERE user_id = $1`;
    await this.pool.query(query, [userId]);
  }

  async getUsersWithPreference(
    preferenceName: string,
    enabled: boolean = true,
  ): Promise<NotificationPreferences[]> {
    const column = ALLOWED_PREFERENCE_COLUMNS[preferenceName];
    if (!column) {
      throw new BadRequestException(
        `Invalid preference name: ${preferenceName}`,
      );
    }

    const query = `
      SELECT * FROM notification_preferences
      WHERE ${column} = $1
      ORDER BY created_at DESC
    `;
    const result = await this.pool.query(query, [enabled]);
    return result.rows;
  }
}

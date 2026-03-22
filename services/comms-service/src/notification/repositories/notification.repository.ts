import { Injectable, Inject } from "@nestjs/common";
import { Pool } from "pg";
import { Notification } from "../entities/notification.entity";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class NotificationRepository {
	constructor(@Inject("DATABASE_POOL") private pool: Pool) {}

	async createNotification(userId: string, type: string, message: string): Promise<Notification> {
		const id = uuidv4();
		const query = `
      INSERT INTO notifications (id, user_id, type, message, read, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
		const values = [id, userId, type, message, false];
		const result = await this.pool.query(query, values);
		return new Notification({
			id: result.rows[0].id,
			user_id: result.rows[0].user_id,
			type: result.rows[0].type,
			message: result.rows[0].message,
			read: result.rows[0].read,
			created_at: result.rows[0].created_at,
		});
	}

	async getNotificationById(id: string): Promise<Notification | null> {
		const query = "SELECT * FROM notifications WHERE id = $1";
		const result = await this.pool.query(query, [id]);
		if (result.rows.length === 0) {
			return null;
		}
		return new Notification({
			id: result.rows[0].id,
			user_id: result.rows[0].user_id,
			type: result.rows[0].type,
			message: result.rows[0].message,
			read: result.rows[0].read,
			created_at: result.rows[0].created_at,
		});
	}

	async getNotificationsByUserId(userId: string, limit: number = 50): Promise<Notification[]> {
		const query = `
      SELECT * FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
		const result = await this.pool.query(query, [userId, limit]);
		return result.rows.map(
			(row) =>
				new Notification({
					id: row.id,
					user_id: row.user_id,
					type: row.type,
					message: row.message,
					read: row.read,
					created_at: row.created_at,
				}),
		);
	}

	async markAsRead(id: string): Promise<Notification> {
		const query = `
      UPDATE notifications 
      SET read = true 
      WHERE id = $1 
      RETURNING *
    `;
		const result = await this.pool.query(query, [id]);
		return new Notification({
			id: result.rows[0].id,
			user_id: result.rows[0].user_id,
			type: result.rows[0].type,
			message: result.rows[0].message,
			read: result.rows[0].read,
			created_at: result.rows[0].created_at,
		});
	}

	async getUnreadCount(userId: string): Promise<number> {
		const query = "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false";
		const result = await this.pool.query(query, [userId]);
		return parseInt(result.rows[0].count);
	}

	async markAllAsRead(userId: string): Promise<void> {
		const query = "UPDATE notifications SET read = true WHERE user_id = $1 AND read = false";
		await this.pool.query(query, [userId]);
	}

	async deleteNotification(id: string): Promise<void> {
		const query = "DELETE FROM notifications WHERE id = $1";
		await this.pool.query(query, [id]);
	}
}

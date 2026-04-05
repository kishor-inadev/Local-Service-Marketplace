import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { Message } from '../entities/message.entity';
import { v4 as uuidv4 } from 'uuid';
import { resolveId } from '@/common/utils/resolve-id.util';

export interface PaginatedMessages {
  data: Message[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

@Injectable()
export class MessageRepository {
  constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

  async createMessage(jobId: string, senderId: string, message: string): Promise<Message> {
    jobId = await resolveId(this.pool, 'jobs', jobId);
    const id = uuidv4();
    const query = `
      INSERT INTO messages (id, job_id, sender_id, message, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;
    const values = [id, jobId, senderId, message];
    const result = await this.pool.query(query, values);
    return new Message({
			id: result.rows[0].id,
			display_id: result.rows[0].display_id,
			job_id: result.rows[0].job_id,
			sender_id: result.rows[0].sender_id,
			message: result.rows[0].message,
			created_at: result.rows[0].created_at,
		});
  }

  async getMessageById(id: string): Promise<Message | null> {
    id = await resolveId(this.pool, 'messages', id);
    const query = 'SELECT * FROM messages WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return new Message({
			id: result.rows[0].id,
			display_id: result.rows[0].display_id,
			job_id: result.rows[0].job_id,
			sender_id: result.rows[0].sender_id,
			message: result.rows[0].message,
			created_at: result.rows[0].created_at,
		});
  }

  async getMessagesForJob(
    jobId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedMessages> {
		jobId = await resolveId(this.pool, 'jobs', jobId);
		const offset = (page - 1) * limit;

		// Single query: COUNT(*) OVER() avoids a separate COUNT round-trip
		const query = `
      SELECT *, COUNT(*) OVER() AS total_count
      FROM messages 
      WHERE job_id = $1 
      ORDER BY created_at ASC 
      LIMIT $2 OFFSET $3
    `;
		const result = await this.pool.query(query, [jobId, limit, offset]);

		const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;
		const messages = result.rows.map(
			(row) =>
				new Message({
					id: row.id,
					display_id: row.display_id,
					job_id: row.job_id,
					sender_id: row.sender_id,
					message: row.message,
					created_at: row.created_at,
				}),
		);

		return { data: messages, total, page, limit, hasMore: offset + messages.length < total };
	}

  async deleteMessage(id: string): Promise<void> {
    const query = 'DELETE FROM messages WHERE id = $1';
    await this.pool.query(query, [id]);
  }

  async getUserConversations(userId: string): Promise<any[]> {
		// Uses CTEs + DISTINCT ON to avoid 3 correlated subqueries per row (O(3N) problem).
		// conversations CTE scopes all relevant job_ids first, then last_messages uses
		// DISTINCT ON for an efficient index scan, and unread_counts aggregates once per job.
		const query = `
      WITH conversations AS (
        SELECT DISTINCT m.job_id
        FROM messages m
        JOIN jobs j ON j.id = m.job_id
        WHERE m.sender_id = $1 OR j.customer_id = $1 OR j.provider_id = $1
        LIMIT 200
      ),
      last_messages AS (
        SELECT DISTINCT ON (m.job_id)
          m.job_id,
          m.message  AS last_message,
          m.created_at AS last_message_at
        FROM messages m
        JOIN conversations c ON c.job_id = m.job_id
        ORDER BY m.job_id, m.created_at DESC
      ),
      unread_counts AS (
        SELECT m.job_id, COUNT(*)::int AS unread_count
        FROM messages m
        JOIN conversations c ON c.job_id = m.job_id
        WHERE m.read = false AND m.sender_id != $1
        GROUP BY m.job_id
      )
      SELECT
        j.id          AS job_id,
        j.status      AS job_status,
        j.request_id,
        j.provider_id,
        j.customer_id,
        lm.last_message,
        lm.last_message_at,
        COALESCE(uc.unread_count, 0) AS unread_count
      FROM conversations conv
      JOIN jobs j ON j.id = conv.job_id
      JOIN last_messages lm ON lm.job_id = conv.job_id
      LEFT JOIN unread_counts uc ON uc.job_id = conv.job_id
      ORDER BY lm.last_message_at DESC
      LIMIT 50
    `;
		const result = await this.pool.query(query, [userId]);
		return result.rows;
	}

  // ✅ NEW: Advanced query methods for new fields
  async markAsRead(messageId: string): Promise<Message> {
    const query = `
      UPDATE messages 
      SET read = true, read_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.pool.query(query, [messageId]);
    return new Message({
			id: result.rows[0].id,
			display_id: result.rows[0].display_id,
			job_id: result.rows[0].job_id,
			sender_id: result.rows[0].sender_id,
			message: result.rows[0].message,
			read: result.rows[0].read,
			read_at: result.rows[0].read_at,
			edited: result.rows[0].edited,
			edited_at: result.rows[0].edited_at,
			created_at: result.rows[0].created_at,
		});
  }

  async markMultipleAsRead(messageIds: string[]): Promise<void> {
    const query = `
      UPDATE messages 
      SET read = true, read_at = NOW()
      WHERE id = ANY($1::uuid[])
    `;
    await this.pool.query(query, [messageIds]);
  }

  async editMessage(messageId: string, newMessage: string): Promise<Message> {
    const query = `
      UPDATE messages 
      SET message = $1, edited = true, edited_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await this.pool.query(query, [newMessage, messageId]);
    return new Message({
			id: result.rows[0].id,
			display_id: result.rows[0].display_id,
			job_id: result.rows[0].job_id,
			sender_id: result.rows[0].sender_id,
			message: result.rows[0].message,
			read: result.rows[0].read,
			read_at: result.rows[0].read_at,
			edited: result.rows[0].edited,
			edited_at: result.rows[0].edited_at,
			created_at: result.rows[0].created_at,
		});
  }

  async getUnreadMessages(jobId: string, userId: string): Promise<Message[]> {
    const query = `
      SELECT * FROM messages
      WHERE job_id = $1
        AND sender_id != $2
        AND read = false
      ORDER BY created_at ASC
    `;
    const result = await this.pool.query(query, [jobId, userId]);
    return result.rows.map(
			(row) =>
				new Message({
					id: row.id,
					display_id: row.display_id,
					job_id: row.job_id,
					sender_id: row.sender_id,
					message: row.message,
					read: row.read,
					read_at: row.read_at,
					edited: row.edited,
					edited_at: row.edited_at,
					created_at: row.created_at,
				}),
		);
  }

  async getUnreadCount(jobId: string, userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM messages
      WHERE job_id = $1
        AND sender_id != $2
        AND read = false
    `;
    const result = await this.pool.query(query, [jobId, userId]);
    return parseInt(result.rows[0].count, 10);
  }

  async getEditedMessages(jobId: string): Promise<Message[]> {
    const query = `
      SELECT * FROM messages
      WHERE job_id = $1
        AND edited = true
      ORDER BY edited_at DESC
    `;
    const result = await this.pool.query(query, [jobId]);
    return result.rows.map(
			(row) =>
				new Message({
					id: row.id,
					display_id: row.display_id,
					job_id: row.job_id,
					sender_id: row.sender_id,
					message: row.message,
					read: row.read,
					read_at: row.read_at,
					edited: row.edited,
					edited_at: row.edited_at,
					created_at: row.created_at,
				}),
		);
  }

  async getConversationStats(jobId: string): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_messages,
        COUNT(*) FILTER (WHERE read = true) as read_messages,
        COUNT(*) FILTER (WHERE edited = true) as edited_messages,
        COUNT(DISTINCT sender_id) as participant_count
      FROM messages
      WHERE job_id = $1
    `;
    const result = await this.pool.query(query, [jobId]);
    return result.rows[0];
  }
}


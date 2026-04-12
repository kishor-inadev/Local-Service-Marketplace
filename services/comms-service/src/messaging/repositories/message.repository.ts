import { Injectable, Inject } from "@nestjs/common";
import { Pool } from "pg";
import { Message } from "../entities/message.entity";
import { v4 as uuidv4 } from "uuid";
import { resolveId } from "@/common/utils/resolve-id.util";

export interface PaginatedMessages {
  data: Message[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

@Injectable()
export class MessageRepository {
  constructor(@Inject("DATABASE_POOL") private pool: Pool) {}

  async createMessage(
    jobId: string,
    senderId: string,
    message: string,
  ): Promise<Message> {
    jobId = await resolveId(this.pool, "jobs", jobId);
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
    id = await resolveId(this.pool, "messages", id);
    const query = "SELECT * FROM messages WHERE id = $1";
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

  /** Returns true if the user is a participant in the given job (sender, customer, or provider). */
  async isJobParticipant(jobId: string, userId: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM jobs j
      WHERE j.id = $1
        AND (j.customer_id = $2 OR j.provider_id = $2)
      LIMIT 1
    `;
    const result = await this.pool.query(query, [jobId, userId]);
    if (result.rows.length > 0) return true;
    // Also check if user has sent messages in this job (covers providers matched by user_id not provider entity UUID)
    const senderQuery = `SELECT 1 FROM messages WHERE job_id = $1 AND sender_id = $2 LIMIT 1`;
    const senderResult = await this.pool.query(senderQuery, [jobId, userId]);
    return senderResult.rows.length > 0;
  }

  async getMessagesForJob(
    jobId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedMessages> {
    jobId = await resolveId(this.pool, "jobs", jobId);
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

    const total =
      result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;
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

    return {
      data: messages,
      total,
      page,
      limit,
      hasMore: offset + messages.length < total,
    };
  }

  async deleteMessage(id: string): Promise<void> {
    const query = "DELETE FROM messages WHERE id = $1";
    await this.pool.query(query, [id]);
  }

  async getUserConversations(userId: string): Promise<any[]> {
    // Uses the conversations table (owned by comms-service) to avoid cross-service joins.
    // Unread counts are computed from the messages table using the conversation's job_id.
    const query = `
      WITH user_convos AS (
        SELECT c.*
        FROM conversations c
        WHERE c.customer_id = $1 OR c.provider_id = $1
        ORDER BY c.last_message_at DESC NULLS LAST
        LIMIT 50
      ),
      unread_counts AS (
        SELECT m.job_id, COUNT(*)::int AS unread_count
        FROM messages m
        JOIN user_convos uc ON uc.job_id = m.job_id
        WHERE m.read = false AND m.sender_id != $1
        GROUP BY m.job_id
      )
      SELECT
        uc.job_id,
        uc.customer_id,
        uc.provider_id,
        uc.last_message,
        uc.last_message_at,
        COALESCE(u.unread_count, 0) AS unread_count
      FROM user_convos uc
      LEFT JOIN unread_counts u ON u.job_id = uc.job_id
      ORDER BY uc.last_message_at DESC NULLS LAST
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

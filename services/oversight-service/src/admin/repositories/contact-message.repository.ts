import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { ContactMessage } from '../entities/contact-message.entity';
import { CreateContactMessageDto } from '../dto/create-contact-message.dto';
import { UpdateContactMessageDto } from '../dto/update-contact-message.dto';
import { ContactMessageListQueryDto, ContactMessageSortBy } from "../dto/contact-message-list-query.dto";
import { ResolvedPagination } from "../../common/pagination/list-query-validation.util";

@Injectable()
export class ContactMessageRepository {
	constructor(@Inject("DATABASE_POOL") private readonly pool: Pool) {}

	async createContactMessage(dto: CreateContactMessageDto): Promise<ContactMessage> {
		const query = `
      INSERT INTO contact_messages (name, email, subject, message, user_id, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

		const result = await this.pool.query(query, [
			dto.name,
			dto.email,
			dto.subject,
			dto.message,
			dto.user_id || null,
			dto.ip_address || null,
			dto.user_agent || null,
		]);

		return result.rows[0];
	}

	async getContactMessageById(id: string): Promise<ContactMessage | null> {
		const query = `
      SELECT * FROM contact_messages
      WHERE id = $1
    `;

		const result = await this.pool.query(query, [id]);
		return result.rows[0] || null;
	}

	async getAllContactMessages(limit: number = 50, offset: number = 0, status?: string): Promise<ContactMessage[]> {
		let query = `
      SELECT * FROM contact_messages
    `;

		const params: any[] = [];

		if (status) {
			query += ` WHERE status = $1`;
			params.push(status);
			query += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
			params.push(limit, offset);
		} else {
			query += ` ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
			params.push(limit, offset);
		}

		const result = await this.pool.query(query, params);
		return result.rows;
	}

	async getContactMessageCount(status?: string): Promise<number> {
		let query = `SELECT COUNT(*) as count FROM contact_messages`;
		const params: any[] = [];

		if (status) {
			query += ` WHERE status = $1`;
			params.push(status);
		}

		const result = await this.pool.query(query, params);
		return parseInt(result.rows[0].count, 10);
	}

	async getContactMessagesByEmail(email: string): Promise<ContactMessage[]> {
		const query = `
      SELECT * FROM contact_messages
      WHERE email = $1
      ORDER BY created_at DESC
    `;

		const result = await this.pool.query(query, [email]);
		return result.rows;
	}

	async getContactMessagesByUserId(userId: string): Promise<ContactMessage[]> {
		const query = `
      SELECT * FROM contact_messages
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

		const result = await this.pool.query(query, [userId]);
		return result.rows;
	}

	async updateContactMessage(id: string, dto: UpdateContactMessageDto): Promise<ContactMessage> {
		const fields: string[] = [];
		const values: any[] = [];
		let paramCount = 1;

		if (dto.status !== undefined) {
			fields.push(`status = $${paramCount++}`);
			values.push(dto.status);

			// Set resolved_at when status changes to 'resolved' or 'closed'
			if (dto.status === "resolved" || dto.status === "closed") {
				fields.push(`resolved_at = NOW()`);
			}
		}

		if (dto.admin_notes !== undefined) {
			fields.push(`admin_notes = $${paramCount++}`);
			values.push(dto.admin_notes);
		}

		if (dto.assigned_to !== undefined) {
			fields.push(`assigned_to = $${paramCount++}`);
			values.push(dto.assigned_to);
		}

		values.push(id);

		const query = `
      UPDATE contact_messages
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

		const result = await this.pool.query(query, values);
		return result.rows[0];
	}

	async deleteContactMessage(id: string): Promise<boolean> {
		const query = `
      DELETE FROM contact_messages
      WHERE id = $1
    `;

		const result = await this.pool.query(query, [id]);
		return result.rowCount > 0;
	}

	async findContactMessages(
		queryDto: ContactMessageListQueryDto,
		pagination: ResolvedPagination,
	): Promise<ContactMessage[]> {
		const { whereClause, values, nextIndex } = this.buildWhereClause(queryDto);
		const sortColumn = this.getSortColumn(queryDto.sortBy);
		const sortOrder = queryDto.sortOrder?.toUpperCase() === "ASC" ? "ASC" : "DESC";

		const query = `
      SELECT * FROM contact_messages
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}, id ${sortOrder}
      LIMIT $${nextIndex} OFFSET $${nextIndex + 1}
    `;

		const result = await this.pool.query(query, [...values, pagination.limit, pagination.offset]);
		return result.rows;
	}

	async countContactMessagesByQuery(queryDto: ContactMessageListQueryDto): Promise<number> {
		const { whereClause, values } = this.buildWhereClause(queryDto);
		const query = `SELECT COUNT(*)::int AS total FROM contact_messages ${whereClause}`;
		const result = await this.pool.query(query, values);
		return result.rows[0]?.total || 0;
	}

	private buildWhereClause(queryDto: ContactMessageListQueryDto): {
		whereClause: string;
		values: unknown[];
		nextIndex: number;
	} {
		const conditions: string[] = [];
		const values: unknown[] = [];

		if (queryDto.status) {
			values.push(queryDto.status);
			conditions.push(`status = $${values.length}`);
		}

		if (queryDto.userId) {
			values.push(queryDto.userId);
			conditions.push(`user_id = $${values.length}`);
		}

		if (queryDto.assignedTo) {
			values.push(queryDto.assignedTo);
			conditions.push(`assigned_to = $${values.length}`);
		}

		if (queryDto.email) {
			values.push(queryDto.email);
			conditions.push(`email = $${values.length}`);
		}

		if (queryDto.search) {
			values.push(`%${queryDto.search}%`);
			conditions.push(
				`(name ILIKE $${values.length} OR email ILIKE $${values.length} OR subject ILIKE $${values.length} OR message ILIKE $${values.length})`,
			);
		}

		if (queryDto.createdFrom) {
			values.push(queryDto.createdFrom);
			conditions.push(`created_at >= $${values.length}`);
		}

		if (queryDto.createdTo) {
			values.push(queryDto.createdTo);
			conditions.push(`created_at <= $${values.length}`);
		}

		return {
			whereClause: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
			values,
			nextIndex: values.length + 1,
		};
	}

	private getSortColumn(sortBy?: ContactMessageSortBy): string {
		switch (sortBy) {
			case ContactMessageSortBy.STATUS:
				return "status";
			case ContactMessageSortBy.EMAIL:
				return "email";
			case ContactMessageSortBy.RESOLVED_AT:
				return "resolved_at";
			case ContactMessageSortBy.CREATED_AT:
			default:
				return "created_at";
		}
	}
}

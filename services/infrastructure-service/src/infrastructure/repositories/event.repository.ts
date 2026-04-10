import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { Event } from '../entities/event.entity';
import { CreateEventDto } from '../dto/create-event.dto';
import { EventQueryDto, EventSortBy } from "../dto/event-query.dto";
import { ResolvedPagination } from "../../common/pagination/list-query-validation.util";
import { resolveId } from '@/common/utils/resolve-id.util';

@Injectable()
export class EventRepository {
	constructor(@Inject("DATABASE_POOL") private readonly pool: Pool) {}

	async createEvent(createEventDto: CreateEventDto): Promise<Event> {
		const query = `
      INSERT INTO events (event_type, payload)
      VALUES ($1, $2)
      RETURNING id, display_id as "displayId", event_type as "eventType", payload, created_at as "createdAt"
    `;

		const values = [createEventDto.eventType, createEventDto.payload || null];

		const result = await this.pool.query(query, values);
		return result.rows[0];
	}

	async getAllEvents(limit: number = 100, offset: number = 0): Promise<Event[]> {
		const query = `
      SELECT id, display_id as "displayId", event_type as "eventType", payload, created_at as "createdAt"
      FROM events
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

		const result = await this.pool.query(query, [limit, offset]);
		return result.rows;
	}

	async findEvents(queryDto: EventQueryDto, pagination: ResolvedPagination): Promise<Event[]> {
		const { whereClause, values, nextIndex } = this.buildWhereClause(queryDto);
		const sortColumn = this.getSortColumn(queryDto.sortBy);
		const sortOrder = queryDto.sortOrder?.toUpperCase() === "ASC" ? "ASC" : "DESC";
		const query = `
      SELECT id, display_id as "displayId", event_type as "eventType", payload, created_at as "createdAt"
      FROM events
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}, id ${sortOrder}
      LIMIT $${nextIndex} OFFSET $${nextIndex + 1}
    `;

		const result = await this.pool.query(query, [...values, pagination.limit, pagination.offset]);
		return result.rows;
	}

	async countEvents(queryDto: EventQueryDto): Promise<number> {
		const { whereClause, values } = this.buildWhereClause(queryDto);
		const query = `SELECT COUNT(*)::int AS total FROM events ${whereClause}`;
		const result = await this.pool.query(query, values);
		return result.rows[0]?.total || 0;
	}

	async getEventById(id: string): Promise<Event | null> {
		id = await resolveId(this.pool, 'events', id);
		const query = `
      SELECT id, display_id as "displayId", event_type as "eventType", payload, created_at as "createdAt"
      FROM events
      WHERE id = $1
    `;

		const result = await this.pool.query(query, [id]);
		return result.rows[0] || null;
	}

	async getEventsByType(eventType: string, limit: number = 100): Promise<Event[]> {
		const query = `
      SELECT id, display_id as "displayId", event_type as "eventType", payload, created_at as "createdAt"
      FROM events
      WHERE event_type = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

		const result = await this.pool.query(query, [eventType, limit]);
		return result.rows;
	}

	async getEventsCount(): Promise<number> {
		const query = `SELECT COUNT(*) as count FROM events`;
		const result = await this.pool.query(query);
		return parseInt(result.rows[0].count) || 0;
	}

	private buildWhereClause(queryDto: EventQueryDto): { whereClause: string; values: unknown[]; nextIndex: number } {
		const conditions: string[] = [];
		const values: unknown[] = [];

		if (queryDto.eventType) {
			values.push(queryDto.eventType);
			conditions.push(`event_type = $${values.length}`);
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

	private getSortColumn(sortBy?: EventSortBy): string {
		switch (sortBy) {
			case EventSortBy.EVENT_TYPE:
				return "event_type";
			case EventSortBy.CREATED_AT:
			default:
				return "created_at";
		}
	}

	async deleteOlderThan(cutoff: Date): Promise<number> {
		const result = await this.pool.query(
			'DELETE FROM events WHERE created_at < $1',
			[cutoff],
		);
		return result.rowCount ?? 0;
	}
}

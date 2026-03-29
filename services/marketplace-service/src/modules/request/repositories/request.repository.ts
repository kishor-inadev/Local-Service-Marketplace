import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { ServiceRequest } from '../entities/service-request.entity';
import { Location as LocationEntity } from '../entities/location.entity';
import { CreateRequestDto } from '../dto/create-request.dto';
import { UpdateRequestDto } from '../dto/update-request.dto';
import { RequestQueryDto, RequestSortBy, SortOrder } from "../dto/request-query.dto";

@Injectable()
export class RequestRepository {
	constructor(@Inject("DATABASE_POOL") private readonly pool: Pool) {}

	async createRequest(dto: CreateRequestDto): Promise<ServiceRequest> {
		// First, insert location if provided
		let locationId: string | null = null;
		if (dto.location) {
			const locationQuery = `
        INSERT INTO locations (user_id, latitude, longitude, address, city, state, zip_code, country)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `;
			const locationResult = await this.pool.query(locationQuery, [
				dto.user_id || null, // Allow null for anonymous requests
				dto.location.latitude,
				dto.location.longitude,
				dto.location.address,
				dto.location.city,
				dto.location.state,
				dto.location.zipCode,
				dto.location.country,
			]);
			locationId = locationResult.rows[0].id;
		}

		const query = `
      INSERT INTO service_requests (
        user_id, category_id, location_id, description, budget, 
        images, preferred_date, urgency, expiry_date, view_count, status,
        guest_name, guest_email, guest_phone
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, 'pending', $10, $11, $12)
      RETURNING *
    `;

		const values = [
			dto.user_id || null, // Nullable for anonymous
			dto.category_id,
			locationId,
			dto.description,
			dto.budget,
			dto.images ? JSON.stringify(dto.images) : null,
			dto.preferred_date || null,
			dto.urgency || "medium",
			dto.expiry_date || null,
			dto.guest_info?.name || null, // Guest name
			dto.guest_info?.email || null, // Guest email
			dto.guest_info?.phone || null, // Guest phone
		];

		const result = await this.pool.query(query, values);
		return result.rows[0];
	}

	async getRequestsPaginated(queryDto: RequestQueryDto): Promise<ServiceRequest[]> {
		const {
			user_id,
			category_id,
			status,
			limit = 20,
			cursor,
			page,
			min_budget,
			max_budget,
			urgency,
			created_from,
			created_to,
			sortBy = RequestSortBy.CREATED_AT,
			sortOrder = SortOrder.DESC,
		} = queryDto;

		let query = `
      SELECT 
        r.id, r.user_id, r.category_id, r.location_id, r.description, r.budget, r.status, 
        r.images, r.preferred_date, r.urgency, r.expiry_date, r.view_count, 
        r.guest_name, r.guest_email, r.guest_phone,
        r.created_at, r.updated_at,
        l.id as loc_id, l.latitude, l.longitude, l.address, l.city, l.state, l.zip_code, l.country, l.created_at as loc_created_at
      FROM service_requests r
      LEFT JOIN locations l ON r.location_id = l.id
      WHERE r.deleted_at IS NULL
    `;

		const values: any[] = [];
		let paramIndex = 1;

		if (user_id) {
			query += ` AND r.user_id = $${paramIndex++}`;
			values.push(user_id);
		}

		if (category_id) {
			query += ` AND r.category_id = $${paramIndex++}`;
			values.push(category_id);
		}

		if (status) {
			query += ` AND r.status = $${paramIndex++}`;
			values.push(status);
		}

		const usingOffset = page !== undefined && page > 0;

		if (cursor && !usingOffset) {
			query += ` AND r.created_at < (SELECT created_at FROM service_requests WHERE id = $${paramIndex++})`;
			values.push(cursor);
		}

		if (min_budget !== undefined) {
			query += ` AND r.budget >= $${paramIndex++}`;
			values.push(min_budget);
		}

		if (max_budget !== undefined) {
			query += ` AND r.budget <= $${paramIndex++}`;
			values.push(max_budget);
		}

		if (urgency) {
			query += ` AND r.urgency = $${paramIndex++}`;
			values.push(urgency);
		}

		if (created_from) {
			query += ` AND r.created_at >= $${paramIndex++}`;
			values.push(created_from);
		}

		if (created_to) {
			query += ` AND r.created_at <= $${paramIndex++}`;
			values.push(created_to);
		}

		const sortMap: Record<RequestSortBy, string> = {
			[RequestSortBy.CREATED_AT]: "r.created_at",
			[RequestSortBy.BUDGET]: "r.budget",
			[RequestSortBy.PREFERRED_DATE]: "r.preferred_date",
		};
		const safeSortColumn = sortMap[sortBy] || "r.created_at";
		const safeSortOrder = sortOrder === SortOrder.ASC ? "ASC" : "DESC";

		query += ` ORDER BY ${safeSortColumn} ${safeSortOrder}, r.id DESC`;

		if (usingOffset) {
			const offset = ((page || 1) - 1) * limit;
			query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
			values.push(limit, offset);
		} else {
			query += ` LIMIT $${paramIndex++}`;
			values.push(limit + 1);
		}

		const result = await this.pool.query(query, values);
		return result.rows.map((row) => {
			const request: ServiceRequest = {
				id: row.id,
				user_id: row.user_id,
				category_id: row.category_id,
				location_id: row.location_id,
				description: row.description,
				budget: row.budget,
				status: row.status,
				created_at: row.created_at,
				urgency: row.urgency || "medium",
				view_count: row.view_count || 0,
				images: row.images,
				preferred_date: row.preferred_date,
				expiry_date: row.expiry_date,
				updated_at: row.updated_at,
			};

			// Add location if exists
			if (row.loc_id) {
				request.location = {
					id: row.loc_id,
					user_id: row.user_id,
					latitude: parseFloat(row.latitude),
					longitude: parseFloat(row.longitude),
					address: row.address,
					city: row.city,
					state: row.state,
					zip_code: row.zip_code,
					country: row.country,
					created_at: row.loc_created_at,
				} as LocationEntity;
			}

			return request;
		});
	}

	async getRequestStats(): Promise<{
		total: number;
		byStatus: { open: number; assigned: number; completed: number; cancelled: number };
	}> {
		const query = `
      SELECT
        COUNT(*) FILTER (WHERE deleted_at IS NULL)::int AS total,
        COUNT(*) FILTER (WHERE status = 'open' AND deleted_at IS NULL)::int AS open,
        COUNT(*) FILTER (WHERE status = 'assigned' AND deleted_at IS NULL)::int AS assigned,
        COUNT(*) FILTER (WHERE status = 'completed' AND deleted_at IS NULL)::int AS completed,
        COUNT(*) FILTER (WHERE status = 'cancelled' AND deleted_at IS NULL)::int AS cancelled
      FROM service_requests
    `;
		const result = await this.pool.query(query);
		const row = result.rows[0];
		return {
			total: row.total,
			byStatus: { open: row.open, assigned: row.assigned, completed: row.completed, cancelled: row.cancelled },
		};
	}

	async countRequests(queryDto: RequestQueryDto): Promise<number> {
		const { user_id, category_id, status, min_budget, max_budget, urgency, created_from, created_to } = queryDto;

		let query = `
      SELECT COUNT(*)::int AS total
      FROM service_requests r
      WHERE r.deleted_at IS NULL
    `;

		const values: any[] = [];
		let paramIndex = 1;

		if (user_id) {
			query += ` AND r.user_id = $${paramIndex++}`;
			values.push(user_id);
		}

		if (category_id) {
			query += ` AND r.category_id = $${paramIndex++}`;
			values.push(category_id);
		}

		if (status) {
			query += ` AND r.status = $${paramIndex++}`;
			values.push(status);
		}

		if (min_budget !== undefined) {
			query += ` AND r.budget >= $${paramIndex++}`;
			values.push(min_budget);
		}

		if (max_budget !== undefined) {
			query += ` AND r.budget <= $${paramIndex++}`;
			values.push(max_budget);
		}

		if (urgency) {
			query += ` AND r.urgency = $${paramIndex++}`;
			values.push(urgency);
		}

		if (created_from) {
			query += ` AND r.created_at >= $${paramIndex++}`;
			values.push(created_from);
		}

		if (created_to) {
			query += ` AND r.created_at <= $${paramIndex++}`;
			values.push(created_to);
		}

		const result = await this.pool.query(query, values);
		return result.rows[0].total;
	}

	async getRequestById(id: string): Promise<ServiceRequest | null> {
		const query = `
      SELECT 
        r.id, r.user_id, r.category_id, r.location_id, r.description, r.budget, r.status,
        r.images, r.preferred_date, r.urgency, r.expiry_date, r.view_count, r.created_at, r.updated_at,
        l.id as loc_id, l.latitude, l.longitude, l.address, l.city, l.state, l.zip_code, l.country, l.created_at as loc_created_at
      FROM service_requests r
      LEFT JOIN locations l ON r.location_id = l.id
      WHERE r.id = $1 AND r.deleted_at IS NULL
    `;

		const result = await this.pool.query(query, [id]);

		if (result.rows.length === 0) {
			return null;
		}

		const row = result.rows[0];
		const request: ServiceRequest = {
			id: row.id,
			user_id: row.user_id,
			category_id: row.category_id,
			location_id: row.location_id,
			description: row.description,
			budget: row.budget,
			status: row.status,
			created_at: row.created_at,
			urgency: row.urgency || "medium",
			view_count: row.view_count || 0,
			images: row.images,
			preferred_date: row.preferred_date,
			expiry_date: row.expiry_date,
			updated_at: row.updated_at,
		};

		// Add location if exists
		if (row.loc_id) {
			request.location = {
				id: row.loc_id,
				user_id: row.user_id,
				latitude: parseFloat(row.latitude),
				longitude: parseFloat(row.longitude),
				address: row.address,
				city: row.city,
				state: row.state,
				zip_code: row.zip_code,
				country: row.country,
				created_at: row.loc_created_at,
			} as LocationEntity;
		}

		return request;
	}

	async updateRequest(id: string, dto: UpdateRequestDto): Promise<ServiceRequest | null> {
		const updates: string[] = [];
		const values: any[] = [];
		let paramIndex = 1;

		if (dto.category_id !== undefined) {
			updates.push(`category_id = $${paramIndex++}`);
			values.push(dto.category_id);
		}

		if (dto.location_id !== undefined) {
			updates.push(`location_id = $${paramIndex++}`);
			values.push(dto.location_id);
		}

		if (dto.description !== undefined) {
			updates.push(`description = $${paramIndex++}`);
			values.push(dto.description);
		}

		if (dto.budget !== undefined) {
			updates.push(`budget = $${paramIndex++}`);
			values.push(dto.budget);
		}

		if (dto.status !== undefined) {
			updates.push(`status = $${paramIndex++}`);
			values.push(dto.status);
		}

		if (updates.length === 0) {
			return this.getRequestById(id);
		}

		const query = `
      UPDATE service_requests
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex++}
      RETURNING id, user_id, category_id, location_id, description, budget, status, created_at
    `;

		values.push(id);

		const result = await this.pool.query(query, values);
		return result.rows[0] || null;
	}

	async deleteRequest(id: string): Promise<boolean> {
		const query = `DELETE FROM service_requests WHERE id = $1`;
		const result = await this.pool.query(query, [id]);
		return result.rowCount > 0;
	}

	async getRequestsByUser(userId: string): Promise<ServiceRequest[]> {
		const query = `
      SELECT 
        r.id, r.user_id, r.category_id, r.location_id, r.description, r.budget, r.status,
        r.images, r.preferred_date, r.urgency, r.expiry_date, r.view_count, r.created_at, r.updated_at,
        l.id as loc_id, l.latitude, l.longitude, l.address, l.city, l.state, l.zip_code, l.country, l.created_at as loc_created_at
      FROM service_requests r
      LEFT JOIN locations l ON r.location_id = l.id
      WHERE r.user_id = $1 AND r.deleted_at IS NULL
      ORDER BY r.created_at DESC
    `;

		const result = await this.pool.query(query, [userId]);
		return result.rows.map((row) => {
			const request: ServiceRequest = {
				id: row.id,
				user_id: row.user_id,
				category_id: row.category_id,
				location_id: row.location_id,
				description: row.description,
				budget: row.budget,
				status: row.status,
				created_at: row.created_at,
				urgency: row.urgency || "medium",
				view_count: row.view_count || 0,
				images: row.images,
				preferred_date: row.preferred_date,
				expiry_date: row.expiry_date,
				updated_at: row.updated_at,
			};

			// Add location if exists
			if (row.loc_id) {
				request.location = {
					id: row.loc_id,
					user_id: row.user_id,
					latitude: parseFloat(row.latitude),
					longitude: parseFloat(row.longitude),
					address: row.address,
					city: row.city,
					state: row.state,
					zip_code: row.zip_code,
					country: row.country,
					created_at: row.loc_created_at,
				} as LocationEntity;
			}

			return request;
		});
	}

	// ✅ NEW METHODS for new fields
	async incrementViewCount(requestId: string): Promise<void> {
		const query = `
      UPDATE service_requests 
      SET view_count = view_count + 1
      WHERE id = $1
    `;
		await this.pool.query(query, [requestId]);
	}

	async getUrgentRequests(limit: number = 20): Promise<ServiceRequest[]> {
		const query = `
      SELECT * FROM service_requests
      WHERE urgency IN ('high', 'urgent')
        AND status = 'open'
        AND deleted_at IS NULL
        AND (expiry_date IS NULL OR expiry_date > NOW())
      ORDER BY 
        CASE urgency 
          WHEN 'urgent' THEN 1 
          WHEN 'high' THEN 2 
        END,
        created_at DESC
      LIMIT $1
    `;
		const result = await this.pool.query(query, [limit]);
		return result.rows;
	}

	async getRequestsByUrgency(
		urgency: "low" | "medium" | "high" | "urgent",
		limit: number = 20,
	): Promise<ServiceRequest[]> {
		const query = `
      SELECT * FROM service_requests
      WHERE urgency = $1
        AND status = 'open'
        AND deleted_at IS NULL
        AND (expiry_date IS NULL OR expiry_date > NOW())
      ORDER BY created_at DESC
      LIMIT $2
    `;
		const result = await this.pool.query(query, [urgency, limit]);
		return result.rows;
	}

	async getRequestsWithImages(limit: number = 20): Promise<ServiceRequest[]> {
		const query = `
      SELECT * FROM service_requests
      WHERE images IS NOT NULL
        AND jsonb_array_length(images) > 0
        AND status = 'open'
        AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $1
    `;
		const result = await this.pool.query(query, [limit]);
		return result.rows;
	}

	async getExpiringRequests(hours: number = 24): Promise<ServiceRequest[]> {
		const query = `
      SELECT * FROM service_requests
      WHERE expiry_date IS NOT NULL
        AND expiry_date > NOW()
        AND expiry_date <= NOW() + INTERVAL '${hours} hours'
        AND status = 'open'
        AND deleted_at IS NULL
      ORDER BY expiry_date ASC
    `;
		const result = await this.pool.query(query);
		return result.rows;
	}

	// ✅ NEW: Additional advanced query methods
	async getMostViewedRequests(limit: number = 10): Promise<ServiceRequest[]> {
		const query = `
      SELECT * FROM service_requests
      WHERE status = 'open'
        AND deleted_at IS NULL
      ORDER BY view_count DESC, created_at DESC
      LIMIT $1
    `;
		const result = await this.pool.query(query, [limit]);
		return result.rows;
	}

	async getRequestsByBudgetRange(minBudget: number, maxBudget: number, limit: number = 20): Promise<ServiceRequest[]> {
		const query = `
      SELECT * FROM service_requests
      WHERE budget BETWEEN $1 AND $2
        AND status = 'open'
        AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $3
    `;
		const result = await this.pool.query(query, [minBudget, maxBudget, limit]);
		return result.rows;
	}

	async getRequestsByPreferredDate(startDate: Date, endDate: Date, limit: number = 20): Promise<ServiceRequest[]> {
		const query = `
      SELECT * FROM service_requests
      WHERE preferred_date BETWEEN $1 AND $2
        AND status = 'open'
        AND deleted_at IS NULL
      ORDER BY preferred_date ASC
      LIMIT $3
    `;
		const result = await this.pool.query(query, [startDate, endDate, limit]);
		return result.rows;
	}
}


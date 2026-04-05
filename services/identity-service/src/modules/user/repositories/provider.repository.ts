import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '@/common/database/database.module';
import { Provider } from '../entities/provider.entity';
import { ProviderSortBy, SortOrder, ProviderVerificationStatus } from "../dto/provider-query.dto";
import { resolveId } from '@/common/utils/resolve-id.util';

@Injectable()
export class ProviderRepository {
	constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

	async create(userId: string, businessName: string, description?: string): Promise<Provider> {
		const query = `
      INSERT INTO providers (
        user_id, business_name, description, 
        verification_status, total_jobs_completed
      )
      VALUES ($1, $2, $3, 'pending', 0)
      RETURNING *
    `;
		const result = await this.pool.query(query, [userId, businessName, description]);
		return result.rows[0];
	}

	async findById(id: string): Promise<Provider | null> {
		id = await resolveId(this.pool, 'providers', id);
		const query = "SELECT * FROM providers WHERE id = $1 AND deleted_at IS NULL";
		const result = await this.pool.query(query, [id]);
		return result.rows[0] || null;
	}

	async findByUserId(userId: string): Promise<Provider | null> {
		const query = "SELECT * FROM providers WHERE user_id = $1 AND deleted_at IS NULL";
		const result = await this.pool.query(query, [userId]);
		return result.rows[0] || null;
	}

	async update(id: string, businessName?: string, description?: string): Promise<Provider> {
		const updates: string[] = [];
		const values: any[] = [];
		let paramCount = 1;

		if (businessName !== undefined) {
			updates.push(`business_name = $${paramCount++}`);
			values.push(businessName);
		}

		if (description !== undefined) {
			updates.push(`description = $${paramCount++}`);
			values.push(description);
		}

		if (updates.length === 0) {
			return this.findById(id);
		}

		values.push(id);
		const query = `
      UPDATE providers
      SET ${updates.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

		const result = await this.pool.query(query, values);
		return result.rows[0];
	}

	async findPaginated(
		limit: number,
		cursor?: string,
		categoryId?: string,
		search?: string,
		locationId?: string,
		offset?: number,
		sortBy: ProviderSortBy = ProviderSortBy.CREATED_AT,
		sortOrder: SortOrder = SortOrder.DESC,
		verificationStatus?: ProviderVerificationStatus,
		minRating?: number,
		maxRating?: number,
		userId?: string,
	): Promise<Provider[]> {
		const conditions: string[] = ["providers.deleted_at IS NULL"];
		const values: any[] = [];
		let paramCount = 1;

		if (userId) {
			conditions.push(`providers.user_id = $${paramCount}`);
			values.push(userId);
			paramCount++;
		}

		if (cursor && !offset) {
			conditions.push(`providers.created_at < (SELECT created_at FROM providers WHERE id = $${paramCount})`);
			values.push(cursor);
			paramCount++;
		}

		if (categoryId) {
			conditions.push(`EXISTS (
        SELECT 1 FROM provider_services 
        WHERE provider_services.provider_id = providers.id 
        AND provider_services.category_id = $${paramCount}
      )`);
			values.push(categoryId);
			paramCount++;
		}

		if (search) {
			conditions.push(`(
        providers.business_name ILIKE $${paramCount} 
        OR providers.description ILIKE $${paramCount}
      )`);
			values.push(`%${search}%`);
			paramCount++;
		}

		if (verificationStatus) {
			conditions.push(`providers.verification_status = $${paramCount}`);
			values.push(verificationStatus);
			paramCount++;
		}

		if (minRating !== undefined) {
			conditions.push(`COALESCE(providers.rating, 0) >= $${paramCount}`);
			values.push(minRating);
			paramCount++;
		}

		if (maxRating !== undefined) {
			conditions.push(`COALESCE(providers.rating, 0) <= $${paramCount}`);
			values.push(maxRating);
			paramCount++;
		}

		const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
		const safeSortBy: Record<ProviderSortBy, string> = {
			[ProviderSortBy.CREATED_AT]: "providers.created_at",
			[ProviderSortBy.RATING]: "providers.rating",
			[ProviderSortBy.BUSINESS_NAME]: "providers.business_name",
			[ProviderSortBy.TOTAL_JOBS_COMPLETED]: "providers.total_jobs_completed",
		};
		const orderColumn = safeSortBy[sortBy] ?? "providers.created_at";
		const orderDirection = sortOrder === SortOrder.ASC ? "ASC" : "DESC";

		values.push(limit);
		const limitParam = paramCount++;

		let query: string;
		if (offset !== undefined) {
			values.push(offset);
			query = `
        SELECT DISTINCT providers.*
        FROM providers
        ${whereClause}
				ORDER BY ${orderColumn} ${orderDirection}, providers.id DESC
        LIMIT $${limitParam} OFFSET $${paramCount}
      `;
		} else {
			query = `
      SELECT DISTINCT providers.*
      FROM providers
      ${whereClause}
			ORDER BY ${orderColumn} ${orderDirection}, providers.id DESC
        LIMIT $${limitParam}
      `;
		}

		const result = await this.pool.query(query, values);
		return result.rows;
	}

	async countProviders(
		categoryId?: string,
		search?: string,
		locationId?: string,
		verificationStatus?: ProviderVerificationStatus,
		minRating?: number,
		maxRating?: number,
		userId?: string,
	): Promise<number> {
		const conditions: string[] = ["providers.deleted_at IS NULL"];
		const values: any[] = [];
		let paramCount = 1;

		if (userId) {
			conditions.push(`providers.user_id = $${paramCount}`);
			values.push(userId);
			paramCount++;
		}

		if (categoryId) {
			conditions.push(`EXISTS (
        SELECT 1 FROM provider_services
        WHERE provider_services.provider_id = providers.id
        AND provider_services.category_id = $${paramCount}
      )`);
			values.push(categoryId);
			paramCount++;
		}

		if (search) {
			conditions.push(`(
        providers.business_name ILIKE $${paramCount}
        OR providers.description ILIKE $${paramCount}
      )`);
			values.push(`%${search}%`);
			paramCount++;
		}

		if (verificationStatus) {
			conditions.push(`providers.verification_status = $${paramCount}`);
			values.push(verificationStatus);
			paramCount++;
		}

		if (minRating !== undefined) {
			conditions.push(`COALESCE(providers.rating, 0) >= $${paramCount}`);
			values.push(minRating);
			paramCount++;
		}

		if (maxRating !== undefined) {
			conditions.push(`COALESCE(providers.rating, 0) <= $${paramCount}`);
			values.push(maxRating);
			paramCount++;
		}

		const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
		const query = `SELECT COUNT(*)::int AS total FROM providers ${whereClause}`;
		const result = await this.pool.query(query, values);
		return result.rows[0].total;
	}

	async delete(id: string): Promise<void> {
		const query = "DELETE FROM providers WHERE id = $1";
		await this.pool.query(query, [id]);
	}

	// ✅ NEW METHODS for new fields
	async updateVerificationStatus(providerId: string, status: "pending" | "verified" | "rejected"): Promise<Provider> {
		const query = `
      UPDATE providers 
      SET verification_status = $1
      WHERE id = $2
      RETURNING *
    `;
		const result = await this.pool.query(query, [status, providerId]);
		return result.rows[0];
	}

	async updateProfilePicture(providerId: string, url: string): Promise<Provider> {
		const query = `
      UPDATE providers 
      SET profile_picture_url = $1
      WHERE id = $2
      RETURNING *
    `;
		const result = await this.pool.query(query, [url, providerId]);
		return result.rows[0];
	}

	async updateCertifications(providerId: string, certifications: any): Promise<Provider> {
		const query = `
      UPDATE providers 
      SET certifications = $1
      WHERE id = $2
      RETURNING *
    `;
		const result = await this.pool.query(query, [JSON.stringify(certifications), providerId]);
		return result.rows[0];
	}

	async getVerifiedProviders(limit: number = 20): Promise<Provider[]> {
		const query = `
      SELECT * FROM providers
      WHERE verification_status = 'verified' 
        AND deleted_at IS NULL
      ORDER BY total_jobs_completed DESC, rating DESC
      LIMIT $1
    `;
		const result = await this.pool.query(query, [limit]);
		return result.rows;
	}

	async getProvidersByResponseTime(maxResponseTime: number, limit: number = 20): Promise<Provider[]> {
		const query = `
      SELECT * FROM providers
      WHERE response_time_avg <= $1
        AND verification_status = 'verified'
        AND deleted_at IS NULL
      ORDER BY response_time_avg ASC
      LIMIT $2
    `;
		const result = await this.pool.query(query, [maxResponseTime, limit]);
		return result.rows;
	}

	// ✅ NEW: Additional advanced query methods
	async getProvidersByExperience(minYears: number, limit: number = 20): Promise<Provider[]> {
		const query = `
      SELECT * FROM providers
      WHERE years_of_experience >= $1
        AND verification_status = 'verified'
        AND deleted_at IS NULL
      ORDER BY years_of_experience DESC, rating DESC
      LIMIT $2
    `;
		const result = await this.pool.query(query, [minYears, limit]);
		return result.rows;
	}

	async getTopRatedProviders(minRating: number = 4.5, limit: number = 10): Promise<Provider[]> {
		const query = `
      SELECT * FROM providers
      WHERE rating >= $1
        AND verification_status = 'verified'
        AND deleted_at IS NULL
      ORDER BY rating DESC, total_jobs_completed DESC
      LIMIT $2
    `;
		const result = await this.pool.query(query, [minRating, limit]);
		return result.rows;
	}

	async getProvidersByServiceRadius(minRadius: number, maxRadius: number, limit: number = 20): Promise<Provider[]> {
		const query = `
      SELECT * FROM providers
      WHERE service_area_radius BETWEEN $1 AND $2
        AND verification_status = 'verified'
        AND deleted_at IS NULL
      ORDER BY service_area_radius ASC
      LIMIT $3
    `;
		const result = await this.pool.query(query, [minRadius, maxRadius, limit]);
		return result.rows;
	}

	async updateYearsOfExperience(providerId: string, years: number): Promise<Provider> {
		const query = `
      UPDATE providers 
      SET years_of_experience = $1
      WHERE id = $2
      RETURNING *
    `;
		const result = await this.pool.query(query, [years, providerId]);
		return result.rows[0];
	}

	async updateServiceAreaRadius(providerId: string, radius: number): Promise<Provider> {
		const query = `
      UPDATE providers 
      SET service_area_radius = $1
      WHERE id = $2
      RETURNING *
    `;
		const result = await this.pool.query(query, [radius, providerId]);
		return result.rows[0];
	}
}


import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { Pool } from "pg";
import { Review } from "../entities/review.entity";
import { CreateReviewDto } from "../dto/create-review.dto";
import { resolveId } from '@/common/utils/resolve-id.util';

@Injectable()
export class ReviewRepository {
	constructor(@Inject("DATABASE_POOL") private readonly pool: Pool) {}

	async createReview(createReviewDto: CreateReviewDto): Promise<Review> {
		const jobId = await resolveId(this.pool, 'jobs', createReviewDto.job_id);
		const providerId = await resolveId(this.pool, 'providers', createReviewDto.provider_id);
		const query = `
      INSERT INTO reviews (job_id, user_id, provider_id, rating, comment)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, display_id, job_id, user_id, provider_id, rating, comment, created_at
    `;

		const values = [
			jobId,
			createReviewDto.user_id,
			providerId,
			createReviewDto.rating,
			createReviewDto.comment,
		];

		const result = await this.pool.query(query, values);
		return result.rows[0];
	}

	async getReviewById(id: string): Promise<Review | null> {
		id = await resolveId(this.pool, 'reviews', id);
		const query = `
      SELECT id, display_id, job_id, user_id, provider_id, rating, comment, created_at
      FROM reviews
      WHERE id = $1
    `;

		const result = await this.pool.query(query, [id]);
		return result.rows[0] || null;
	}

	async getProviderReviews(providerId: string, limit: number = 20, offset: number = 0): Promise<Review[]> {
		providerId = await resolveId(this.pool, 'providers', providerId);
		const query = `
      SELECT id, display_id, job_id, user_id, provider_id, rating, comment, created_at
      FROM reviews
      WHERE provider_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

		const result = await this.pool.query(query, [providerId, limit, offset]);
		return result.rows;
	}

	async getProviderRating(providerId: string): Promise<{ averageRating: number; totalReviews: number }> {
		providerId = await resolveId(this.pool, 'providers', providerId);
		const query = `
      SELECT 
        COALESCE(AVG(rating), 0) as "averageRating",
        COUNT(*) as "totalReviews"
      FROM reviews
      WHERE provider_id = $1
    `;

		const result = await this.pool.query(query, [providerId]);
		return {
			averageRating: parseFloat(result.rows[0].averageRating) || 0,
			totalReviews: parseInt(result.rows[0].totalReviews) || 0,
		};
	}

	async getReviewCount(providerId: string): Promise<number> {
		providerId = await resolveId(this.pool, 'providers', providerId);
		const query = `
      SELECT COUNT(*) as count
      FROM reviews
      WHERE provider_id = $1
    `;

		const result = await this.pool.query(query, [providerId]);
		return parseInt(result.rows[0].count) || 0;
	}

	/**
	 * Get review by job ID
	 */
	async getReviewByJobId(jobId: string): Promise<Review | null> {
		jobId = await resolveId(this.pool, 'jobs', jobId);
		const query = `
      SELECT id, display_id, job_id, user_id, provider_id, rating, comment, response, response_at, helpful_count, verified_purchase, created_at
      FROM reviews
      WHERE job_id = $1
      LIMIT 1
    `;
		const result = await this.pool.query(query, [jobId]);
		return result.rows[0] || null;
	}

	/**
	 * Provider responds to a review
	 */
	async respondToReview(reviewId: string, response: string, providerId: string): Promise<Review> {
		const query = `
      UPDATE reviews 
      SET response = $1, response_at = NOW()
      WHERE id = $2 AND provider_id = $3
      RETURNING *
    `;
		const result = await this.pool.query(query, [response, reviewId, providerId]);
		if (result.rows.length === 0) {
			throw new NotFoundException("Review not found or unauthorized");
		}
		return result.rows[0];
	}

	// ✅ NEW: Advanced query methods
	async addProviderResponse(reviewId: string, response: string, providerId: string): Promise<Review> {
		const query = `
      UPDATE reviews 
      SET response = $1, response_at = NOW()
      WHERE id = $2 AND provider_id = $3
      RETURNING *
    `;
		const result = await this.pool.query(query, [response, reviewId, providerId]);
		if (result.rows.length === 0) {
			throw new NotFoundException("Review not found or unauthorized");
		}
		return result.rows[0];
	}

	async incrementHelpfulCount(reviewId: string): Promise<Review> {
		const query = `
      UPDATE reviews 
      SET helpful_count = helpful_count + 1
      WHERE id = $1
      RETURNING *
    `;
		const result = await this.pool.query(query, [reviewId]);
		return result.rows[0];
	}

	async getVerifiedPurchaseReviews(providerId: string, limit: number = 20): Promise<Review[]> {
		providerId = await resolveId(this.pool, 'providers', providerId);
		const query = `
      SELECT * FROM reviews
      WHERE provider_id = $1
        AND verified_purchase = true
      ORDER BY created_at DESC
      LIMIT $2
    `;
		const result = await this.pool.query(query, [providerId, limit]);
		return result.rows;
	}

	async getReviewsWithResponses(providerId: string, limit: number = 20): Promise<Review[]> {
		providerId = await resolveId(this.pool, 'providers', providerId);
		const query = `
      SELECT * FROM reviews
      WHERE provider_id = $1
        AND response IS NOT NULL
      ORDER BY response_at DESC
      LIMIT $2
    `;
		const result = await this.pool.query(query, [providerId, limit]);
		return result.rows;
	}

	async getMostHelpfulReviews(providerId: string, limit: number = 10): Promise<Review[]> {
		providerId = await resolveId(this.pool, 'providers', providerId);
		const query = `
      SELECT * FROM reviews
      WHERE provider_id = $1
        AND helpful_count > 0
      ORDER BY helpful_count DESC
      LIMIT $2
    `;
		const result = await this.pool.query(query, [providerId, limit]);
		return result.rows;
	}

	async getReviewsByRating(providerId: string, rating: number, limit: number = 20): Promise<Review[]> {
		providerId = await resolveId(this.pool, 'providers', providerId);
		const query = `
      SELECT * FROM reviews
      WHERE provider_id = $1
        AND rating = $2
      ORDER BY created_at DESC
      LIMIT $3
    `;
		const result = await this.pool.query(query, [providerId, rating, limit]);
		return result.rows;
	}
}

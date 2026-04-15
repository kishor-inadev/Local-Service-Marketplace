import { Injectable, Inject, NotFoundException, BadRequestException } from "@nestjs/common";
import { Pool } from "pg";
import { Review } from "../entities/review.entity";
import { CreateReviewDto } from "../dto/create-review.dto";
import { resolveId } from "@/common/utils/resolve-id.util";

@Injectable()
export class ReviewRepository {
  constructor(@Inject("DATABASE_POOL") private readonly pool: Pool) {}

  /** Reads a system setting from the shared system_settings table with a safe fallback. */
  async getSystemSetting(key: string, defaultValue: string): Promise<string> {
    try {
      const res = await this.pool.query(
        'SELECT value FROM system_settings WHERE key = $1',
        [key],
      );
      return res.rows[0]?.value ?? defaultValue;
    } catch {
      return defaultValue;
    }
  }

  /** Returns the job row so the service can validate status and resolve provider_id. */
  async getJobForReview(jobId: string): Promise<{ id: string; provider_id: string; status: string; customer_id: string } | null> {
    const id = await resolveId(this.pool, "jobs", jobId).catch(() => null);
    if (!id) return null;
    const result = await this.pool.query(
      `SELECT id, provider_id, status, customer_id FROM jobs WHERE id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  /** Returns true if a review already exists for the given (job, user) pair. */
  async existsForJobAndUser(jobId: string, userId: string): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT 1 FROM reviews WHERE job_id = $1 AND user_id = $2 LIMIT 1`,
      [jobId, userId],
    );
    return result.rows.length > 0;
  }

  async createReview(createReviewDto: CreateReviewDto): Promise<Review | null> {
    const jobId = await resolveId(this.pool, "jobs", createReviewDto.job_id);
    const providerId = await resolveId(
      this.pool,
      "providers",
      createReviewDto.provider_id,
    );
    const query = `
      INSERT INTO reviews (job_id, user_id, provider_id, rating, comment)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (job_id, user_id) DO NOTHING
      RETURNING id, display_id, job_id, user_id, provider_id, rating, comment, response, response_at, helpful_count, verified_purchase, created_at
    `;

    const values = [
      jobId,
      createReviewDto.user_id,
      providerId,
      createReviewDto.rating,
      createReviewDto.comment,
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0] ?? null;
  }

  async getReviewById(id: string): Promise<Review | null> {
    id = await resolveId(this.pool, "reviews", id);
    const query = `
      SELECT id, display_id, job_id, user_id, provider_id, rating, comment, response, response_at, helpful_count, verified_purchase, created_at
      FROM reviews
      WHERE id = $1
    `;

    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async getProviderReviews(
    providerId: string,
    limit: number = 20,
    offset: number = 0,
    sortBy: string = 'created_at',
    sortOrder: string = 'desc',
    minRating?: number,
    maxRating?: number,
  ): Promise<Review[]> {
    providerId = await resolveId(this.pool, "providers", providerId);

    const allowedSortColumns: Record<string, string> = {
      created_at: 'created_at',
      rating: 'rating',
      helpful_count: 'helpful_count',
    };
    const col = allowedSortColumns[sortBy] ?? 'created_at';
    const dir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const conditions: string[] = ['provider_id = $1'];
    const values: any[] = [providerId];
    let idx = 2;

    if (minRating !== undefined) {
      conditions.push(`rating >= $${idx++}`);
      values.push(minRating);
    }
    if (maxRating !== undefined) {
      conditions.push(`rating <= $${idx++}`);
      values.push(maxRating);
    }

    values.push(limit, offset);
    const query = `
      SELECT id, display_id, job_id, user_id, provider_id, rating, comment, response, response_at, helpful_count, verified_purchase, created_at
      FROM reviews
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${col} ${dir}
      LIMIT $${idx++} OFFSET $${idx}
    `;

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  async getProviderRating(
    providerId: string,
  ): Promise<{ averageRating: number; totalReviews: number }> {
    providerId = await resolveId(this.pool, "providers", providerId);
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
    providerId = await resolveId(this.pool, "providers", providerId);
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
    jobId = await resolveId(this.pool, "jobs", jobId);
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
  async respondToReview(
    reviewId: string,
    response: string,
    providerId: string,
  ): Promise<Review> {
    const query = `
      UPDATE reviews 
      SET response = $1, response_at = NOW()
      WHERE id = $2 AND provider_id = $3
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      response,
      reviewId,
      providerId,
    ]);
    if (result.rows.length === 0) {
      throw new NotFoundException("Review not found or unauthorized");
    }
    return result.rows[0];
  }

  // ✅ NEW: Advanced query methods
  async addProviderResponse(
    reviewId: string,
    response: string,
    providerId: string,
  ): Promise<Review> {
    const query = `
      UPDATE reviews 
      SET response = $1, response_at = NOW()
      WHERE id = $2 AND provider_id = $3
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      response,
      reviewId,
      providerId,
    ]);
    if (result.rows.length === 0) {
      throw new NotFoundException("Review not found or unauthorized");
    }
    return result.rows[0];
  }

  async incrementHelpfulCount(reviewId: string, userId: string): Promise<Review | null> {
    // Atomically insert vote and increment count; DO NOTHING on duplicate
    const query = `
      WITH vote AS (
        INSERT INTO review_helpful_votes (review_id, user_id)
        VALUES ($1, $2)
        ON CONFLICT (review_id, user_id) DO NOTHING
        RETURNING review_id
      )
      UPDATE reviews
      SET helpful_count = helpful_count + 1
      WHERE id = $1
        AND EXISTS (SELECT 1 FROM vote)
      RETURNING *
    `;
    const result = await this.pool.query(query, [reviewId, userId]);
    return result.rows[0] ?? null;
  }

  async getVerifiedPurchaseReviews(
    providerId: string,
    limit: number = 20,
  ): Promise<Review[]> {
    providerId = await resolveId(this.pool, "providers", providerId);
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

  async getReviewsWithResponses(
    providerId: string,
    limit: number = 20,
  ): Promise<Review[]> {
    providerId = await resolveId(this.pool, "providers", providerId);
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

  async getMostHelpfulReviews(
    providerId: string,
    limit: number = 10,
  ): Promise<Review[]> {
    providerId = await resolveId(this.pool, "providers", providerId);
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

  async getReviewsByRating(
    providerId: string,
    rating: number,
    limit: number = 20,
  ): Promise<Review[]> {
    providerId = await resolveId(this.pool, "providers", providerId);
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

  async updateReview(
    id: string,
    updateData: { rating?: number; comment?: string },
  ): Promise<Review> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.rating !== undefined) {
      updateFields.push(`rating = $${paramIndex++}`);
      values.push(updateData.rating);
    }

    if (updateData.comment !== undefined) {
      updateFields.push(`comment = $${paramIndex++}`);
      values.push(updateData.comment);
    }

    if (updateFields.length === 0) {
      throw new BadRequestException("No fields to update");
    }

    values.push(id);

    const query = `
      UPDATE reviews
      SET ${updateFields.join(", ")}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async deleteReview(id: string): Promise<void> {
    const query = `DELETE FROM reviews WHERE id = $1`;
    await this.pool.query(query, [id]);
  }

  async getReviewsByUser(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ data: Review[]; total: number }> {
    const [dataResult, countResult] = await Promise.all([
      this.pool.query(
        `SELECT id, display_id, job_id, user_id, provider_id, rating, comment,
                response, response_at, helpful_count, verified_purchase, created_at
         FROM reviews
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset],
      ),
      this.pool.query(
        `SELECT COUNT(*)::int AS total FROM reviews WHERE user_id = $1`,
        [userId],
      ),
    ]);
    return { data: dataResult.rows, total: countResult.rows[0]?.total ?? 0 };
  }
}


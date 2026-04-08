import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { ProviderReviewAggregateRepository } from "../repositories/provider-review-aggregate.repository";
import { ProviderReviewAggregate } from "../entities/provider-review-aggregate.entity";

@Injectable()
export class ProviderReviewAggregateService {
  constructor(
    private readonly aggregateRepository: ProviderReviewAggregateRepository,
  ) {}

  /**
   * Update aggregate stats for a provider
   * Called whenever a review is created, updated, or deleted
   */
  async updateProviderAggregate(
    providerId: string,
  ): Promise<ProviderReviewAggregate> {
    return this.aggregateRepository.upsert(providerId);
  }

  /**
   * Get aggregate stats for a provider
   */
  async getProviderAggregate(
    providerId: string,
  ): Promise<ProviderReviewAggregate> {
    let aggregate = await this.aggregateRepository.findByProvider(providerId);

    // If aggregate doesn't exist, create it
    if (!aggregate) {
      aggregate = await this.aggregateRepository.upsert(providerId);
    }

    return aggregate;
  }

  /**
   * Get top-rated providers
   */
  async getTopRatedProviders(
    limit: number = 10,
  ): Promise<ProviderReviewAggregate[]> {
    return this.aggregateRepository.findTopRated(limit);
  }

  /**
   * Get providers by rating range
   */
  async getProvidersByRating(
    minRating: number,
    maxRating: number,
    limit: number = 20,
  ): Promise<ProviderReviewAggregate[]> {
    // Validate rating range
    if (minRating < 1 || minRating > 5 || maxRating < 1 || maxRating > 5) {
      throw new BadRequestException("Rating must be between 1 and 5");
    }

    if (minRating > maxRating) {
      throw new BadRequestException(
        "Minimum rating cannot be greater than maximum rating",
      );
    }

    return this.aggregateRepository.findByRatingRange(
      minRating,
      maxRating,
      limit,
    );
  }

  /**
   * Get rating distribution for a provider
   */
  async getRatingDistribution(providerId: string): Promise<{
    total_reviews: number;
    average_rating: number;
    distribution: { rating: number; count: number; percentage: number }[];
  }> {
    const aggregate = await this.getProviderAggregate(providerId);

    const distribution = [
      { rating: 5, count: aggregate.rating_5_count },
      { rating: 4, count: aggregate.rating_4_count },
      { rating: 3, count: aggregate.rating_3_count },
      { rating: 2, count: aggregate.rating_2_count },
      { rating: 1, count: aggregate.rating_1_count },
    ].map((item) => ({
      ...item,
      percentage:
        aggregate.total_reviews > 0
          ? Math.round((item.count / aggregate.total_reviews) * 100)
          : 0,
    }));

    return {
      total_reviews: aggregate.total_reviews,
      average_rating: aggregate.average_rating,
      distribution,
    };
  }

  /**
   * Refresh all provider aggregates
   * Background job - run periodically to ensure data consistency
   */
  async refreshAllAggregates(): Promise<number> {
    return this.aggregateRepository.refreshAll();
  }

  /**
   * Check if provider has minimum reviews for trust badge
   */
  async checkTrustBadgeEligibility(providerId: string): Promise<{
    eligible: boolean;
    total_reviews: number;
    average_rating: number;
    minimum_required: number;
    minimum_rating: number;
  }> {
    const aggregate = await this.getProviderAggregate(providerId);

    const minimumRequiredReviews = 10;
    const minimumAverageRating = 4.0;

    const eligible =
      aggregate.total_reviews >= minimumRequiredReviews &&
      aggregate.average_rating >= minimumAverageRating;

    return {
      eligible,
      total_reviews: aggregate.total_reviews,
      average_rating: aggregate.average_rating,
      minimum_required: minimumRequiredReviews,
      minimum_rating: minimumAverageRating,
    };
  }
}

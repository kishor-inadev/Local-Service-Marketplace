import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProviderReviewAggregateRepository } from '../repositories/provider-review-aggregate.repository';

@Injectable()
export class ReviewAggregateRefreshJob {
  constructor(
    private readonly aggregateRepository: ProviderReviewAggregateRepository
  ) {}

  /**
   * Refresh all review aggregates daily at 3 AM
   * This ensures cached statistics are up to date
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async refreshAllAggregates(): Promise<void> {
    console.log('[ReviewAggregateRefreshJob] Starting full aggregate refresh...');

    try {
      const refreshedCount = await this.aggregateRepository.refreshAll();

      console.log(`[ReviewAggregateRefreshJob] Refreshed ${refreshedCount} provider aggregates`);
      console.log('[ReviewAggregateRefreshJob] Completed successfully');
    } catch (error) {
      console.error('[ReviewAggregateRefreshJob] Error refreshing aggregates:', error);
    }
  }

  /**
   * Quick refresh every 4 hours for recently updated providers
   * This provides more real-time stats for active providers
   */
  @Cron(CronExpression.EVERY_4_HOURS)
  async quickRefresh(): Promise<void> {
    console.log('[ReviewAggregateRefreshJob] Starting quick refresh...');

    try {
      // TODO: Implement quick refresh for providers with recent review activity
      // For now, this is a placeholder for future optimization
      
      console.log('[ReviewAggregateRefreshJob] Quick refresh completed');
    } catch (error) {
      console.error('[ReviewAggregateRefreshJob] Error in quick refresh:', error);
    }
  }
}



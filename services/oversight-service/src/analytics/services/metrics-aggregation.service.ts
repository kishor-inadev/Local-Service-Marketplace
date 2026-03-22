import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { MetricsRepository } from '../repositories/metrics.repository';
import { DailyMetric } from '../entities/daily-metric.entity';

@Injectable()
export class MetricsAggregationService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly metricsRepository: MetricsRepository,
  ) {}

  /**
   * Aggregate metrics for a specific date
   * This method is designed to be called by a background job scheduler
   */
  async aggregateMetricsForDate(date: string): Promise<DailyMetric> {
    try {
      this.logger.log(
        `Starting metrics aggregation for date: ${date}`,
        'MetricsAggregationService',
      );

      const metric = await this.metricsRepository.aggregateDailyMetrics(date);

      this.logger.log(
        `Completed metrics aggregation for ${date}: Users=${metric.total_users}, Requests=${metric.total_requests}, Jobs=${metric.total_jobs}, Payments=${metric.total_payments}`,
        'MetricsAggregationService',
      );

      return metric;
    } catch (error) {
      this.logger.error(
        `Failed to aggregate metrics for ${date}: ${error.message}`,
        error.stack,
        'MetricsAggregationService',
      );
      throw error;
    }
  }

  /**
   * Aggregate metrics for yesterday
   * Typically called once per day via a cron job
   */
  async aggregateYesterdayMetrics(): Promise<DailyMetric> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateString = yesterday.toISOString().split('T')[0];

    return this.aggregateMetricsForDate(dateString);
  }

  /**
   * Aggregate metrics for today
   * Can be called for real-time dashboard updates
   */
  async aggregateTodayMetrics(): Promise<DailyMetric> {
    const today = new Date().toISOString().split('T')[0];
    return this.aggregateMetricsForDate(today);
  }

  /**
   * Backfill metrics for a date range
   * Useful for historical data processing
   */
  async backfillMetrics(startDate: string, endDate: string): Promise<DailyMetric[]> {
    try {
      this.logger.log(
        `Starting metrics backfill from ${startDate} to ${endDate}`,
        'MetricsAggregationService',
      );

      const metrics: DailyMetric[] = [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
        const dateString = date.toISOString().split('T')[0];
        const metric = await this.aggregateMetricsForDate(dateString);
        metrics.push(metric);
      }

      this.logger.log(
        `Completed metrics backfill: ${metrics.length} days processed`,
        'MetricsAggregationService',
      );

      return metrics;
    } catch (error) {
      this.logger.error(
        `Failed to backfill metrics: ${error.message}`,
        error.stack,
        'MetricsAggregationService',
      );
      throw error;
    }
  }
}

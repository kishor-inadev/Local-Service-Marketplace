import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { UserActivityRepository } from '../repositories/user-activity.repository';
import { MetricsRepository } from '../repositories/metrics.repository';
import { TrackActivityDto } from '../dto/track-activity.dto';
import { UserActivityLog } from '../entities/user-activity-log.entity';
import { DailyMetric } from '../entities/daily-metric.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly userActivityRepository: UserActivityRepository,
    private readonly metricsRepository: MetricsRepository,
  ) {}

  async trackActivity(trackActivityDto: TrackActivityDto): Promise<UserActivityLog> {
    try {
      const activity = await this.userActivityRepository.trackActivity(trackActivityDto);
      
      this.logger.log(
        `Activity tracked: ${trackActivityDto.action} by user ${trackActivityDto.user_id}`,
        'AnalyticsService',
      );

      return activity;
    } catch (error) {
      this.logger.error(
        `Failed to track activity: ${error.message}`,
        error.stack,
        'AnalyticsService',
      );
      throw error;
    }
  }

  async getUserActivity(
    userId: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<{ data: UserActivityLog[]; total: number }> {
    try {
      const [data, total] = await Promise.all([
        this.userActivityRepository.getUserActivity(userId, limit, offset),
        this.userActivityRepository.getUserActivityCount(userId),
      ]);

      this.logger.log(
        `Retrieved ${data.length} activity logs for user ${userId}`,
        'AnalyticsService',
      );

      return { data, total };
    } catch (error) {
      this.logger.error(
        `Failed to get user activity: ${error.message}`,
        error.stack,
        'AnalyticsService',
      );
      throw error;
    }
  }

  async getAllActivity(
    limit: number = 100,
    offset: number = 0,
  ): Promise<{ data: UserActivityLog[]; total: number }> {
    try {
      const [data, total] = await Promise.all([
        this.userActivityRepository.getAllActivity(limit, offset),
        this.userActivityRepository.getActivityCount(),
      ]);

      this.logger.log(
        `Retrieved ${data.length} activity logs`,
        'AnalyticsService',
      );

      return { data, total };
    } catch (error) {
      this.logger.error(
        `Failed to get all activity: ${error.message}`,
        error.stack,
        'AnalyticsService',
      );
      throw error;
    }
  }

  async getActivityByAction(action: string, limit: number = 100): Promise<UserActivityLog[]> {
    try {
      const data = await this.userActivityRepository.getActivityByAction(action, limit);

      this.logger.log(
        `Retrieved ${data.length} activity logs for action ${action}`,
        'AnalyticsService',
      );

      return data;
    } catch (error) {
      this.logger.error(
        `Failed to get activity by action: ${error.message}`,
        error.stack,
        'AnalyticsService',
      );
      throw error;
    }
  }

  async getDailyMetrics(
    startDate?: string,
    endDate?: string,
    limit: number = 30,
  ): Promise<DailyMetric[]> {
    try {
      const metrics = await this.metricsRepository.getDailyMetrics(
        startDate,
        endDate,
        limit,
      );

      this.logger.log(
        `Retrieved ${metrics.length} daily metrics`,
        'AnalyticsService',
      );

      return metrics;
    } catch (error) {
      this.logger.error(
        `Failed to get daily metrics: ${error.message}`,
        error.stack,
        'AnalyticsService',
      );
      throw error;
    }
  }

  async getMetricByDate(date: string): Promise<DailyMetric | null> {
    try {
      const metric = await this.metricsRepository.getMetricByDate(date);

      this.logger.log(
        `Retrieved metric for date ${date}`,
        'AnalyticsService',
      );

      return metric;
    } catch (error) {
      this.logger.error(
        `Failed to get metric by date: ${error.message}`,
        error.stack,
        'AnalyticsService',
      );
      throw error;
    }
  }
}

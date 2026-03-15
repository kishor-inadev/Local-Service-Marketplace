import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Inject,
  LoggerService,
  HttpStatus,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AnalyticsService } from '../services/analytics.service';
import { MetricsAggregationService } from '../services/metrics-aggregation.service';
import { TrackActivityDto } from '../dto/track-activity.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly analyticsService: AnalyticsService,
    private readonly metricsAggregationService: MetricsAggregationService,
  ) {}

  @Post('activity')
  async trackActivity(@Body() trackActivityDto: TrackActivityDto) {
    this.logger.log(
      `POST /analytics/activity - Track activity for user ${trackActivityDto.user_id}`,
      'AnalyticsController',
    );

    const activity = await this.analyticsService.trackActivity(trackActivityDto);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Activity tracked successfully',
      data: activity,
    };
  }

  @Get('user-activity')
  async getAllActivity(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    this.logger.log(
      `GET /analytics/user-activity - Retrieve all activity logs`,
      'AnalyticsController',
    );

    const parsedLimit = limit ? parseInt(limit) : 100;
    const parsedOffset = offset ? parseInt(offset) : 0;

    const result = await this.analyticsService.getAllActivity(
      parsedLimit,
      parsedOffset,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Activity logs retrieved successfully',
      data: result.data,
      pagination: {
        limit: parsedLimit,
        offset: parsedOffset,
        total: result.total,
      },
    };
  }

  @Get('user-activity/:userId')
  async getUserActivity(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    this.logger.log(
      `GET /analytics/user-activity/${userId} - Retrieve activity for user`,
      'AnalyticsController',
    );

    const parsedLimit = limit ? parseInt(limit) : 100;
    const parsedOffset = offset ? parseInt(offset) : 0;

    const result = await this.analyticsService.getUserActivity(
      userId,
      parsedLimit,
      parsedOffset,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'User activity retrieved successfully',
      data: result.data,
      pagination: {
        limit: parsedLimit,
        offset: parsedOffset,
        total: result.total,
      },
    };
  }

  @Get('user-activity/action/:action')
  async getActivityByAction(
    @Param('action') action: string,
    @Query('limit') limit?: string,
  ) {
    this.logger.log(
      `GET /analytics/user-activity/action/${action} - Retrieve activity by action`,
      'AnalyticsController',
    );

    const parsedLimit = limit ? parseInt(limit) : 100;
    const data = await this.analyticsService.getActivityByAction(action, parsedLimit);

    return {
      statusCode: HttpStatus.OK,
      message: 'Activity logs retrieved successfully',
      data,
    };
  }

  @Get('metrics')
  async getDailyMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    this.logger.log(
      `GET /analytics/metrics - Retrieve daily metrics`,
      'AnalyticsController',
    );

    const parsedLimit = limit ? parseInt(limit) : 30;
    const data = await this.analyticsService.getDailyMetrics(
      startDate,
      endDate,
      parsedLimit,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Daily metrics retrieved successfully',
      data,
    };
  }

  @Get('metrics/:date')
  async getMetricByDate(@Param('date') date: string) {
    this.logger.log(
      `GET /analytics/metrics/${date} - Retrieve metric for specific date`,
      'AnalyticsController',
    );

    const data = await this.analyticsService.getMetricByDate(date);

    return {
      statusCode: HttpStatus.OK,
      message: 'Metric retrieved successfully',
      data,
    };
  }

  // Worker endpoints for background job processing
  @Post('workers/aggregate-today')
  async aggregateTodayMetrics() {
    this.logger.log(
      `POST /analytics/workers/aggregate-today - Trigger today metrics aggregation`,
      'AnalyticsController',
    );

    const metric = await this.metricsAggregationService.aggregateTodayMetrics();

    return {
      statusCode: HttpStatus.OK,
      message: 'Today metrics aggregated successfully',
      data: metric,
    };
  }

  @Post('workers/aggregate-yesterday')
  async aggregateYesterdayMetrics() {
    this.logger.log(
      `POST /analytics/workers/aggregate-yesterday - Trigger yesterday metrics aggregation`,
      'AnalyticsController',
    );

    const metric = await this.metricsAggregationService.aggregateYesterdayMetrics();

    return {
      statusCode: HttpStatus.OK,
      message: 'Yesterday metrics aggregated successfully',
      data: metric,
    };
  }

  @Post('workers/aggregate/:date')
  async aggregateMetricsForDate(@Param('date') date: string) {
    this.logger.log(
      `POST /analytics/workers/aggregate/${date} - Trigger metrics aggregation for date`,
      'AnalyticsController',
    );

    const metric = await this.metricsAggregationService.aggregateMetricsForDate(date);

    return {
      statusCode: HttpStatus.OK,
      message: `Metrics aggregated successfully for ${date}`,
      data: metric,
    };
  }

  @Post('workers/backfill')
  async backfillMetrics(
    @Body() body: { startDate: string; endDate: string },
  ) {
    this.logger.log(
      `POST /analytics/workers/backfill - Backfill metrics from ${body.startDate} to ${body.endDate}`,
      'AnalyticsController',
    );

    const metrics = await this.metricsAggregationService.backfillMetrics(
      body.startDate,
      body.endDate,
    );

    return {
      statusCode: HttpStatus.OK,
      message: `Backfilled ${metrics.length} days of metrics`,
      data: metrics,
    };
  }
}

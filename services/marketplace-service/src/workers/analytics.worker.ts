import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, LoggerService, OnModuleInit } from '@nestjs/common';
import { Job } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AnalyticsClient } from '../../common/analytics/analytics.client';

@Processor('marketplace.analytics', {
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
})
export class MarketplaceAnalyticsWorker extends WorkerHost implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly analyticsClient: AnalyticsClient,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    // No repeatable jobs — analytics are event-driven
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { userId, action, resource, resourceId, metadata } = job.data;
    try {
      this.analyticsClient.track({ userId, action, resource, resourceId, metadata });
      this.logger.log(`Analytics tracked: ${action} on ${resource}/${resourceId}`, 'MarketplaceAnalyticsWorker');
    } catch (error) {
      this.logger.warn(`Analytics track failed: ${error.message}`, 'MarketplaceAnalyticsWorker');
      throw error;
    }
    return;
  }
}

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Inject, LoggerService, OnModuleInit } from '@nestjs/common';
import { Job } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AnalyticsClient } from '../common/analytics/analytics.client';

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
      this.logger.error(`Analytics track failed: ${error.message}`, error.stack, 'MarketplaceAnalyticsWorker');
      throw error;
    }
    return;
  }

  // ─────────────────────────────────────────────────────────────────
  // Worker lifecycle hooks
  // ─────────────────────────────────────────────────────────────────

  @OnWorkerEvent('active')
  onActive(job: Job): void {
    this.logger.log(`Job "${job.name}/${job.id}" started (attempt ${job.attemptsMade + 1})`, 'MarketplaceAnalyticsWorker');
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Job "${job.name}/${job.id}" completed`, 'MarketplaceAnalyticsWorker');
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    this.logger.error(
      `Job "${job?.name ?? 'unknown'}/${job?.id ?? '?'}" failed (attempt ${job?.attemptsMade ?? 0}): ${error.message}`,
      error.stack,
      'MarketplaceAnalyticsWorker',
    );
  }

  @OnWorkerEvent('error')
  onError(error: Error): void {
    this.logger.error(`Worker error: ${error.message}`, error.stack, 'MarketplaceAnalyticsWorker');
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string): void {
    this.logger.warn(`Job ${jobId} stalled and will be requeued`, 'MarketplaceAnalyticsWorker');
  }
}

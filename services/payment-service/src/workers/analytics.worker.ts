import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Inject, LoggerService, OnModuleInit } from '@nestjs/common';
import { Job } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AnalyticsClient } from '../common/analytics/analytics.client';

export interface TrackPaymentEventJobData {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  metadata?: Record<string, any>;
}

/**
 * AnalyticsWorker — consumes the "payment.analytics" queue.
 *
 * Handles analytics tracking events enqueued by PaymentService after
 * successful/failed payment operations. Forwards events to the
 * oversight-service analytics API in a non-blocking, retryable way.
 */
@Processor('payment.analytics', {
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
})
export class PaymentAnalyticsWorker extends WorkerHost implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly analyticsClient: AnalyticsClient,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    // No repeatable jobs — analytics events are enqueued per payment event
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'track-payment-completed':
      case 'track-payment-failed':
      case 'track-refund-processed':
        return this.handleTrackEvent(job as Job<TrackPaymentEventJobData>);
      default:
        this.logger.warn(
          `PaymentAnalyticsWorker: unknown job "${job.name}" — skipping`,
          'PaymentAnalyticsWorker',
        );
    }
  }

  private async handleTrackEvent(job: Job<TrackPaymentEventJobData>): Promise<void> {
    const { userId, action, resource, resourceId, metadata } = job.data;

    this.logger.log(
      `PaymentAnalyticsWorker: tracking event "${action}" for ${resource}:${resourceId}`,
      'PaymentAnalyticsWorker',
    );

    try {
      await this.analyticsClient.track({
        userId,
        action,
        resource,
        resourceId,
        metadata,
      });

      this.logger.log(
        `PaymentAnalyticsWorker: event "${action}" tracked successfully`,
        'PaymentAnalyticsWorker',
      );
    } catch (error: any) {
      const err = error as Error;
      this.logger.error(
        `PaymentAnalyticsWorker: failed to track event "${action}" — ${err.message}`,
        err.stack,
        'PaymentAnalyticsWorker',
      );
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Worker lifecycle hooks
  // ─────────────────────────────────────────────────────────────────

  @OnWorkerEvent('active')
  onActive(job: Job): void {
    this.logger.log(`Job "${job.name}/${job.id}" started (attempt ${job.attemptsMade + 1})`, 'PaymentAnalyticsWorker');
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Job "${job.name}/${job.id}" completed`, 'PaymentAnalyticsWorker');
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    this.logger.error(
      `Job "${job?.name ?? 'unknown'}/${job?.id ?? '?'}" failed (attempt ${job?.attemptsMade ?? 0}): ${error.message}`,
      error.stack,
      'PaymentAnalyticsWorker',
    );
  }

  @OnWorkerEvent('error')
  onError(error: Error): void {
    this.logger.error(`Worker error: ${error.message}`, error.stack, 'PaymentAnalyticsWorker');
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string): void {
    this.logger.warn(`Job ${jobId} stalled and will be requeued`, 'PaymentAnalyticsWorker');
  }
}

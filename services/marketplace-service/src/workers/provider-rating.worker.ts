import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, LoggerService, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ProviderReviewAggregateRepository } from '../modules/review/repositories/provider-review-aggregate.repository';
import { DEFAULT_JOB_OPTIONS } from '../bullmq/bullmq-default-options';

@Processor('marketplace.rating', {
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '3', 10),
})
export class ProviderRatingWorker extends WorkerHost implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectQueue('marketplace.rating') private readonly ratingQueue: Queue,
    private readonly aggregateRepository: ProviderReviewAggregateRepository,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    // Replace @Cron(EVERY_DAY_AT_3AM) from ReviewAggregateRefreshJob
    await this.ratingQueue.add(
      'full-aggregate-refresh',
      {},
      { ...DEFAULT_JOB_OPTIONS, repeat: { pattern: '0 3 * * *' } },
    );

    // Replace @Cron(EVERY_4_HOURS) from ReviewAggregateRefreshJob
    await this.ratingQueue.add(
      'quick-aggregate-refresh',
      {},
      { ...DEFAULT_JOB_OPTIONS, repeat: { pattern: '0 */4 * * *' } },
    );

    this.logger.log('Provider rating repeatable jobs registered', 'ProviderRatingWorker');
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'full-aggregate-refresh':
        return this.handleFullAggregateRefresh();
      case 'quick-aggregate-refresh':
        return this.handleQuickAggregateRefresh();
      case 'recalculate-provider-rating':
        return this.handleRecalculateProviderRating(job.data);
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }

  private async handleFullAggregateRefresh(): Promise<void> {
    this.logger.log('Starting full provider rating aggregate refresh', 'ProviderRatingWorker');
    const count = await this.aggregateRepository.refreshAllAggregates();
    this.logger.log(`Full aggregate refresh completed: ${count} providers updated`, 'ProviderRatingWorker');
  }

  private async handleQuickAggregateRefresh(): Promise<void> {
    this.logger.log('Starting quick provider rating aggregate refresh', 'ProviderRatingWorker');
    const count = await this.aggregateRepository.refreshRecentAggregates();
    this.logger.log(`Quick aggregate refresh completed: ${count} providers updated`, 'ProviderRatingWorker');
  }

  private async handleRecalculateProviderRating(data: { providerId: string }): Promise<void> {
    const { providerId } = data;
    this.logger.log(`Recalculating rating for provider ${providerId}`, 'ProviderRatingWorker');
    await this.aggregateRepository.refreshByProvider(providerId);
  }
}

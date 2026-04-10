import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, LoggerService, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { RequestRepository } from '../modules/request/repositories/request.repository';
import { DEFAULT_JOB_OPTIONS } from '../bullmq/bullmq-default-options';

@Processor('marketplace.cleanup', {
  concurrency: 1,
})
export class MarketplaceCleanupWorker extends WorkerHost implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectQueue('marketplace.cleanup') private readonly cleanupQueue: Queue,
    private readonly requestRepository: RequestRepository,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    // Daily 2 AM — expire stale open requests older than 30 days
    await this.cleanupQueue.add(
      'expire-stale-requests',
      {},
      { ...DEFAULT_JOB_OPTIONS, repeat: { pattern: '0 2 * * *' } },
    );
    this.logger.log('Marketplace cleanup repeatable jobs registered', 'MarketplaceCleanupWorker');
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'expire-stale-requests':
        return this.handleExpireStaleRequests();
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }

  private async handleExpireStaleRequests(): Promise<void> {
    this.logger.log('Expiring stale open requests', 'MarketplaceCleanupWorker');
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const count = await this.requestRepository.expireStaleRequests(cutoff);
    this.logger.log(`Expired ${count} stale requests`, 'MarketplaceCleanupWorker');
  }
}

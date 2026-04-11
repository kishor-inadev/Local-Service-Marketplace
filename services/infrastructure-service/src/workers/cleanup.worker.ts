import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Inject, LoggerService, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { EventRepository } from '../infrastructure/repositories/event.repository';
import { BackgroundJobRepository } from '../infrastructure/repositories/background-job.repository';
import { DEFAULT_JOB_OPTIONS } from '../bullmq/bullmq-default-options';

@Processor('infra.cleanup', {
  concurrency: 1,
})
export class InfraCleanupWorker extends WorkerHost implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectQueue('infra.cleanup') private readonly cleanupQueue: Queue,
    private readonly eventRepository: EventRepository,
    private readonly backgroundJobRepository: BackgroundJobRepository,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    // Weekly Sunday 2 AM — purge old events
    await this.cleanupQueue.add(
      'purge-old-events',
      {},
      { ...DEFAULT_JOB_OPTIONS, repeat: { pattern: '0 2 * * 0' } },
    );

    // Weekly Sunday 3 AM — purge old completed background jobs
    await this.cleanupQueue.add(
      'purge-old-background-jobs',
      {},
      { ...DEFAULT_JOB_OPTIONS, repeat: { pattern: '0 3 * * 0' } },
    );

    this.logger.log('Infrastructure cleanup repeatable jobs registered', 'InfraCleanupWorker');
  }

  async process(job: Job<any, any, string>): Promise<any> {
    try {
      switch (job.name) {
        case 'purge-old-events':
          return this.handlePurgeOldEvents();
        case 'purge-old-background-jobs':
          return this.handlePurgeOldBackgroundJobs();
        default:
          throw new Error(`Unknown job name: ${job.name}`);
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Job "${job.name}/${job.id}" threw: ${err.message}`, err.stack, 'InfraCleanupWorker');
      throw error;
    }
  }

  private async handlePurgeOldEvents(): Promise<void> {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.logger.log(`Purging events before ${cutoff.toISOString()}`, 'InfraCleanupWorker');
    const count = await this.eventRepository.deleteOlderThan(cutoff);
    this.logger.log(`Purged ${count} old events`, 'InfraCleanupWorker');
  }

  private async handlePurgeOldBackgroundJobs(): Promise<void> {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.logger.log(`Purging completed background jobs before ${cutoff.toISOString()}`, 'InfraCleanupWorker');
    const count = await this.backgroundJobRepository.deleteCompletedBefore(cutoff);
    this.logger.log(`Purged ${count} old background jobs`, 'InfraCleanupWorker');
  }

  // ─────────────────────────────────────────────────────────────────
  // Worker lifecycle hooks
  // ─────────────────────────────────────────────────────────────────

  @OnWorkerEvent('active')
  onActive(job: Job): void {
    this.logger.log(`Job "${job.name}/${job.id}" started (attempt ${job.attemptsMade + 1})`, 'InfraCleanupWorker');
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Job "${job.name}/${job.id}" completed`, 'InfraCleanupWorker');
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    this.logger.error(
      `Job "${job?.name ?? 'unknown'}/${job?.id ?? '?'}" failed (attempt ${job?.attemptsMade ?? 0}): ${error.message}`,
      error.stack,
      'InfraCleanupWorker',
    );
  }

  @OnWorkerEvent('error')
  onError(error: Error): void {
    this.logger.error(`Worker error: ${error.message}`, error.stack, 'InfraCleanupWorker');
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string): void {
    this.logger.warn(`Job ${jobId} stalled and will be requeued`, 'InfraCleanupWorker');
  }
}

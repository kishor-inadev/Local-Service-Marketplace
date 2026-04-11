import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Inject, LoggerService, OnModuleInit } from '@nestjs/common';
import { Job } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { BackgroundJobRepository } from '../infrastructure/repositories/background-job.repository';

@Processor('infra.background-jobs', {
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
})
export class BackgroundJobWorker extends WorkerHost implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly backgroundJobRepository: BackgroundJobRepository,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    // No repeatable jobs — background jobs are triggered on demand
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { jobId } = job.data;
    // jobType is stored as the BullMQ job name, not inside job.data
    const jobType = job.name;
    this.logger.log(`Processing background job ${jobId} of type ${jobType}`, 'BackgroundJobWorker');

    try {
      await this.backgroundJobRepository.updateJobStatus(jobId, 'running');

      // Execute the job based on type
      await this.executeJobByType(jobType, job.data);

      await this.backgroundJobRepository.updateJobStatus(jobId, 'completed');
      this.logger.log(`Background job ${jobId} completed successfully`, 'BackgroundJobWorker');
    } catch (error: any) {
      this.logger.error(`Background job ${jobId} failed: ${error.message}`, error.stack, 'BackgroundJobWorker');
      await this.backgroundJobRepository.updateJobStatus(jobId, 'failed');
      throw error;
    }
  }

  private async executeJobByType(jobType: string, data: any): Promise<void> {
    switch (jobType) {
      case 'send-email':
        // Delegate to comms-service via HTTP/event
        this.logger.log(`Delegating send-email job: ${JSON.stringify(data)}`, 'BackgroundJobWorker');
        break;
      case 'cleanup-expired-data':
        this.logger.log('Executing cleanup-expired-data job', 'BackgroundJobWorker');
        break;
      case 'recalculate-metrics':
        this.logger.log('Executing recalculate-metrics job', 'BackgroundJobWorker');
        break;
      default:
        this.logger.warn(`Unknown job type: ${jobType} — skipping`, 'BackgroundJobWorker');
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Worker lifecycle hooks
  // ─────────────────────────────────────────────────────────────────

  @OnWorkerEvent('active')
  onActive(job: Job): void {
    this.logger.log(`Job "${job.name}/${job.id}" started (attempt ${job.attemptsMade + 1})`, 'BackgroundJobWorker');
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Job "${job.name}/${job.id}" completed`, 'BackgroundJobWorker');
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    this.logger.error(
      `Job "${job?.name ?? 'unknown'}/${job?.id ?? '?'}" failed (attempt ${job?.attemptsMade ?? 0}): ${error.message}`,
      error.stack,
      'BackgroundJobWorker',
    );
  }

  @OnWorkerEvent('error')
  onError(error: Error): void {
    this.logger.error(`Worker error: ${error.message}`, error.stack, 'BackgroundJobWorker');
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string): void {
    this.logger.warn(`Job ${jobId} stalled and will be requeued`, 'BackgroundJobWorker');
  }
}

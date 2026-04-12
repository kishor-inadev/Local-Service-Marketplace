import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Inject, LoggerService, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { firstValueFrom } from 'rxjs';
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
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
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
      case 'send-email': {
        const commsUrl = this.configService.get<string>(
          'COMMS_SERVICE_URL',
          'http://comms-service:3007',
        );
        await firstValueFrom(
          this.httpService.post(`${commsUrl}/notifications/send-direct`, {
            to: data.to,
            template: data.template,
            variables: data.variables,
          }),
        );
        this.logger.log(`send-email job delegated to comms-service for ${data.to}`, 'BackgroundJobWorker');
        break;
      }
      case 'cleanup-expired-data': {
        const cutoffDays = parseInt(
          this.configService.get<string>('CLEANUP_RETENTION_DAYS', '30'),
          10,
        );
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - cutoffDays);
        const deleted = await this.backgroundJobRepository.deleteCompletedBefore(cutoff);
        this.logger.log(
          `cleanup-expired-data: removed ${deleted} completed jobs older than ${cutoffDays} days`,
          'BackgroundJobWorker',
        );
        break;
      }
      case 'recalculate-metrics':
        // Metrics are owned by oversight-service; no action required here
        this.logger.log('recalculate-metrics: delegated to oversight-service (no-op in infra)', 'BackgroundJobWorker');
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

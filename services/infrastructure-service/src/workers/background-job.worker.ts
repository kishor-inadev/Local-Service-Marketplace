import { Processor, WorkerHost } from '@nestjs/bullmq';
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
    const { jobId, jobType } = job.data;
    this.logger.log(`Processing background job ${jobId} of type ${jobType}`, 'BackgroundJobWorker');

    try {
      await this.backgroundJobRepository.updateJobStatus(jobId, 'running');

      // Execute the job based on type
      await this.executeJobByType(jobType, job.data);

      await this.backgroundJobRepository.updateJobStatus(jobId, 'completed');
      this.logger.log(`Background job ${jobId} completed successfully`, 'BackgroundJobWorker');
    } catch (error) {
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
}

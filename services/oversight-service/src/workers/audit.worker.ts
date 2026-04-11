import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Inject, LoggerService, OnModuleInit } from '@nestjs/common';
import { Job } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AuditLogRepository } from '../admin/repositories/audit-log.repository';

export interface WriteAuditLogJobData {
  userId: string | null;
  action: string;
  entity: string;
  entityId: string;
  details?: Record<string, any>;
}

@Processor('oversight.audit', {
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
})
export class AuditWorker extends WorkerHost implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly auditLogRepository: AuditLogRepository,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    // No repeatable jobs — audit logs are event-driven
  }

  async process(job: Job<any, any, string>): Promise<any> {
    try {
      switch (job.name) {
        case 'write-audit-log':
          return this.handleWriteAuditLog(job as Job<WriteAuditLogJobData>);
        default:
          throw new Error(`Unknown job name: ${job.name}`);
      }
    } catch (error: any) {
      const err = error as Error;
      this.logger.error(`Job "${job.name}/${job.id}" threw: ${err.message}`, err.stack, 'AuditWorker');
      throw error;
    }
  }

  private async handleWriteAuditLog(job: Job<WriteAuditLogJobData>): Promise<void> {
    const { userId, action, entity, entityId, details } = job.data;
    await this.auditLogRepository.createAuditLog(userId, action, entity, entityId, details ?? {});
    this.logger.log(`Audit log written: ${action} on ${entity}/${entityId}`, 'AuditWorker');
  }

  // ─────────────────────────────────────────────────────────────────
  // Worker lifecycle hooks
  // ─────────────────────────────────────────────────────────────────

  @OnWorkerEvent('active')
  onActive(job: Job): void {
    this.logger.log(`Job "${job.name}/${job.id}" started (attempt ${job.attemptsMade + 1})`, 'AuditWorker');
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Job "${job.name}/${job.id}" completed`, 'AuditWorker');
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    this.logger.error(
      `Job "${job?.name ?? 'unknown'}/${job?.id ?? '?'}" failed (attempt ${job?.attemptsMade ?? 0}): ${error.message}`,
      error.stack,
      'AuditWorker',
    );
  }

  @OnWorkerEvent('error')
  onError(error: Error): void {
    this.logger.error(`Worker error: ${error.message}`, error.stack, 'AuditWorker');
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string): void {
    this.logger.warn(`Job ${jobId} stalled and will be requeued`, 'AuditWorker');
  }
}

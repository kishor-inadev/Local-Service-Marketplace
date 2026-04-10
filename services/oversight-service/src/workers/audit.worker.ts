import { Processor, WorkerHost } from '@nestjs/bullmq';
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
    switch (job.name) {
      case 'write-audit-log':
        return this.handleWriteAuditLog(job as Job<WriteAuditLogJobData>);
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }

  private async handleWriteAuditLog(job: Job<WriteAuditLogJobData>): Promise<void> {
    const { userId, action, entity, entityId, details } = job.data;
    await this.auditLogRepository.createAuditLog(userId, action, entity, entityId, details ?? {});
    this.logger.log(`Audit log written: ${action} on ${entity}/${entityId}`, 'AuditWorker');
  }
}

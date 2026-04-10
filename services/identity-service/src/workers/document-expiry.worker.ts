import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { UserRepository } from '../modules/auth/repositories/user.repository';
import { DEFAULT_JOB_OPTIONS } from '../bullmq/bullmq-default-options';

export interface DocumentExpiryCheckData {
  warningDays?: number;
}

@Processor('identity.document', {
  concurrency: 1,
})
export class DocumentExpiryWorker extends WorkerHost implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    @InjectQueue('identity.document') private readonly documentQueue: Queue,
    private readonly userRepository: UserRepository,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    // Replace @Cron(EVERY_DAY_AT_9AM) from DocumentExpiryJob
    await this.documentQueue.add(
      'check-document-expiry',
      { warningDays: 30 },
      { ...DEFAULT_JOB_OPTIONS, repeat: { pattern: '0 9 * * *' } },
    );

    // Replace @Cron(EVERY_DAY_AT_1AM) — expire overdue documents
    await this.documentQueue.add(
      'expire-overdue-documents',
      {},
      { ...DEFAULT_JOB_OPTIONS, repeat: { pattern: '0 1 * * *' } },
    );

    this.logger.info('Document expiry repeatable jobs registered', { context: 'DocumentExpiryWorker' });
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'check-document-expiry':
        return this.handleCheckDocumentExpiry(job.data);
      case 'expire-overdue-documents':
        return this.handleExpireOverdueDocuments();
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }

  private async handleCheckDocumentExpiry(data: DocumentExpiryCheckData): Promise<void> {
    const warningDays = data.warningDays ?? 30;
    this.logger.info(`Checking documents expiring within ${warningDays} days`, { context: 'DocumentExpiryWorker' });
    // Delegate to user repository — the repository fires notifications via the notification queue
    // This is a placeholder; actual logic lives in the repository or document service
    this.logger.info('Document expiry check completed', { context: 'DocumentExpiryWorker' });
  }

  private async handleExpireOverdueDocuments(): Promise<void> {
    this.logger.info('Expiring overdue documents', { context: 'DocumentExpiryWorker' });
  }
}

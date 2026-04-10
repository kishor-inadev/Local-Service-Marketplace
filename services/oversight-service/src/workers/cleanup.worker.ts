import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, LoggerService, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AuditLogRepository } from '../admin/repositories/audit-log.repository';
import { UserActivityRepository } from '../analytics/repositories/user-activity.repository';
import { MetricsRepository } from '../analytics/repositories/metrics.repository';
import { DEFAULT_JOB_OPTIONS } from '../bullmq/bullmq-default-options';

@Processor('oversight.cleanup', {
  concurrency: 1,
})
export class OversightCleanupWorker extends WorkerHost implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectQueue('oversight.cleanup') private readonly cleanupQueue: Queue,
    private readonly auditLogRepository: AuditLogRepository,
    private readonly userActivityRepository: UserActivityRepository,
    private readonly metricsRepository: MetricsRepository,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    // Weekly Sunday 2 AM — purge audit logs older than 365 days
    await this.cleanupQueue.add(
      'purge-old-audit-logs',
      {},
      { ...DEFAULT_JOB_OPTIONS, repeat: { pattern: '0 2 * * 0' } },
    );

    // Weekly Sunday 3 AM — purge user activity logs older than 90 days
    await this.cleanupQueue.add(
      'purge-old-activity-logs',
      {},
      { ...DEFAULT_JOB_OPTIONS, repeat: { pattern: '0 3 * * 0' } },
    );

    // Daily 4 AM — aggregate daily metrics
    await this.cleanupQueue.add(
      'aggregate-daily-metrics',
      {},
      { ...DEFAULT_JOB_OPTIONS, repeat: { pattern: '0 4 * * *' } },
    );

    this.logger.log('Oversight cleanup repeatable jobs registered', 'OversightCleanupWorker');
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'purge-old-audit-logs':
        return this.handlePurgeOldAuditLogs();
      case 'purge-old-activity-logs':
        return this.handlePurgeOldActivityLogs();
      case 'aggregate-daily-metrics':
        return this.handleAggregateDailyMetrics();
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }

  private async handlePurgeOldAuditLogs(): Promise<void> {
    const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    this.logger.log(`Purging audit logs before ${cutoff.toISOString()}`, 'OversightCleanupWorker');
    const count = await this.auditLogRepository.deleteOlderThan(cutoff);
    this.logger.log(`Purged ${count} old audit logs`, 'OversightCleanupWorker');
  }

  private async handlePurgeOldActivityLogs(): Promise<void> {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    this.logger.log(`Purging activity logs before ${cutoff.toISOString()}`, 'OversightCleanupWorker');
    const count = await this.userActivityRepository.deleteOlderThan(cutoff);
    this.logger.log(`Purged ${count} old activity logs`, 'OversightCleanupWorker');
  }

  private async handleAggregateDailyMetrics(): Promise<void> {
    this.logger.log('Aggregating daily metrics', 'OversightCleanupWorker');
    await this.metricsRepository.aggregateYesterdayMetrics();
    this.logger.log('Daily metrics aggregation completed', 'OversightCleanupWorker');
  }
}

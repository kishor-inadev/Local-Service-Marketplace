import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuditWorker } from './audit.worker';
import { OversightCleanupWorker } from './cleanup.worker';
import { AuditLogRepository } from '../admin/repositories/audit-log.repository';
import { UserActivityRepository } from '../analytics/repositories/user-activity.repository';
import { MetricsRepository } from '../analytics/repositories/metrics.repository';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'oversight.audit' },
      { name: 'oversight.cleanup' },
    ),
  ],
  providers: [
    AuditWorker,
    OversightCleanupWorker,
    AuditLogRepository,
    UserActivityRepository,
    MetricsRepository,
  ],
})
export class WorkersModule {}

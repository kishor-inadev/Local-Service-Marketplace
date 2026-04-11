import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuditWorker } from './audit.worker';
import { OversightCleanupWorker } from './cleanup.worker';
import { AuditLogRepository } from '../admin/repositories/audit-log.repository';
import { UserActivityRepository } from '../analytics/repositories/user-activity.repository';
import { MetricsRepository } from '../analytics/repositories/metrics.repository';
import { getQueueRegistrationOptions } from '../config/queue-config';

/**
 * Oversight Workers Module
 * 
 * Queue Configuration:
 *   - oversight.audit:    30s timeout, NORMAL priority, 2 attempts
 *   - oversight.cleanup:  120s timeout, LOW priority,   2 attempts
 */
@Module({
  imports: [
    BullModule.registerQueue(
      getQueueRegistrationOptions('oversight.audit'),
      getQueueRegistrationOptions('oversight.cleanup'),
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

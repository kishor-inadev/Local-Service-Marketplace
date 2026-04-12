import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuditWorker } from './audit.worker';
import { OversightCleanupWorker } from './cleanup.worker';
import { DisputeNotificationWorker } from './dispute-notification.worker';
import { AuditLogRepository } from '../admin/repositories/audit-log.repository';
import { DisputeRepository } from '../admin/repositories/dispute.repository';
import { UserActivityRepository } from '../analytics/repositories/user-activity.repository';
import { MetricsRepository } from '../analytics/repositories/metrics.repository';
import { NotificationClient } from '../common/notification/notification.client';
import { UserClient } from '../common/user/user.client';
import { getQueueRegistrationOptions } from '../config/queue-config';

/**
 * Oversight Workers Module
 * 
 * Queue Configuration:
 *   - oversight.audit:         30s timeout, NORMAL priority, 2 attempts
 *   - oversight.notification:  10s timeout, HIGH priority,   3 attempts
 *   - oversight.cleanup:       120s timeout, LOW priority,   2 attempts
 */
@Module({
  imports: [
    BullModule.registerQueue(
      getQueueRegistrationOptions('oversight.audit'),
      getQueueRegistrationOptions('oversight.notification'),
      getQueueRegistrationOptions('oversight.cleanup'),
    ),
  ],
  providers: [
    AuditWorker,
    DisputeNotificationWorker,
    OversightCleanupWorker,
    AuditLogRepository,
    DisputeRepository,
    UserActivityRepository,
    MetricsRepository,
    NotificationClient,
    UserClient,
  ],
})
export class WorkersModule {}

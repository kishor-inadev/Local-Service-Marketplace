import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IdentityNotificationWorker } from './notification.worker';
import { IdentityCleanupWorker } from './cleanup.worker';
import { DocumentExpiryWorker } from './document-expiry.worker';
import { NotificationModule } from '../common/notification/notification.module';
import { UserRepository } from '../modules/auth/repositories/user.repository';
import { SessionRepository } from '../modules/auth/repositories/session.repository';
import { getQueueRegistrationOptions } from '../config/queue-config';

/**
 * Identity Workers Module
 * 
 * Queue Configuration:
 *   - identity.notification: 10s timeout, CRITICAL priority (auth emails)
 *   - identity.cleanup:      120s timeout, LOW priority
 *   - identity.document:     60s timeout, NORMAL priority
 */
@Module({
  imports: [
    BullModule.registerQueue(
      getQueueRegistrationOptions('identity.notification'),
      getQueueRegistrationOptions('identity.cleanup'),
      getQueueRegistrationOptions('identity.document'),
    ),
    NotificationModule,
  ],
  providers: [
    IdentityNotificationWorker,
    IdentityCleanupWorker,
    DocumentExpiryWorker,
    UserRepository,
    SessionRepository,
  ],
})
export class WorkersModule {}

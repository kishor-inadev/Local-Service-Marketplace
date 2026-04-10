import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IdentityNotificationWorker } from './notification.worker';
import { IdentityCleanupWorker } from './cleanup.worker';
import { DocumentExpiryWorker } from './document-expiry.worker';
import { NotificationModule } from '../common/notification/notification.module';
import { UserRepository } from '../modules/auth/repositories/user.repository';
import { SessionRepository } from '../modules/auth/repositories/session.repository';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'identity.notification' },
      { name: 'identity.cleanup' },
      { name: 'identity.document' },
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

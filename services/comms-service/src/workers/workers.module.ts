import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { EmailWorker } from './email.worker';
import { SmsWorker } from './sms.worker';
import { PushWorker } from './push.worker';
import { DigestWorker } from './digest.worker';
import { CleanupWorker } from './cleanup.worker';
import { NotificationModule } from '../notification/notification.module';
import { UserModule } from '../common/user/user.module';
import { DeadLetterQueueService } from '../common/dlq/dead-letter-queue.service';
import { DatabaseModule } from '../common/database/database.module';
import { getQueueRegistrationOptions } from '../config/queue-config';

/**
 * WorkersModule — only imported when WORKERS_ENABLED=true.
 *
 * Registers all BullMQ worker processors.  Workers also register their
 * repeatable jobs on startup via OnModuleInit.
 *
 * In production deploy two container types:
 *   - web pod:    WORKERS_ENABLED=false  (no workers, smaller footprint)
 *   - worker pod: WORKERS_ENABLED=true   (workers only, no HTTP traffic)
 * 
 * Queue Configuration:
 *   - Email:   10s timeout, HIGH priority, 3 attempts
 *   - SMS:     15s timeout, HIGH priority, 3 attempts
 *   - Push:    5s timeout,  HIGH priority, 3 attempts
 *   - Digest:  60s timeout, LOW priority,  2 attempts
 *   - Cleanup: 120s timeout, LOW priority, 2 attempts
 */
@Module({
  imports: [
    BullModule.registerQueue(
      getQueueRegistrationOptions('comms.email'),
      getQueueRegistrationOptions('comms.sms'),
      getQueueRegistrationOptions('comms.push'),
      getQueueRegistrationOptions('comms.digest'),
      getQueueRegistrationOptions('comms.cleanup'),
    ),
    NotificationModule,
    UserModule,
    DatabaseModule,
  ],
  providers: [
    EmailWorker,
    SmsWorker,
    PushWorker,
    DigestWorker,
    CleanupWorker,
    DeadLetterQueueService,
  ],
})
export class WorkersModule {}

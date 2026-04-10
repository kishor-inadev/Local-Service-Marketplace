import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { EmailWorker } from './email.worker';
import { SmsWorker } from './sms.worker';
import { PushWorker } from './push.worker';
import { DigestWorker } from './digest.worker';
import { CleanupWorker } from './cleanup.worker';
import { NotificationModule } from '../notification/notification.module';

/**
 * WorkersModule — only imported when WORKERS_ENABLED=true.
 *
 * Registers all BullMQ worker processors.  Workers also register their
 * repeatable jobs on startup via OnModuleInit.
 *
 * In production deploy two container types:
 *   - web pod:    WORKERS_ENABLED=false  (no workers, smaller footprint)
 *   - worker pod: WORKERS_ENABLED=true   (workers only, no HTTP traffic)
 */
@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'comms.email' },
      { name: 'comms.sms' },
      { name: 'comms.push' },
      { name: 'comms.digest' },
      { name: 'comms.cleanup' },
    ),
    NotificationModule,
  ],
  providers: [
    EmailWorker,
    SmsWorker,
    PushWorker,
    DigestWorker,
    CleanupWorker,
  ],
})
export class WorkersModule {}

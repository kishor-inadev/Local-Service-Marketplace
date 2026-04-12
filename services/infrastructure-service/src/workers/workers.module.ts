import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { BackgroundJobWorker } from './background-job.worker';
import { InfraCleanupWorker } from './cleanup.worker';
import { BackgroundJobRepository } from '../infrastructure/repositories/background-job.repository';
import { EventRepository } from '../infrastructure/repositories/event.repository';
import { DatabaseModule } from '../common/database/database.module';
import { getQueueRegistrationOptions } from '../config/queue-config';

/**
 * Infrastructure Workers Module
 * 
 * Queue Configuration:
 *   - infra.background-jobs: 60s timeout, NORMAL priority, 2 attempts
 *   - infra.cleanup:         120s timeout, LOW priority,   2 attempts
 */
@Module({
  imports: [
    BullModule.registerQueue(
      getQueueRegistrationOptions('infra.background-jobs'),
      getQueueRegistrationOptions('infra.cleanup'),
    ),
    DatabaseModule,
    HttpModule.register({ timeout: 30000 }),
    ConfigModule,
  ],
  providers: [
    BackgroundJobWorker,
    InfraCleanupWorker,
    BackgroundJobRepository,
    EventRepository,
  ],
})
export class WorkersModule {}

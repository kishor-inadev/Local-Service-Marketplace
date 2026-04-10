import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BackgroundJobWorker } from './background-job.worker';
import { InfraCleanupWorker } from './cleanup.worker';
import { BackgroundJobRepository } from '../infrastructure/repositories/background-job.repository';
import { EventRepository } from '../infrastructure/repositories/event.repository';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'infra.background-jobs' },
      { name: 'infra.cleanup' },
    ),
  ],
  providers: [
    BackgroundJobWorker,
    InfraCleanupWorker,
    BackgroundJobRepository,
    EventRepository,
  ],
})
export class WorkersModule {}

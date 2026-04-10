import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { DEFAULT_JOB_OPTIONS } from '../bullmq/bullmq-default-options';

/**
 * Registers every queue used by comms-service as a producer.
 * Import this module wherever you need @InjectQueue().
 *
 * Workers (consumers) live in WorkersModule and are only loaded
 * when WORKERS_ENABLED=true.
 */
@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'comms.email',   defaultJobOptions: DEFAULT_JOB_OPTIONS },
      { name: 'comms.sms',     defaultJobOptions: DEFAULT_JOB_OPTIONS },
      { name: 'comms.push',    defaultJobOptions: DEFAULT_JOB_OPTIONS },
      { name: 'comms.digest',  defaultJobOptions: DEFAULT_JOB_OPTIONS },
      { name: 'comms.cleanup', defaultJobOptions: DEFAULT_JOB_OPTIONS },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}

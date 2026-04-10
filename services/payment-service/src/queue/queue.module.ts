import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { DEFAULT_JOB_OPTIONS } from '../bullmq/bullmq-default-options';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'payment.retry',         defaultJobOptions: DEFAULT_JOB_OPTIONS },
      { name: 'payment.refund',         defaultJobOptions: DEFAULT_JOB_OPTIONS },
      { name: 'payment.webhook',        defaultJobOptions: DEFAULT_JOB_OPTIONS },
      { name: 'payment.notification',   defaultJobOptions: DEFAULT_JOB_OPTIONS },
      { name: 'payment.subscription',   defaultJobOptions: DEFAULT_JOB_OPTIONS },
      { name: 'payment.method-expiry',  defaultJobOptions: DEFAULT_JOB_OPTIONS },
      { name: 'payment.analytics',      defaultJobOptions: DEFAULT_JOB_OPTIONS },
      { name: 'payment.cleanup',        defaultJobOptions: DEFAULT_JOB_OPTIONS },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}

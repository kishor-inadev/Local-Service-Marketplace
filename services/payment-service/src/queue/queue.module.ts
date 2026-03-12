import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PaymentQueueProcessor } from './processors/payment-queue.processor';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'redis',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
    }),
    BullModule.registerQueue(
      {
        name: 'payment-queue',
      },
      {
        name: 'refund-queue',
      },
    ),
    PaymentModule,
  ],
  providers: [PaymentQueueProcessor],
  exports: [BullModule],
})
export class QueueModule {}

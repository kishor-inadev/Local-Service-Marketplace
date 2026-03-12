import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from './common/logger/logger.module';
import { DatabaseModule } from './common/database/database.module';
import { QueueModule } from './queue/queue.module';
import { KafkaModule } from './kafka/kafka.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    DatabaseModule,
    QueueModule,
    KafkaModule,
    PaymentModule,
  ],
})
export class AppModule {}

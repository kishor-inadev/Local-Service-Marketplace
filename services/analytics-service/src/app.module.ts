import { Module } from '@nestjs/common';
import { LoggerModule } from './common/logger/logger.module';
import { DatabaseModule } from './common/database/database.module';
import { KafkaModule } from './kafka/kafka.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [LoggerModule, DatabaseModule, KafkaModule, AnalyticsModule],
})
export class AppModule {}

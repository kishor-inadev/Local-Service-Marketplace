import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RequestModule } from './modules/request/request.module';
import { DatabaseModule } from './common/database/database.module';
import { LoggerModule } from './common/logger/logger.module';
import { KafkaModule } from './kafka/kafka.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    LoggerModule,
    DatabaseModule,
    RedisModule,
    KafkaModule,
    RequestModule,
  ],
})
export class AppModule {}

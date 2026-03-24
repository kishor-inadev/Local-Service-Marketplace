import { Module } from '@nestjs/common';
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from './common/logger/logger.module';
import { DatabaseModule } from './common/database/database.module';
import { RedisModule } from './redis/redis.module';
import { KafkaModule } from './kafka/kafka.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { HealthController } from './common/health/health.controller';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true, envFilePath: ".env" }),
		LoggerModule,
		DatabaseModule,
		RedisModule,
		KafkaModule,
		InfrastructureModule,
	],
	controllers: [HealthController],
})
export class AppModule {}

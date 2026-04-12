import { Module } from '@nestjs/common';
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from './common/logger/logger.module';
import { DatabaseModule } from './common/database/database.module';
import { RedisModule } from './redis/redis.module';
import { KafkaModule } from './kafka/kafka.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { DlqModule } from './dlq/dlq.module';
import { HealthController } from './common/health/health.controller';
import { BullMQCoreModule } from './bullmq/bullmq.module';
import { WorkersModule } from './workers/workers.module';

const conditionalModules = process.env.WORKERS_ENABLED === 'true' ? [WorkersModule] : [];

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true, envFilePath: ".env" }),
		LoggerModule,
		DatabaseModule,
		BullMQCoreModule,
		RedisModule,
		KafkaModule.register(),
		InfrastructureModule,
		DlqModule,
		...conditionalModules,
	],
	controllers: [HealthController],
})
export class AppModule {}

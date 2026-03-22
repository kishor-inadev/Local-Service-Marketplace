import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AdminModule } from "./admin/admin.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { DatabaseModule } from "./common/database/database.module";
import { LoggerModule } from "./common/logger/logger.module";
import { KafkaModule } from "./kafka/kafka.module";
import { HealthController } from "./common/health/health.controller";

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true, envFilePath: ".env" }),
		LoggerModule,
		DatabaseModule,
		KafkaModule,
		AdminModule,
		AnalyticsModule,
	],
	controllers: [HealthController],
})
export class AppModule {}

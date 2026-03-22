import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./modules/auth/auth.module";
import { UserModule } from "./modules/user/user.module";
import { DatabaseModule } from "./common/database/database.module";
import { LoggerModule } from "./common/logger/logger.module";
import { RedisModule } from "./redis/redis.module";
import { NotificationModule } from "./common/notification/notification.module";
import { HealthController } from "./common/health/health.controller";

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true, envFilePath: ".env" }),
		LoggerModule,
		DatabaseModule,
		RedisModule,
		NotificationModule,
		AuthModule,
		UserModule,
	],
	controllers: [HealthController],
})
export class AppModule {}

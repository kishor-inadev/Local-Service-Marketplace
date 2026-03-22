import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { WinstonModule } from "nest-winston";
import { winstonConfig } from "./common/config/winston.config";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ResponseTransformInterceptor } from "./common/interceptors/response-transform.interceptor";

async function bootstrap() {
	const app = await NestFactory.create(AppModule, { logger: WinstonModule.createLogger(winstonConfig) });

	const configService = app.get(ConfigService);
	const port = configService.get<number>("PORT", 3010);
	const serviceName = configService.get<string>("SERVICE_NAME", "oversight-service");

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
			transformOptions: { enableImplicitConversion: true },
		}),
	);

	app.useGlobalInterceptors(new ResponseTransformInterceptor());

	const logger = app.get("winston");
	app.useGlobalFilters(new HttpExceptionFilter(logger));

	await app.listen(port);
	console.log(`🚀 ${serviceName} running on port ${port}`);
}

bootstrap();

import 'dotenv/config';
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { WinstonModule } from "nest-winston";
import { winstonConfig } from "./common/config/winston.config";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ResponseTransformInterceptor } from "./common/interceptors/response-transform.interceptor";
import helmet from "helmet";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });

  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((o) => o.trim())
    : [];
  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    credentials: true,
  });

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT", 3001);
  const serviceName = configService.get<string>(
    "SERVICE_NAME",
    "identity-service",
  );

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

  // Graceful shutdown — drain in-flight requests before exit
  app.enableShutdownHooks();
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down ${serviceName} gracefully`);
    await app.close();
    process.exit(0);
  };
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));

  // Catch unhandled errors to prevent silent crashes
  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled Rejection", { reason });
  });
  process.on("uncaughtException", (err: any) => {
    logger.error("Uncaught Exception", {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  });

  const server = await app.listen(port);
  server.timeout = 120000;
  server.keepAliveTimeout = 125000;
  server.headersTimeout = 130000;
  logger.info(`${serviceName} running on port ${port}`);
}

bootstrap();

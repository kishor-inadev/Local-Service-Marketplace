import 'dotenv/config';
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ResponseTransformInterceptor } from "./common/interceptors/response-transform.interceptor";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import helmet from "helmet";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // rawBody:true enables req.rawBody (Buffer) needed for webhook signature verification
    rawBody: true,
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

  // Reject oversized request bodies early (before body parsing)
  // This limits DoS risk from large JSON payloads; Express default is 100kb
  app.use((req: any, res: any, next: any) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > 5 * 1024 * 1024) {
      return res.status(413).json({ statusCode: 413, message: 'Payload too large' });
    }
    next();
  });

  // Use Winston logger
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // CORS is handled by API Gateway - not needed in internal services

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global response transform interceptor
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  // Global exception filter with logger from DI container
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  // Graceful shutdown — drain in-flight requests before exit
  app.enableShutdownHooks();
  const shutdown = async (signal: string) => {
    logger.log(`${signal} received — shutting down payment-service gracefully`);
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

  const port = process.env.PORT || 3006;
  const server = await app.listen(port);
  server.timeout = 120000;
  server.keepAliveTimeout = 125000;
  server.headersTimeout = 130000;

  logger.log(`Payment Service is running on port ${port}`);
}

bootstrap();

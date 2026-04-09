import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Winston logger
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  // Global response transform interceptor
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  // Global exception filter with logger
  const winstonLogger = app.get('winston');
  app.useGlobalFilters(new HttpExceptionFilter(winstonLogger));

  // CORS is handled by API Gateway - not needed in internal services

  // Graceful shutdown — drain in-flight requests before exit
  app.enableShutdownHooks();
  const shutdown = async (signal: string) => {
    logger.log(`${signal} received — shutting down infrastructure-service gracefully`);
    await app.close();
    process.exit(0);
  };
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));

  // Catch unhandled errors to prevent silent crashes
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection', { reason });
  });
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
    process.exit(1);
  });

  const port = process.env.PORT || 3012;
  const server = await app.listen(port);

  // Increase server timeouts for Render.com (1.2m request timeout + buffer)
  server.timeout = 120000;
  server.keepAliveTimeout = 125000;
  server.headersTimeout = 130000;

  logger.log(`Infrastructure Service is running on port ${port}`);
}

bootstrap();

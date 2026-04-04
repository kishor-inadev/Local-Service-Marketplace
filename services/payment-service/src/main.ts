import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
		// rawBody:true enables req.rawBody (Buffer) needed for webhook signature verification
		rawBody: true,
	});

  app.use(helmet());

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
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));

  const port = process.env.PORT || 3006;
  await app.listen(port);

  logger.log(`Payment Service is running on port ${port}`);
}

bootstrap();

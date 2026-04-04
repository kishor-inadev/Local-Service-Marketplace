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
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Global response transform interceptor
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  // Global exception filter with logger
  const logger = app.get('winston');
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  // CORS is handled by API Gateway - not needed in internal services

  // Graceful shutdown — drain in-flight requests before exit
  app.enableShutdownHooks();
  const shutdown = async (signal: string) => {
    console.log(`${signal} received — shutting down infrastructure-service gracefully`);
    await app.close();
    process.exit(0);
  };
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));

  const port = process.env.PORT || 3012;
  await app.listen(port);

  console.log(`Infrastructure Service is running on port ${port}`);
}

bootstrap();

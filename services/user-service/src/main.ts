import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/config/winston.config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3002);
  const serviceName = configService.get<string>('SERVICE_NAME', 'user-service');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter with logger from DI container
  const logger = app.get('winston');
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  // Enable CORS
  app.enableCors();

  await app.listen(port);
  console.log(`🚀 ${serviceName} running on port ${port}`);
}

bootstrap();

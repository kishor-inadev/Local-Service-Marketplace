import { NestFactory } from "@nestjs/core";
import { ValidationPipe, RequestMethod } from "@nestjs/common";
import { AppModule } from "./app.module";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ResponseTransformInterceptor } from "./common/interceptors/response-transform.interceptor";
import { MetricsInterceptor } from "./common/interceptors/metrics.interceptor";
import helmet from "helmet";
import { json, urlencoded } from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Request body size limits
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  // Security headers
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

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

  // Global response transform interceptor (wraps all responses)
  app.useGlobalInterceptors(
    new MetricsInterceptor(),
    new ResponseTransformInterceptor(),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // CORS - Allow frontend access
  const allowedOrigins = [
    // Production domains
    "https://lsp.easydev.in",
    "https://easydev.in",
    "https://www.easydev.in",
    "https://www.lsp.easydev.in",
    // Staging / preview
    "https://staging.lsp.easydev.in",
    // Local development (only in non-production environments)
    ...(process.env.NODE_ENV !== "production"
      ? ["http://localhost:3000", "http://127.0.0.1:3000"]
      : []),
    // Env-based overrides
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGIN,
    // Support comma-separated list via CORS_ORIGINS
    ...(process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
      : []),
  ].filter((origin): origin is string => !!origin && origin.length > 0);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server, curl, health checks)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true, // Allow cookies
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Access-Control-Request-Method",
      "Access-Control-Request-Headers",
    ],
    exposedHeaders: ["Set-Cookie", "Authorization"], // Expose headers to frontend
    maxAge: 3600, // Cache preflight requests for 1 hour
  });

  // Note: API versioning prefix is set at controller level (@Controller('api/v1'))
  // Health endpoints remain at root level for monitoring tools

  // Enable graceful shutdown hooks before listening
  app.enableShutdownHooks();

  const port = process.env.PORT || 3700;
  const server = await app.listen(port);

  // Increase server timeouts for Render.com (1.2m request timeout + buffer)
  server.timeout = 120000;
  server.keepAliveTimeout = 125000;
  server.headersTimeout = 130000;

  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  const shutdown = async (signal: string) => {
    logger.log(`${signal} received — shutting down API Gateway gracefully`);
    await app.close();
    process.exit(0);
  };
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));

  // Catch unhandled errors to prevent silent crashes
  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled Rejection — initiating graceful shutdown", { reason });
    shutdown("unhandledRejection").catch(() => process.exit(1));
  });
  process.on("uncaughtException", (error: any) => {
    logger.error("Uncaught Exception", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  });

  logger.log(`API Gateway is running on port ${port}`);
  logger.log(`Environment: ${process.env.NODE_ENV || "development"}`);
}

bootstrap();

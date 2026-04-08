import {
  Injectable,
  NestMiddleware,
  Inject,
  LoggerService,
} from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const method = req.method;
    const path = req.originalUrl;
    const ip = req.ip;
    const userAgent = req.get("user-agent") || "";
    const userId = (req as any).user?.userId || "anonymous";

    const startTime = Date.now();

    // Log request
    this.logger.log(
      `Incoming ${method} ${path} from ${userId} (${ip})`,
      "LoggingMiddleware",
    );

    // Hook into response finish event
    res.on("finish", () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;

      const logMessage = `${method} ${path} ${statusCode} - ${duration}ms - User: ${userId} - IP: ${ip}`;

      if (statusCode >= 500) {
        this.logger.error(logMessage, "", "LoggingMiddleware");
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage, "LoggingMiddleware");
      } else {
        this.logger.log(logMessage, "LoggingMiddleware");
      }
    });

    next();
  }
}

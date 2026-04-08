import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

export interface StandardErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error: { code: string; message: string; details: any[] };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let details: any[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === "object") {
        const res = exceptionResponse as any;
        message = Array.isArray(res.message)
          ? res.message[0]
          : res.message || exception.message;
        if (Array.isArray(res.message)) {
          details = res.message;
        } else if (res.details) {
          details = Array.isArray(res.details) ? res.details : [res.details];
        }
      }
    } else if (exception instanceof Error) {
      const pgCode = (exception as any).code as string | undefined;
      if (pgCode === "23505") {
        status = HttpStatus.CONFLICT;
        message = "Resource already exists";
      } else if (
        pgCode === "23503" ||
        pgCode === "23502" ||
        pgCode === "23514"
      ) {
        status = HttpStatus.BAD_REQUEST;
        message = "Invalid request data";
      } else if (pgCode === "22P02") {
        status = HttpStatus.BAD_REQUEST;
        message = "Invalid input format";
      } else {
        message =
          process.env.NODE_ENV === "development"
            ? exception.message
            : "Internal server error";
      }
      if (process.env.NODE_ENV === "development") {
        details = [
          { name: exception.name, code: pgCode, stack: exception.stack },
        ];
      }
    }

    // Log error
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : "",
    );

    // Build standardized error response
    const errorResponse: StandardErrorResponse = {
      success: false,
      statusCode: status,
      message,
      error: { code: this.getErrorCode(status), message, details },
    };

    response.status(status).json(errorResponse);
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return "BAD_REQUEST";
      case HttpStatus.UNAUTHORIZED:
        return "UNAUTHORIZED";
      case HttpStatus.FORBIDDEN:
        return "FORBIDDEN";
      case HttpStatus.NOT_FOUND:
        return "NOT_FOUND";
      case HttpStatus.CONFLICT:
        return "CONFLICT";
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return "VALIDATION_ERROR";
      case HttpStatus.TOO_MANY_REQUESTS:
        return "RATE_LIMIT_EXCEEDED";
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return "INTERNAL_ERROR";
      case HttpStatus.SERVICE_UNAVAILABLE:
        return "SERVICE_UNAVAILABLE";
      default:
        return "UNKNOWN_ERROR";
    }
  }
}

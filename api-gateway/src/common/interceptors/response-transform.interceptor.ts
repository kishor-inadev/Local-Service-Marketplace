import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Request, Response } from "express";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StandardResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta: PaginationMeta | null;
}

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<
  T,
  StandardResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        const statusCode = response.statusCode;
        const method = request.method;
        const path = request.path;

        // If response is already in standardized format, return as is
        if (
          data &&
          typeof data === "object" &&
          "success" in data &&
          "statusCode" in data &&
          "meta" in data
        ) {
          return data as StandardResponse<T>;
        }

        // If controller returned { success, data?, message?, statusCode?, meta? } partial format, unwrap it
        if (
          data &&
          typeof data === "object" &&
          "success" in data &&
          typeof (data as any).success === "boolean"
        ) {
          const partial = data as any;
          return {
            success: partial.success,
            statusCode: partial.statusCode || statusCode,
            message:
              typeof partial.message === "string"
                ? partial.message
                : this.generateMessage(method, statusCode, path),
            data: partial.data ?? null,
            meta: partial.meta ?? null,
          } as StandardResponse<T>;
        }

        // Extract custom message if provided by controller
        let customMessage: string | undefined;
        let rawData: any = data;
        if (
          rawData &&
          typeof rawData === "object" &&
          typeof rawData.message === "string"
        ) {
          customMessage = rawData.message;
          const { message: _msg, ...rest } = rawData;
          rawData = rest;
        }

        // Extract data and metadata
        let responseData: any = rawData;
        let meta: PaginationMeta | null = null;

        // Handle paginated responses
        if (rawData && typeof rawData === "object") {
          const query = request.query || {};
          const page = parseInt(query.page as string) || 1;
          const limit = parseInt(query.limit as string) || 20;

          if ("data" in rawData && "total" in rawData) {
            // Offset-based pagination: { data, total, page?, limit? }
            responseData = (rawData as any).data;
            const total = (rawData as any).total as number;
            const currentPage = (rawData as any).page
              ? parseInt((rawData as any).page)
              : page;
            const currentLimit = (rawData as any).limit
              ? parseInt((rawData as any).limit)
              : limit;
            meta = {
              page: currentPage,
              limit: currentLimit,
              total,
              totalPages: Math.ceil(total / currentLimit),
            };
          } else if ("items" in rawData && "total" in rawData) {
            // Alternative pagination format: { items, total }
            responseData = (rawData as any).items;
            const total = (rawData as any).total as number;
            const currentPage = (rawData as any).page
              ? parseInt((rawData as any).page)
              : page;
            const currentLimit = (rawData as any).limit
              ? parseInt((rawData as any).limit)
              : limit;
            meta = {
              page: currentPage,
              limit: currentLimit,
              total,
              totalPages: Math.ceil(total / currentLimit),
            };
          } else if ("data" in rawData && "nextCursor" in rawData) {
            // Cursor-based pagination — no numeric meta
            responseData = (rawData as any).data;
          }
        }

        return {
          success: statusCode >= 200 && statusCode < 300,
          statusCode,
          message:
            customMessage ?? this.generateMessage(method, statusCode, path),
          data: responseData ?? null,
          meta,
        } as StandardResponse<T>;
      }),
    );
  }

  private generateMessage(
    method: string,
    statusCode: number,
    path: string,
  ): string {
    // Extract resource name from path
    const pathParts = path.split("/").filter(Boolean);
    const resource = pathParts[pathParts.length - 1] || "resource";

    switch (method) {
      case "POST":
        if (statusCode === HttpStatus.CREATED) {
          return `${this.capitalize(resource)} created successfully`;
        }
        return `${this.capitalize(resource)} processed successfully`;

      case "GET":
        if (Array.isArray(path.match(/\/\w+$/))) {
          return `${this.capitalize(resource)} retrieved successfully`;
        }
        return `${this.capitalize(resource)} retrieved successfully`;

      case "PATCH":
      case "PUT":
        return `${this.capitalize(resource)} updated successfully`;

      case "DELETE":
        return `${this.capitalize(resource)} deleted successfully`;

      default:
        return "Request processed successfully";
    }
  }

  private capitalize(str: string): string {
    // Handle UUIDs and special cases
    if (str.match(/^[a-f0-9-]{36}$/i)) {
      return "Resource";
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

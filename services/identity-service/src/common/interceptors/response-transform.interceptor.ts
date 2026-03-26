import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, StandardResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    return next.handle().pipe(
      map((data) => {
        const statusCode = response.statusCode || HttpStatus.OK;
        const method = request.method;

        // If response is already in standardized format, return as is
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          'statusCode' in data &&
          'meta' in data
        ) {
          return data as StandardResponse<T>;
        }

        // Extract data and metadata
        let responseData: any = data;
        let meta: PaginationMeta | null = null;

        // Handle paginated responses
        if (data && typeof data === 'object') {
          const query = request.query || {};
          const page = parseInt(query.page as string) || 1;
          const limit = parseInt(query.limit as string) || 20;

          if ('data' in data && 'total' in data) {
            // Offset-based pagination: { data, total, page?, limit? }
            responseData = (data as any).data;
            const total = (data as any).total as number;
            const currentPage = (data as any).page ? parseInt((data as any).page) : page;
            const currentLimit = (data as any).limit ? parseInt((data as any).limit) : limit;
            meta = {
              page: currentPage,
              limit: currentLimit,
              total,
              totalPages: Math.ceil(total / currentLimit),
            };
          } else if ('items' in data && 'total' in data) {
            // Alternative pagination: { items, total }
            responseData = (data as any).items;
            const total = (data as any).total as number;
            const currentPage = (data as any).page ? parseInt((data as any).page) : page;
            const currentLimit = (data as any).limit ? parseInt((data as any).limit) : limit;
            meta = {
              page: currentPage,
              limit: currentLimit,
              total,
              totalPages: Math.ceil(total / currentLimit),
            };
          } else if ('data' in data && 'nextCursor' in data) {
            // Cursor-based pagination — no numeric meta
            responseData = (data as any).data;
          }
        }

        return {
          success: statusCode >= 200 && statusCode < 300,
          statusCode,
          message: this.generateMessage(method, statusCode),
          data: responseData,
          meta,
        } as StandardResponse<T>;
      }),
    );
  }

  private generateMessage(method: string, statusCode: number): string {
    if (statusCode === HttpStatus.CREATED) {
      return 'Resource created successfully';
    }
    if (statusCode === HttpStatus.NO_CONTENT) {
      return 'Resource deleted successfully';
    }

    switch (method) {
      case 'GET':
        return 'Resource retrieved successfully';
      case 'POST':
        return 'Resource created successfully';
      case 'PATCH':
      case 'PUT':
        return 'Resource updated successfully';
      case 'DELETE':
        return 'Resource deleted successfully';
      default:
        return 'Request processed successfully';
    }
  }
}

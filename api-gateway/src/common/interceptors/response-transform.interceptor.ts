import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';

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
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        const statusCode = response.statusCode;
        const method = request.method;
        const path = request.path;

        // Determine if response is already wrapped
        if (data && typeof data === "object" && "success" in data && "statusCode" in data && "meta" in data) {
					return data as StandardResponse<T>;
				}

        // Extract data and metadata
        let responseData: any = data;
				let meta: PaginationMeta | null = null;
				const message = this.generateMessage(method, statusCode, path);

        // Handle paginated responses
        if (data && typeof data === 'object') {
          const query = request.query || {};
					const page = parseInt(query.page as string) || 1;
					const limit = parseInt(query.limit as string) || 20;

					if ("data" in data && "total" in data) {
						// Offset-based pagination: { data, total, page?, limit? }
						responseData = (data as any).data;
						const total = (data as any).total as number;
						const currentPage = (data as any).page ? parseInt((data as any).page) : page;
						const currentLimit = (data as any).limit ? parseInt((data as any).limit) : limit;
						meta = { page: currentPage, limit: currentLimit, total, totalPages: Math.ceil(total / currentLimit) };
					} else if ("items" in data && "total" in data) {
						// Alternative pagination format: { items, total }
						responseData = (data as any).items;
						const total = (data as any).total as number;
						const currentPage = (data as any).page ? parseInt((data as any).page) : page;
						const currentLimit = (data as any).limit ? parseInt((data as any).limit) : limit;
						meta = { page: currentPage, limit: currentLimit, total, totalPages: Math.ceil(total / currentLimit) };
					} else if ("data" in data && "nextCursor" in data) {
						// Cursor-based pagination — no numeric meta
						responseData = (data as any).data;
					}
        }

        return {
					success: statusCode >= 200 && statusCode < 300,
					statusCode,
					message,
					data: responseData,
					meta,
				} as StandardResponse<T>;
      }),
    );
  }

  private generateMessage(method: string, statusCode: number, path: string): string {
    // Extract resource name from path
    const pathParts = path.split('/').filter(Boolean);
    const resource = pathParts[pathParts.length - 1] || 'resource';

    switch (method) {
      case 'POST':
        if (statusCode === HttpStatus.CREATED) {
          return `${this.capitalize(resource)} created successfully`;
        }
        return `${this.capitalize(resource)} processed successfully`;
      
      case 'GET':
        if (Array.isArray(path.match(/\/\w+$/))) {
          return `${this.capitalize(resource)} retrieved successfully`;
        }
        return `${this.capitalize(resource)} retrieved successfully`;
      
      case 'PATCH':
      case 'PUT':
        return `${this.capitalize(resource)} updated successfully`;
      
      case 'DELETE':
        return `${this.capitalize(resource)} deleted successfully`;
      
      default:
        return 'Request processed successfully';
    }
  }

  private capitalize(str: string): string {
    // Handle UUIDs and special cases
    if (str.match(/^[a-f0-9-]{36}$/i)) {
      return 'Resource';
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

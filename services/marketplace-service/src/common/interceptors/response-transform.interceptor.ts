import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  total?: number;
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
          'statusCode' in data
        ) {
          return data as StandardResponse<T>;
        }

        // Extract data and metadata
        let responseData = data;
        let total: number | undefined;

        // Handle paginated responses
        if (data && typeof data === 'object') {
          if ('data' in data && 'nextCursor' in data) {
            // Cursor-based pagination
            responseData = data.data;
            total = data.data?.length;
          } else if ('data' in data && 'total' in data) {
            // Offset-based pagination
            responseData = data.data;
            total = data.total;
          } else if ('items' in data && 'total' in data) {
            // Alternative pagination format
            responseData = data.items;
            total = data.total;
          } else if (Array.isArray(data)) {
            // Plain array response
            total = data.length;
          }
        }

        // Build standardized response
        const standardResponse: StandardResponse<T> = {
          success: true,
          statusCode,
          message: this.generateMessage(method, statusCode),
          data: responseData,
        };

        // Add total only for arrays/paginated responses
        if (total !== undefined && (Array.isArray(responseData) || total > 0)) {
          standardResponse.total = total;
        }

        return standardResponse;
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

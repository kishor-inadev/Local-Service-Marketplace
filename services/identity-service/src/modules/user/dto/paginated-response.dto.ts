export class PaginatedResponseDto<T> {
  data: T[];
  pagination: {
    limit: number;
    nextCursor?: string;
    hasMore: boolean;
  };
}

import { Job } from "../entities/job.entity";

export class JobResponseDto {
  id: string;
  request_id: string;
  provider_id: string;
  customer_id: string;
  status: string;
  started_at: Date;
  completed_at: Date;

  static fromEntity(job: Job): JobResponseDto {
    return {
      id: job.id,
      request_id: job.request_id,
      provider_id: job.provider_id,
      customer_id: job.customer_id,
      status: job.status,
      started_at: job.started_at,
      completed_at: job.completed_at,
    };
  }
}

export class PaginatedJobResponseDto {
  data: JobResponseDto[];
  total?: number;
  page?: number;
  limit?: number;
  nextCursor?: string;
  hasMore?: boolean;

  constructor(
    data: JobResponseDto[],
    nextCursor?: string,
    hasMore = false,
    total?: number,
    page?: number,
    limit?: number,
  ) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.nextCursor = nextCursor;
    this.hasMore = hasMore;
  }
}

import { ServiceRequest } from '../entities/service-request.entity';

export class LocationResponseDto {
  id: string;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
}

export class RequestResponseDto {
  id: string;
  user_id: string;
  category_id: string;
  location?: LocationResponseDto;
  description: string;
  budget: number;
  status: string;
  created_at: Date;

  static fromEntity(request: ServiceRequest): RequestResponseDto {
    return {
      id: request.id,
      user_id: request.user_id,
      category_id: request.category_id,
      location: request.location ? {
        id: request.location.id,
        latitude: request.location.latitude,
        longitude: request.location.longitude,
        address: request.location.address,
        city: request.location.city,
        state: request.location.state,
        zip_code: request.location.zip_code,
        country: request.location.country,
      } : undefined,
      description: request.description,
      budget: request.budget,
      status: request.status,
      created_at: request.created_at,
    };
  }
}

export class PaginatedRequestResponseDto {
	data: RequestResponseDto[];
	total?: number;
	nextCursor?: string;
	hasMore?: boolean;

	constructor(data: RequestResponseDto[], nextCursor?: string, hasMore = false, total?: number) {
		this.data = data;
		this.total = total;
		this.nextCursor = nextCursor;
		this.hasMore = hasMore;
	}
}

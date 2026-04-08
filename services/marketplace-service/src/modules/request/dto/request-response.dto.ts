import { ServiceRequest } from "../entities/service-request.entity";

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
  user_id?: string | null;
  category_id: string;
  location?: LocationResponseDto;
  description: string;
  budget: number;
  images?: string[];
  preferred_date?: Date;
  urgency?: string;
  expiry_date?: Date;
  view_count?: number;
  status: string;
  guest_name?: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;
  created_at: Date;
  updated_at?: Date;

  static fromEntity(request: ServiceRequest): RequestResponseDto {
    return {
      id: request.id,
      user_id: request.user_id,
      category_id: request.category_id,
      location: request.location
        ? {
            id: request.location.id,
            latitude: request.location.latitude,
            longitude: request.location.longitude,
            address: request.location.address,
            city: request.location.city,
            state: request.location.state,
            zip_code: request.location.zip_code,
            country: request.location.country,
          }
        : undefined,
      description: request.description,
      budget: request.budget,
      images: request.images,
      preferred_date: request.preferred_date,
      urgency: request.urgency,
      expiry_date: request.expiry_date,
      view_count: request.view_count,
      status: request.status,
      guest_name: request.guest_name,
      guest_email: request.guest_email,
      guest_phone: request.guest_phone,
      created_at: request.created_at,
      updated_at: request.updated_at,
    };
  }
}

export class PaginatedRequestResponseDto {
  data: RequestResponseDto[];
  total?: number;
  page?: number;
  limit?: number;
  nextCursor?: string;
  hasMore?: boolean;

  constructor(
    data: RequestResponseDto[],
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

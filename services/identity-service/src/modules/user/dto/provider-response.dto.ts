export class ProviderResponseDto {
  id: string;
  user_id: string;
  business_name: string;
  description?: string;
  rating?: number;
  services?: Array<{ id: string; category_id: string }>;
  availability?: Array<{
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>;
  created_at: Date;
}

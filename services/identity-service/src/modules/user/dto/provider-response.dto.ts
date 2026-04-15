export class ProviderResponseDto {
  id: string;
  display_id?: string;
  user_id: string;
  business_name: string;
  description?: string;
  verification_status?: string;
  aadhar_verified?: boolean;
  profile_picture_url?: string;
  rating?: number;
  total_jobs_completed?: number;
  years_of_experience?: number;
  service_area_radius?: number;
  response_time_avg?: number;
  certifications?: string[];
  services?: Array<{ id: string; category_id: string }>;
  availability?: Array<{
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>;
  created_at: Date;
}

export class Provider {
  id: string;
  display_id: string;
  user_id: string;
  business_name: string;
  description?: string;
  profile_picture_url?: string; // ✅ NEW
  rating?: number;
  total_jobs_completed: number; // ✅ NEW
  years_of_experience?: number; // ✅ NEW
  service_area_radius?: number; // ✅ NEW
  response_time_avg?: number; // ✅ NEW
  verification_status: string; // ✅ NEW ('pending', 'verified', 'rejected')
  certifications?: any; // ✅ NEW (JSONB)
  // India-specific fields (migration 026)
  gstin?: string;   // GSTIN 15-char tax ID
  pan?: string;     // PAN 10-char tax ID
  aadhar_verified?: boolean; // KYC verification flag
  created_at: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

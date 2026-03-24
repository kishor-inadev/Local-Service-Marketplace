export class Provider {
	id: string;
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
	created_at: Date;
	updated_at?: Date;
	deleted_at?: Date;
}

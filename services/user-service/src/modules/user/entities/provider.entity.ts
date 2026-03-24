export class Provider {
	id: string;
	user_id: string;
	business_name: string;
	description?: string;
	profile_picture_url?: string;
	rating?: number;
	total_jobs_completed: number;
	years_of_experience?: number;
	service_area_radius?: number;
	response_time_avg?: number;
	verification_status: string; // 'pending' | 'verified' | 'rejected'
	certifications?: any; // JSONB
	created_at: Date;
	updated_at?: Date;
	deleted_at?: Date;
}

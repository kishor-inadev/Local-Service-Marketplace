export class LoginHistory {
	id: string;
	user_id?: string; // Nullable for anonymous login attempts
	ip_address?: string;
	user_agent?: string;
	location?: string;
	device_type?: string;
	success: boolean;
	failure_reason?: string;
	created_at: Date;
}

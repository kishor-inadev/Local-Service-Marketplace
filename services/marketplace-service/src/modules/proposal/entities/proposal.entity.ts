export class Proposal {
	id: string;
	request_id: string;
	provider_id: string;
	customer_id?: string; // joined from service_requests
	price: number;
	message?: string;
	estimated_hours?: number; // ✅ NEW
	start_date?: Date; // ✅ NEW
	completion_date?: Date; // ✅ NEW
	rejected_reason?: string; // ✅ NEW
	status: string;
	created_at: Date;
	updated_at?: Date; // ✅ NEW
}

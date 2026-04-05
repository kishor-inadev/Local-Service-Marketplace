export class Job {
	id: string;
	request_id: string;
	provider_id: string;
	customer_id: string; // ✅ NEW
	proposal_id?: string; // ✅ NEW
	actual_amount?: number; // ✅ NEW
	cancelled_by?: string; // ✅ NEW
	cancellation_reason?: string; // ✅ NEW
	status: string;
	started_at?: Date;
	completed_at?: Date;
	created_at: Date; // ✅ NEW
	updated_at?: Date; // ✅ NEW
}

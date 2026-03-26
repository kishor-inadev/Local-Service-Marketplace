export class AccountDeletionRequest {
	id: string;
	user_id: string;
	reason?: string;
	requested_at: Date;
	completed_at?: Date;
	cancelled_at?: Date;
	cancellation_reason?: string;
}

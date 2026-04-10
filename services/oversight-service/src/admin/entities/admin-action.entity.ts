export class AdminAction {
	id: string;
	display_id: string;
	admin_id: string;
	action: string;
	target_type: string;
	target_id: string;
	reason?: string;
	created_at: Date;
}

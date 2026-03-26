export class MagicLinkToken {
	id: string;
	user_id?: string; // Nullable for guest passwordless login
	email: string;
	token: string;
	expires_at: Date;
	used_at?: Date;
	created_at: Date;
}

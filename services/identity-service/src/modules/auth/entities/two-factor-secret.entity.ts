export class TwoFactorSecret {
	id: string;
	user_id: string;
	secret: string;
	backup_codes: string[]; // Array of unused backup codes
	enabled: boolean;
	created_at: Date;
	updated_at?: Date;
}

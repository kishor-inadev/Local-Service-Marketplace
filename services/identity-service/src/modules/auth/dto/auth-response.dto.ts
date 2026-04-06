export class AuthResponseDto {
	message?: string;
	accessToken: string;
	refreshToken: string;
	user: {
		id: string;
		email: string;
		display_id?: string;
		name?: string;
		role: string;
		email_verified: boolean;
		phone_verified: boolean; // ✅ NEW
		profile_picture_url?: string; // ✅ NEW
		timezone: string; // ✅ NEW
		language: string; // ✅ NEW
		last_login_at?: Date; // ✅ NEW
	};
}

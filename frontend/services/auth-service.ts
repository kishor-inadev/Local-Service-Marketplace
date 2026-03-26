import { apiClient } from './api-client';
import { signIn as nextAuthSignIn } from 'next-auth/react';

export interface SignupData {
	email: string;
	password: string;
	name?: string;
	role: 'customer' | 'provider' | 'admin';
	phone?: string;
	timezone?: string;
	language?: string;
}

export interface LoginData {
	email: string;
	password: string;
}

export interface AuthResponse {
	accessToken: string;
	refreshToken: string;
	user: {
		id: string;
		email: string;
		name?: string;
		role: string;
		email_verified: boolean;
		profile_picture_url?: string;
		timezone?: string;
		language?: string;
		phone_verified?: boolean;
		last_login_at?: string;
	};
}

export interface CheckIdentifierResult {
	exists: boolean;
	otpAvailable: boolean;
	availableMethods: ("password" | "otp")[];
}

export interface PasswordResetRequest {
	email: string;
}

export interface PasswordResetConfirm {
	token: string;
	newPassword: string;
}

export interface TwoFAStatus {
	enabled: boolean;
}

export interface TwoFASetup {
	qr_code_url: string;
	secret: string;
}

export interface Session {
	id: string;
	user_agent?: string;
	ip_address?: string;
	created_at: string;
	last_active_at?: string;
	is_current?: boolean;
}

class AuthService {
	/**
	 * Login using NextAuth - credentials are handled by NextAuth
	 * @deprecated Use signIn from next-auth/react directly
	 */
	async login(data: LoginData): Promise<{ ok: boolean; error?: string }> {
		const result = await nextAuthSignIn("credentials", { email: data.email, password: data.password, redirect: false });

		return { ok: result?.ok || false, error: result?.error ?? undefined };
	}

	/**
	 * Signup - still uses direct API call as NextAuth doesn't handle registration
	 */
	async signup(data: SignupData): Promise<AuthResponse> {
		const response = await apiClient.post<AuthResponse>("/user/auth/signup", data);
		return response.data;
	}

	/**
	 * Logout using NextAuth
	 * @deprecated Use signOut from next-auth/react directly
	 */
	async logout(): Promise<void> {
		// Logout is handled by NextAuth signOut
		// Call backend to invalidate session if needed
		try {
			await apiClient.post<void>("/user/auth/logout");
		} catch (error) {
			console.error("Backend logout error:", error);
		}
	}

	async getProfile(): Promise<AuthResponse["user"]> {
		const response = await apiClient.get<AuthResponse["user"]>("/user/auth/profile");
		return response.data;
	}

	async requestPasswordReset(data: PasswordResetRequest): Promise<void> {
		const response = await apiClient.post<void>("/user/auth/password-reset/request", data);
		return response.data;
	}

	async confirmPasswordReset(data: PasswordResetConfirm): Promise<void> {
		const response = await apiClient.post<void>("/user/auth/password-reset/confirm", data);
		return response.data;
	}

	async checkIdentifier(identifier: string, type: "email" | "phone"): Promise<CheckIdentifierResult> {
		const response = await apiClient.post<CheckIdentifierResult>("/user/auth/check-identifier", { identifier, type });
		return response.data;
	}

	async verifyEmail(token: string): Promise<void> {
		const response = await apiClient.post<void>("/user/auth/verify-email", { token });
		return response.data;
	}

	/**
	 * Token refresh is now handled by NextAuth automatically
	 * @deprecated Not needed with NextAuth
	 */
	async refreshToken(refreshToken: string): Promise<AuthResponse> {
		const response = await apiClient.post<AuthResponse>("/user/auth/refresh", { refreshToken });
		return response.data;
	}

	/**
	 * @deprecated Tokens are managed by NextAuth via HTTP-only cookies
	 */
	setToken(token: string): void {
		// No-op: NextAuth manages tokens via HTTP-only cookies
		console.warn("setToken is deprecated with NextAuth");
	}

	/**
	 * @deprecated Tokens are managed by NextAuth via HTTP-only cookies
	 */
	getToken(): string | null {
		console.warn("getToken is deprecated with NextAuth - use session instead");
		return null;
	}

	/**
	 * @deprecated Tokens are managed by NextAuth via HTTP-only cookies
	 */
	removeToken(): void {
		// No-op: NextAuth manages tokens
		console.warn("removeToken is deprecated with NextAuth");
	}

	async changePassword(currentPassword: string, newPassword: string): Promise<void> {
		await apiClient.post<void>("/user/auth/change-password", { currentPassword, newPassword });
	}

	async get2FAStatus(): Promise<TwoFAStatus> {
		const response = await apiClient.get<TwoFAStatus>("/user/auth/2fa/status");
		return response.data;
	}

	async setup2FA(): Promise<TwoFASetup> {
		const response = await apiClient.post<TwoFASetup>("/user/auth/2fa/setup", {});
		return response.data;
	}

	async enable2FA(token: string): Promise<void> {
		await apiClient.post<void>("/user/auth/2fa/enable", { token });
	}

	async disable2FA(token: string): Promise<void> {
		await apiClient.post<void>("/user/auth/2fa/disable", { token });
	}

	async getSessions(): Promise<Session[]> {
		const response = await apiClient.get<Session[]>("/user/auth/sessions");
		return response.data ?? [];
	}

	async revokeSession(sessionId: string): Promise<void> {
		await apiClient.delete<void>(`/user/auth/sessions/${sessionId}`);
	}

	async revokeAllSessions(): Promise<void> {
		await apiClient.delete<void>("/user/auth/sessions");
	}
}

export const authService = new AuthService();

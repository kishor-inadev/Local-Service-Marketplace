/**
 * Server-side auth service for use in NextAuth configuration.
 *
 * This is intentionally separate from auth-service.ts because the browser
 * auth service depends on apiClient → getSession (next-auth/react), which is
 * a client-only module and cannot be imported in the NextAuth server-side
 * configuration (auth.config.ts) without causing a circular dependency.
 *
 * This service uses axios (without getSession) and is safe to use server-side.
 */

import axios, { AxiosInstance, AxiosError } from "axios";
import {
	BackendAuthResponse,
	BackendRefreshResponse,
	isValidBackendAuthResponse,
	isValidBackendRefreshResponse,
	AUTH_ENDPOINTS,
} from "@/types/auth-alignment";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3700";
console.log(API_URL);

// Standardized API Response interface (mirrors api-client.ts)
interface StandardResponse<T = any> {
	success: boolean;
	statusCode: number;
	message: string;
	data?: T;
	error?: { code: string; message: string; details?: any };
}

function createServerClient(): AxiosInstance {
	const client = axios.create({
		baseURL: `${API_URL}`,
		timeout: 30000,
		headers: { "Content-Type": "application/json" },
		withCredentials: true,
	});

	// Unwrap standardized { success, data } envelope
	client.interceptors.response.use(
		(response) => {
			if (response.data && typeof response.data === "object" && "success" in response.data) {
				const standard = response.data as StandardResponse;
				if (standard.success) {
					response.data = standard.data;
				} else {
					return Promise.reject({ response: { status: standard.statusCode, data: standard } });
				}
			}
			return response;
		},
		(error: AxiosError) => Promise.reject(error),
	);

	return client;
}

const serverClient = createServerClient();

class ServerAuthService {
	async loginWithEmail(email: string, password: string): Promise<BackendAuthResponse | null> {
		try {
			const response = await serverClient.post<BackendAuthResponse>(AUTH_ENDPOINTS.LOGIN, { email, password });
			const data = response.data;
			if (!isValidBackendAuthResponse(data)) {
				console.error("Invalid backend auth response", data);
				return null;
			}
			return data;
		} catch (error) {
			console.error("Email login failed:", (error as AxiosError)?.response?.status);
			return null;
		}
	}

	async loginWithPhone(phone: string, password: string): Promise<BackendAuthResponse | null> {
		try {
			const response = await serverClient.post<BackendAuthResponse>("/api/v1/user/auth/phone/login", {
				phone,
				password,
			});
			const data = response.data;
			if (!isValidBackendAuthResponse(data)) {
				console.error("Invalid backend auth response", data);
				return null;
			}
			return data;
		} catch (error) {
			console.error("Phone login failed:", (error as AxiosError)?.response?.status);
			return null;
		}
	}

	async verifyPhoneOtp(phone: string, code: string): Promise<BackendAuthResponse | null> {
		try {
			const response = await serverClient.post<BackendAuthResponse>("/api/v1/user/auth/phone/otp/verify", {
				phone,
				code,
			});
			const data = response.data;
			if (!isValidBackendAuthResponse(data)) {
				console.error("Invalid backend auth response", data);
				return null;
			}
			return data;
		} catch (error) {
			console.error("Phone OTP verification failed:", (error as AxiosError)?.response?.status);
			return null;
		}
	}

	async verifyEmailOtp(email: string, code: string): Promise<BackendAuthResponse | null> {
		try {
			const response = await serverClient.post<BackendAuthResponse>("/api/v1/user/auth/email/otp/verify", {
				email,
				code,
			});
			const data = response.data;
			if (!isValidBackendAuthResponse(data)) {
				console.error("Invalid backend auth response", data);
				return null;
			}
			return data;
		} catch (error) {
			console.error("Email OTP verification failed:", (error as AxiosError)?.response?.status);
			return null;
		}
	}

	async refreshToken(refreshToken: string): Promise<BackendRefreshResponse | null> {
		try {
			const response = await serverClient.post<BackendRefreshResponse>(AUTH_ENDPOINTS.REFRESH, { refreshToken });
			const data = response.data;
			if (!isValidBackendRefreshResponse(data)) {
				console.error("Invalid refresh response", data);
				return null;
			}
			return data;
		} catch (error) {
			console.error("Token refresh failed:", (error as AxiosError)?.response?.status);
			return null;
		}
	}

	async getProfileFromToken(accessToken: string): Promise<BackendAuthResponse["user"] | null> {
		try {
			const response = await serverClient.get<BackendAuthResponse["user"]>(AUTH_ENDPOINTS.PROFILE, {
				headers: { Authorization: `Bearer ${accessToken}` },
			});
			return response.data;
		} catch (error) {
			console.error("Get profile from token failed:", (error as AxiosError)?.response?.status);
			return null;
		}
	}
}

export const serverAuthService = new ServerAuthService();

import { apiClient } from './api-client';

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

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

class AuthService {
  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/signup', data);
    return response.data;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  }

  async logout(): Promise<void> {
    const response = await apiClient.post<void>('/auth/logout');
    return response.data;
  }

  async getProfile(): Promise<AuthResponse['user']> {
    const response = await apiClient.get<AuthResponse['user']>('/auth/profile');
    return response.data;
  }

  async requestPasswordReset(data: PasswordResetRequest): Promise<void> {
    const response = await apiClient.post<void>('/auth/password-reset/request', data);
    return response.data;
  }

  async confirmPasswordReset(data: PasswordResetConfirm): Promise<void> {
    const response = await apiClient.post<void>('/auth/password-reset/confirm', data);
    return response.data;
  }

  async verifyEmail(token: string): Promise<void> {
    const response = await apiClient.post<void>('/auth/verify-email', { token });
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken });
    return response.data;
  }

  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }
}

export const authService = new AuthService();

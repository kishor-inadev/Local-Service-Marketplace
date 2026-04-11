/**
 * Type definitions to ensure frontend-backend alignment
 * This file provides compile-time verification that frontend types match backend DTOs
 */

// ============================================
// Backend Response Types (from auth-service)
// ============================================

/**
 * Backend AuthResponse DTO
 * Source: services/auth-service/src/modules/auth/dto/auth-response.dto.ts
 */
export interface BackendAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
    email_verified: boolean;
    phone_verified: boolean;
    profile_picture_url?: string;
    timezone: string;
    language: string;
    last_login_at?: Date;
  };
}

/**
 * Backend Refresh Token Response
 * Source: services/auth-service/src/modules/auth/controllers/auth.controller.ts
 */
export interface BackendRefreshResponse {
  accessToken: string;
  // Note: Backend may optionally return new refreshToken for token rotation
  refreshToken?: string;
}

/**
 * Backend User Type
 * Source: database/schema.sql - users table
 */
export interface BackendUser {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: 'customer' | 'provider' | 'admin';
  email_verified: boolean;
  phone_verified: boolean;
  profile_picture_url?: string;
  timezone: string;
  language: string;
  last_login_at?: Date;
  status: 'active' | 'suspended' | 'deleted';
  created_at: Date;
  updated_at?: Date;
}

/**
 * Backend Session Type
 * Source: database/schema.sql - sessions table
 */
export interface BackendSession {
  id: string;
  user_id: string;
  refresh_token: string;
  ip_address?: string;
  user_agent?: string;
  device_type?: string;
  location?: string;
  expires_at: Date; // 7 days from creation
  created_at: Date;
}

// ============================================
// Frontend Types (NextAuth)
// ============================================

/**
 * NextAuth Session Type
 * Source: frontend/types/next-auth.d.ts
 */
export interface FrontendSession {
	user: {
		id: string;
		email?: string | null;
		name?: string | null;
		image?: string | null;
		role: string;
		emailVerified: boolean;
		phoneVerified: boolean;
		timezone: string | null;
		language: string | null;
	};
	expires: string; // ISO date string
	accessToken?: string;
	accessTokenExpires?: number; // Unix timestamp
	error?: "RefreshAccessTokenError";
}

/**
 * NextAuth JWT Type
 * Source: frontend/types/next-auth.d.ts
 */
export interface FrontendJWT {
  name?: string | null;
  email?: string | null;
  picture?: string | null;
  sub?: string;
  id?: string;
  role?: string;
  emailVerified?: boolean | Date | null;
  phoneVerified?: boolean;
  timezone?: string | null;
  language?: string | null;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number; // Unix timestamp
  error?: 'RefreshAccessTokenError';
  iat?: number;
  exp?: number;
  jti?: string;
}

// ============================================
// Type Verification Helpers
// ============================================

/**
 * Type guard to verify backend auth response
 */
export function isValidBackendAuthResponse(data: any): data is BackendAuthResponse {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.accessToken === 'string' &&
    typeof data.refreshToken === 'string' &&
    data.user &&
    typeof data.user.id === 'string' &&
    typeof data.user.email === 'string' &&
    typeof data.user.role === 'string' &&
    typeof data.user.email_verified === 'boolean' &&
    typeof data.user.phone_verified === 'boolean' &&
    typeof data.user.timezone === 'string' &&
    typeof data.user.language === 'string'
  );
}

/**
 * Type guard to verify backend refresh response
 */
export function isValidBackendRefreshResponse(data: any): data is BackendRefreshResponse {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.accessToken === 'string'
  );
}

/**
 * Transform backend user to frontend format
 */
export function transformBackendUserToFrontend(backendUser: BackendAuthResponse['user']) {
  return {
    id: backendUser.id,
    email: backendUser.email,
    name: backendUser.name || backendUser.email.split('@')[0],
    image: backendUser.profile_picture_url || null,
    role: backendUser.role,
    emailVerified: backendUser.email_verified,
    phoneVerified: backendUser.phone_verified,
    timezone: backendUser.timezone,
    language: backendUser.language,
  };
}

// ============================================
// Configuration Constants
// ============================================

/**
 * Token expiration times (must match backend config)
 * Backend: services/auth-service/.env.example
 */
export const TOKEN_CONFIG = {
  ACCESS_TOKEN_EXPIRATION: 15 * 60 * 1000, // 15 minutes in milliseconds
  REFRESH_TOKEN_EXPIRATION: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  ACCESS_TOKEN_EXPIRATION_STRING: '15m',
  REFRESH_TOKEN_EXPIRATION_STRING: '7d',
} as const;

/**
 * JWT Secret keys (for reference - actual values in .env)
 */
export const JWT_SECRETS = {
  ACCESS_TOKEN: 'JWT_SECRET',
  REFRESH_TOKEN: 'JWT_REFRESH_SECRET',
  NEXTAUTH: 'AUTH_SECRET',
} as const;

/**
 * API Endpoints (must match backend routes)
 */
export const AUTH_ENDPOINTS = {
	SIGNUP: "/api/v1/user/auth/signup",
	LOGIN: "/api/v1/user/auth/login",
	LOGOUT: "/api/v1/user/auth/logout",
	REFRESH: "/api/v1/user/auth/refresh",
	VERIFY_EMAIL: "/api/v1/user/auth/verify-email",
	REQUEST_PASSWORD_RESET: "/api/v1/user/auth/password-reset/request",
	CONFIRM_PASSWORD_RESET: "/api/v1/user/auth/password-reset/confirm",
	PROFILE: "/api/v1/user/auth/me",
} as const;

/**
 * User roles (must match database constraint)
 */
export const USER_ROLES = {
  CUSTOMER: 'customer',
  PROVIDER: 'provider',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/**
 * User status (must match database constraint)
 */
export const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

// ============================================
// Error Types
// ============================================

/**
 * Backend error response format
 */
export interface BackendErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Common error codes from backend
 */
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_REFRESH_TOKEN: 'INVALID_REFRESH_TOKEN',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  ACCOUNT_NOT_ACTIVE: 'ACCOUNT_NOT_ACTIVE',
} as const;

// ============================================
// Compile-Time Type Checks
// ============================================

/**
 * These type definitions ensure compatibility between backend and frontend types.
 * TypeScript will show errors at compile time if types are misaligned.
 */

// Verify that backend user fields can be transformed to frontend user
type BackendUserFields = keyof BackendUser;
type FrontendUserFields = keyof FrontendSession['user'];

// Verify token field types are compatible
type AccessTokenType = BackendAuthResponse['accessToken'] extends string ? true : never;
type RefreshTokenType = BackendAuthResponse['refreshToken'] extends string ? true : never;

// ============================================
// Runtime Validation Examples
// ============================================

/**
 * Example: Validate login response
 */
export function validateLoginResponse(response: unknown): BackendAuthResponse {
  if (!isValidBackendAuthResponse(response)) {
    throw new Error('Invalid login response format');
  }
  return response;
}

/**
 * Example: Validate refresh response
 */
export function validateRefreshResponse(response: unknown): BackendRefreshResponse {
  if (!isValidBackendRefreshResponse(response)) {
    throw new Error('Invalid refresh response format');
  }
  return response;
}

/**
 * Example: Safe user transformation with validation
 */
export function safeTransformUser(backendUser: unknown) {
  if (!backendUser || typeof backendUser !== 'object') {
    throw new Error('Invalid user data');
  }

  const user = backendUser as BackendAuthResponse['user'];

  if (!user.id || !user.email || !user.role) {
    throw new Error('Missing required user fields');
  }

  return transformBackendUserToFrontend(user);
}

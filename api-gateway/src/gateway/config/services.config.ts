export const servicesConfig = {
	"identity-service": {
		url: process.env.IDENTITY_SERVICE_URL || process.env.AUTH_SERVICE_URL || "http://localhost:3001",
		name: "identity-service",
		// No stripPrefix for general identity routes (/users, /providers, etc.)
	},
	"identity-service-auth": {
		url: process.env.IDENTITY_SERVICE_URL || process.env.AUTH_SERVICE_URL || "http://localhost:3001",
		name: "identity-service",
		stripPrefix: "/user",
	},
	"marketplace-service": {
		url: process.env.MARKETPLACE_SERVICE_URL || process.env.REQUEST_SERVICE_URL || "http://localhost:3003",
		name: "marketplace-service",
	},
	"payment-service": { url: process.env.PAYMENT_SERVICE_URL || "http://localhost:3006", name: "payment-service" },
	"comms-service": {
		url: process.env.COMMS_SERVICE_URL || process.env.MESSAGING_SERVICE_URL || "http://localhost:3007",
		name: "comms-service",
	},
	"oversight-service": {
		url: process.env.OVERSIGHT_SERVICE_URL || process.env.ADMIN_SERVICE_URL || "http://localhost:3010",
		name: "oversight-service",
	},
	"infrastructure-service": {
		url: process.env.INFRASTRUCTURE_SERVICE_URL || "http://localhost:3012",
		name: "infrastructure-service",
	},
};

export const routingConfig = {
	// identity-service (auth + user + providers)
	"/user/auth": "identity-service-auth",
	"/users": "identity-service",
	"/providers": "identity-service",
	"/provider-documents": "identity-service",
	"/provider-portfolio": "identity-service",
	"/favorites": "identity-service",
	// marketplace-service (requests + proposals + jobs + reviews)
	"/requests": "marketplace-service",
	"/categories": "marketplace-service",
	"/service-categories": "marketplace-service",
	"/proposals": "marketplace-service",
	"/jobs": "marketplace-service",
	"/reviews": "marketplace-service",
	"/review-aggregates": "marketplace-service",
	// payment-service
	"/payments": "payment-service",
	"/payment-methods": "payment-service",
	"/subscriptions": "payment-service",
	"/pricing-plans": "payment-service",
	// comms-service (messaging + notifications)
	"/messages": "comms-service",
	"/notifications": "comms-service",
	"/notification-preferences": "comms-service",
	// oversight-service (admin + analytics)
	"/admin": "oversight-service",
	"/analytics": "oversight-service",
	// infrastructure-service
	"/events": "infrastructure-service",
	"/background-jobs": "infrastructure-service",
	"/rate-limits": "infrastructure-service",
	"/feature-flags": "infrastructure-service",
};

/**
 * API Gateway Route Configuration
 * 
 * PUBLIC ROUTES: No authentication required (all HTTP methods)
 * PUBLIC GET ROUTES: Only GET requests allowed without auth (POST/PATCH/DELETE require JWT)
 * PROTECTED ROUTES: All other routes require JWT authentication
 */

// ============================================
// PUBLIC ROUTES (All HTTP Methods Allowed)
// ============================================
export const publicRoutes = [
	// ============================================
	// Authentication Endpoints
	// ============================================
	"/api/v1/user/auth/signup", // Create account
	"/api/v1/user/auth/login", // Email + password login
	"/api/v1/user/auth/refresh", // Refresh JWT token
	"/api/v1/user/auth/password-reset/request", // Request password reset
	"/api/v1/user/auth/password-reset/confirm", // Confirm password reset
	"/api/v1/user/auth/email/verify", // Verify email address
	"/api/v1/user/auth/check-identifier", // Check if email/phone exists
	"/api/v1/user/auth/verify", // Internal token verification (gateway only)

	// ============================================
	// OAuth Endpoints
	// ============================================
	"/api/v1/user/auth/google", // Google OAuth initiate
	"/api/v1/user/auth/google/callback", // Google OAuth callback
	"/api/v1/user/auth/facebook", // Facebook OAuth initiate
	"/api/v1/user/auth/facebook/callback", // Facebook OAuth callback

	// ============================================
	// Phone Authentication Endpoints
	// ============================================
	"/api/v1/user/auth/phone/login", // Phone + password login
	"/api/v1/user/auth/phone/otp/request", // Request OTP via SMS
	"/api/v1/user/auth/phone/otp/verify", // Verify OTP code

	// ============================================
	// Email OTP Endpoints (if implemented)
	// ============================================
	"/api/v1/user/auth/email/otp/request", // Request OTP via email
	"/api/v1/user/auth/email/otp/verify", // Verify email OTP

	// ============================================
	// Payment Webhooks (external services)
	// ============================================
	"/api/v1/payments/webhook", // Stripe/payment provider webhooks

	// ============================================
	// Public Information Endpoints
	// ============================================
	"/api/v1/admin/contact", // Contact form submission (public)
	"/api/v1/categories", // List service categories (public browsing)
	"/api/v1/service-categories", // Alias for categories (backward compat)

	// ============================================
	// Health & Monitoring
	// ============================================
	"/api/v1/health", // API Gateway health check
	"/api/v1/health/services", // All services health status
	"/health", // Health (without /api/v1 prefix)
	"/health/services", // Services health (without /api/v1 prefix)
];

// ============================================
// PUBLIC GET-ONLY ROUTES
// ============================================
// These routes allow GET requests without authentication
// POST/PATCH/PUT/DELETE require JWT token
export const publicGetRoutes = [
	// ============================================
	// Service Requests (Public Marketplace Browsing)
	// ============================================
	"/api/v1/requests",                       // Browse all service requests (GET only)
	"/api/v1/requests/",                      // View individual request details (GET /requests/:id)

	// ============================================
	// Provider Directory (Public Browsing)
	// ============================================
	"/api/v1/providers",                      // Browse provider directory (GET only)
	"/api/v1/providers/",                     // View individual provider profiles (GET /providers/:id)

	// ============================================
	// Provider Reviews (Public Viewing)
	// ============================================
	"/api/v1/reviews",                        // Browse reviews (GET only)
	"/api/v1/providers/",                     // Includes /providers/:id/reviews

	// ============================================
	// Pricing Plans (Public Information)
	// ============================================
	"/api/v1/pricing-plans",                  // View pricing tiers (GET only)
];

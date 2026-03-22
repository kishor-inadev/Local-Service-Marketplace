export const servicesConfig = {
	auth: { url: process.env.AUTH_SERVICE_URL || "http://localhost:3001", name: "identity-service" },
	user: { url: process.env.USER_SERVICE_URL || "http://localhost:3001", name: "identity-service" },
	request: { url: process.env.REQUEST_SERVICE_URL || "http://localhost:3003", name: "marketplace-service" },
	proposal: { url: process.env.PROPOSAL_SERVICE_URL || "http://localhost:3003", name: "marketplace-service" },
	job: { url: process.env.JOB_SERVICE_URL || "http://localhost:3003", name: "marketplace-service" },
	payment: { url: process.env.PAYMENT_SERVICE_URL || "http://localhost:3006", name: "payment-service" },
	messaging: { url: process.env.MESSAGING_SERVICE_URL || "http://localhost:3007", name: "comms-service" },
	notification: { url: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3007", name: "comms-service" },
	review: { url: process.env.REVIEW_SERVICE_URL || "http://localhost:3003", name: "marketplace-service" },
	admin: { url: process.env.ADMIN_SERVICE_URL || "http://localhost:3010", name: "oversight-service" },
	analytics: { url: process.env.ANALYTICS_SERVICE_URL || "http://localhost:3010", name: "oversight-service" },
	infrastructure: {
		url: process.env.INFRASTRUCTURE_SERVICE_URL || "http://localhost:3012",
		name: "infrastructure-service",
	},
};

export const routingConfig = {
	"/auth": "auth",
	"/users": "user",
	"/providers": "user",
	"/provider-documents": "user",
	"/provider-portfolio": "user",
	"/favorites": "user",
	"/requests": "request",
	"/categories": "request",
	"/service-categories": "request",
	"/proposals": "proposal",
	"/jobs": "job",
	"/payments": "payment",
	"/payment-methods": "payment",
	"/subscriptions": "payment",
	"/pricing-plans": "payment",
	"/messages": "messaging",
	"/notifications": "notification",
	"/notification-preferences": "notification",
	"/reviews": "review",
	"/review-aggregates": "review",
	"/admin": "admin",
	"/analytics": "analytics",
	"/events": "infrastructure",
	"/background-jobs": "infrastructure",
	"/rate-limits": "infrastructure",
	"/feature-flags": "infrastructure",
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
	"/api/v1/auth/signup", // Create account
	"/api/v1/auth/login", // Email + password login
	"/api/v1/auth/refresh", // Refresh JWT token
	"/api/v1/auth/password-reset/request", // Request password reset
	"/api/v1/auth/password-reset/confirm", // Confirm password reset
	"/api/v1/auth/email/verify", // Verify email address
	"/api/v1/auth/check-identifier", // Check if email/phone exists

	// ============================================
	// OAuth Endpoints
	// ============================================
	"/api/v1/auth/google", // Google OAuth initiate
	"/api/v1/auth/google/callback", // Google OAuth callback
	"/api/v1/auth/facebook", // Facebook OAuth initiate
	"/api/v1/auth/facebook/callback", // Facebook OAuth callback

	// ============================================
	// Phone Authentication Endpoints
	// ============================================
	"/api/v1/auth/phone/login", // Phone + password login
	"/api/v1/auth/phone/otp/request", // Request OTP via SMS
	"/api/v1/auth/phone/otp/verify", // Verify OTP code

	// ============================================
	// Email OTP Endpoints (if implemented)
	// ============================================
	"/api/v1/auth/email/otp/request", // Request OTP via email
	"/api/v1/auth/email/otp/verify", // Verify email OTP

	// ============================================
	// Payment Webhooks (external services)
	// ============================================
	"/api/v1/payments/webhook", // Stripe/payment provider webhooks

	// ============================================
	// Public Information Endpoints
	// ============================================
	"/api/v1/admin/contact", // Contact form submission
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

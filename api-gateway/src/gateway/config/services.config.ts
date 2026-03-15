export const servicesConfig = {
  auth: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    name: 'auth-service',
  },
  user: {
    url: process.env.USER_SERVICE_URL || 'http://localhost:3002',
    name: 'user-service',
  },
  request: {
    url: process.env.REQUEST_SERVICE_URL || 'http://localhost:3003',
    name: 'request-service',
  },
  proposal: {
    url: process.env.PROPOSAL_SERVICE_URL || 'http://localhost:3004',
    name: 'proposal-service',
  },
  job: {
    url: process.env.JOB_SERVICE_URL || 'http://localhost:3005',
    name: 'job-service',
  },
  payment: {
    url: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3006',
    name: 'payment-service',
  },
  messaging: {
    url: process.env.MESSAGING_SERVICE_URL || 'http://localhost:3007',
    name: 'messaging-service',
  },
  notification: {
    url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3008',
    name: 'notification-service',
  },
  review: {
    url: process.env.REVIEW_SERVICE_URL || 'http://localhost:3009',
    name: 'review-service',
  },
  admin: {
    url: process.env.ADMIN_SERVICE_URL || 'http://localhost:3010',
    name: 'admin-service',
  },
  analytics: {
    url: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3011',
    name: 'analytics-service',
  },
  infrastructure: {
    url: process.env.INFRASTRUCTURE_SERVICE_URL || 'http://localhost:3012',
    name: 'infrastructure-service',
  },
};

export const routingConfig = {
  '/auth': 'auth',
  '/users': 'user',
  '/providers': 'user',
  '/provider-documents': 'user',
  '/provider-portfolio': 'user',
  '/requests': 'request',
  '/proposals': 'proposal',
  '/jobs': 'job',
  '/payments': 'payment',
  '/payment-methods': 'payment',
  '/subscriptions': 'payment',
  '/pricing-plans': 'payment',
  '/messages': 'messaging',
  '/notifications': 'notification',
  '/notification-preferences': 'notification',
  '/reviews': 'review',
  '/review-aggregates': 'review',
  '/admin': 'admin',
  '/analytics': 'analytics',
  '/events': 'infrastructure',
  '/background-jobs': 'infrastructure',
  '/rate-limits': 'infrastructure',
  '/feature-flags': 'infrastructure',
};

// Public routes configuration
// Note: Routes can be strings (all methods) or objects with method filtering
export const publicRoutes = [
	// Authentication endpoints
	"/api/v1/auth/signup",
	"/api/v1/auth/login",
	"/api/v1/auth/refresh",
	"/api/v1/auth/password-reset/request",
	"/api/v1/auth/password-reset/confirm",
	"/api/v1/auth/email/verify", // Email verification
	"/api/v1/auth/check-identifier", // Check if email/phone exists
	
	// OAuth endpoints
	"/api/v1/auth/google",
	"/api/v1/auth/google/callback",
	"/api/v1/auth/facebook",
	"/api/v1/auth/facebook/callback",
	
	// Phone authentication endpoints
	"/api/v1/auth/phone/login", // Phone + password login
	"/api/v1/auth/phone/otp/request", // Request OTP via SMS
	"/api/v1/auth/phone/otp/verify", // Verify OTP code
	
	// Public endpoints
	"/api/v1/admin/contact",  // Contact form submission - public access
	"/api/v1/health",
	"/api/v1/health/services",
	// Health endpoints are excluded from global prefix, so they're accessible without /api/v1
	"/health",
	"/health/services",
];

// Public GET-only routes (for browsing without authentication)
// These routes allow GET requests without auth, but POST/PATCH/DELETE require authentication
export const publicGetRoutes = [
	"/api/v1/requests", // Browse service requests (GET only)
	"/api/v1/providers", // Browse provider directory (GET only)
	"/api/v1/requests/", // View individual requests (GET only)
	"/api/v1/providers/", // View individual provider profiles (GET only)
];

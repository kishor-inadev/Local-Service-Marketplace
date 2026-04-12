/**
 * Permission constants following resource.action naming convention.
 * These map 1:1 to the permissions table in the database.
 */
export enum Permission {
  // Dashboard
  DASHBOARD_VIEW = 'dashboard.view',

  // Users
  USERS_LIST = 'users.list',
  USERS_READ = 'users.read',
  USERS_CREATE = 'users.create',
  USERS_UPDATE = 'users.update',
  USERS_DELETE = 'users.delete',
  USERS_MANAGE = 'users.manage',

  // Profile (own)
  PROFILE_VIEW = 'profile.view',
  PROFILE_UPDATE = 'profile.update',

  // Providers
  PROVIDERS_LIST = 'providers.list',
  PROVIDERS_READ = 'providers.read',
  PROVIDERS_VERIFY = 'providers.verify',
  PROVIDERS_MANAGE = 'providers.manage',

  // Provider Profile (own)
  PROVIDER_PROFILE_VIEW = 'provider_profile.view',
  PROVIDER_PROFILE_UPDATE = 'provider_profile.update',

  // Provider Services (own)
  PROVIDER_SERVICES_MANAGE = 'provider_services.manage',

  // Provider Availability
  PROVIDER_AVAILABILITY_MANAGE = 'provider_availability.manage',

  // Provider Portfolio
  PROVIDER_PORTFOLIO_MANAGE = 'provider_portfolio.manage',

  // Provider Documents
  PROVIDER_DOCUMENTS_MANAGE = 'provider_documents.manage',

  // Service Requests
  REQUESTS_CREATE = 'requests.create',
  REQUESTS_READ = 'requests.read',
  REQUESTS_UPDATE = 'requests.update',
  REQUESTS_DELETE = 'requests.delete',
  REQUESTS_BROWSE = 'requests.browse',
  REQUESTS_MANAGE = 'requests.manage',
  REQUESTS_VIEW_STATS = 'requests.view_stats',

  // Categories
  CATEGORIES_READ = 'categories.read',
  CATEGORIES_MANAGE = 'categories.manage',

  // Proposals
  PROPOSALS_CREATE = 'proposals.create',
  PROPOSALS_READ = 'proposals.read',
  PROPOSALS_UPDATE = 'proposals.update',
  PROPOSALS_ACCEPT = 'proposals.accept',
  PROPOSALS_MANAGE = 'proposals.manage',

  // Jobs
  JOBS_CREATE = 'jobs.create',
  JOBS_READ = 'jobs.read',
  JOBS_UPDATE_STATUS = 'jobs.update_status',
  JOBS_MANAGE = 'jobs.manage',
  JOBS_VIEW_STATS = 'jobs.view_stats',

  // Reviews
  REVIEWS_CREATE = 'reviews.create',
  REVIEWS_READ = 'reviews.read',
  REVIEWS_UPDATE = 'reviews.update',
  REVIEWS_DELETE = 'reviews.delete',
  REVIEWS_MANAGE = 'reviews.manage',

  // Favorites
  FAVORITES_MANAGE = 'favorites.manage',

  // Payments
  PAYMENTS_CREATE = 'payments.create',
  PAYMENTS_READ = 'payments.read',
  PAYMENTS_MANAGE = 'payments.manage',
  PAYMENTS_VIEW_STATS = 'payments.view_stats',

  // Refunds
  REFUNDS_CREATE = 'refunds.create',
  REFUNDS_MANAGE = 'refunds.manage',

  // Subscriptions
  SUBSCRIPTIONS_MANAGE = 'subscriptions.manage',

  // Earnings
  EARNINGS_VIEW = 'earnings.view',
  EARNINGS_MANAGE = 'earnings.manage',

  // Coupons
  COUPONS_MANAGE = 'coupons.manage',

  // Notifications
  NOTIFICATIONS_VIEW = 'notifications.view',
  NOTIFICATIONS_MANAGE = 'notifications.manage',

  // Messages
  MESSAGES_SEND = 'messages.send',
  MESSAGES_READ = 'messages.read',
  MESSAGES_MANAGE = 'messages.manage',

  // Disputes
  DISPUTES_FILE = 'disputes.file',
  DISPUTES_READ = 'disputes.read',
  DISPUTES_MANAGE = 'disputes.manage',
  DISPUTES_VIEW_STATS = 'disputes.view_stats',

  // Analytics
  ANALYTICS_VIEW = 'analytics.view',
  ANALYTICS_MANAGE = 'analytics.manage',

  // Audit Logs
  AUDIT_VIEW = 'audit.view',
  AUDIT_MANAGE = 'audit.manage',

  // Admin
  ADMIN_ACCESS = 'admin.access',
  ADMIN_CONTACT_VIEW = 'admin.contact_view',

  // Settings
  SETTINGS_MANAGE = 'settings.manage',

  // Roles & Permissions
  ROLES_READ = 'roles.read',
  ROLES_MANAGE = 'roles.manage',

  // Infrastructure
  INFRASTRUCTURE_EVENTS = 'infrastructure.events',
  INFRASTRUCTURE_JOBS = 'infrastructure.jobs',
  INFRASTRUCTURE_RATE_LIMITS = 'infrastructure.rate_limits',
  INFRASTRUCTURE_FEATURE_FLAGS = 'infrastructure.feature_flags',
}

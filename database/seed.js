// =================================================================
// LOCAL SERVICE MARKETPLACE — DATABASE SEEDER
// Covers all 50 tables, all FK constraints, all CHECK constraints
// =================================================================
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const { faker } = require("@faker-js/faker");
const dotenv = require("dotenv");
const crypto = require("crypto");
const {
	indianFirstNames, indianLastNames, indianServiceBusinessNames,
	providerBios, requestDescriptionsByCategory, proposalMessages,
	reviewCommentsByRating, providerResponses, realCouponCodes,
	disputeReasons, disputeResolutions, conversationMessages,
	contactSubjects, contactMessageBodies,
} = require('./seed-data');

// Load environment variables — local .env first, then parent directory
dotenv.config({ path: require("path").join(__dirname, ".env") });
dotenv.config({ path: require("path").join(__dirname, "../.env") });

// Database connection with retry logic
const pool = new Pool({
	host: process.env.POSTGRES_HOST || "localhost",
	port: parseInt(process.env.POSTGRES_PORT || "5432"),
	user: process.env.POSTGRES_USER || "postgres",
	password: process.env.POSTGRES_PASSWORD || "postgres_dev_only",
	database: process.env.POSTGRES_DB || "marketplace",
	max: 20,
	connectionTimeoutMillis: 5000,
	idleTimeoutMillis: 30000,
});

const DEFAULT_SEED_PASSWORD = "password123";

const uuid = () => {
	return crypto.randomUUID();
};

// Generates a display_id matching the schema trigger format: PREFIX (3 chars) + 8 chars from A-Z0-9
// e.g. USR + 8 chars = 'USRA3B9XZ12' (11 chars total), matching VARCHAR(11) UNIQUE NOT NULL
const displayId = (prefix = 'GEN') => {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let result = prefix;
	for (let i = 0; i < 8; i++) {
		result += chars[Math.floor(Math.random() * 36)];
	}
	return result;
};

const uniqueEmail = (firstName, lastName) => {
	const timestamp = Date.now();
	const random = crypto.randomBytes(4).toString("hex");
	const cleanFirst =
		String(firstName)
			.replace(/[^a-zA-Z0-9]/g, "")
			.toLowerCase() || "user";
	const cleanLast =
		String(lastName)
			.replace(/[^a-zA-Z0-9]/g, "")
			.toLowerCase() || crypto.randomBytes(3).toString("hex");
	return `${cleanFirst}.${cleanLast}.${timestamp}.${random}@marketplace.local`;
};

const randomDate = (start, end) => {
	return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomPick = (arr) => arr[randomInt(0, arr.length - 1)];
const randomPickMultiple = (arr, count) => {
	const shuffled = [...arr].sort(() => 0.5 - Math.random());
	return shuffled.slice(0, Math.min(count, arr.length));
};

const safeQuery = async (query, params, retries = 3) => {
	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			return await pool.query(query, params);
		} catch (error) {
			if (attempt === retries) {
				console.warn(`   ⚠ Query failed after ${retries} attempts:`, error.message);
				return { rows: [], rowCount: 0 };
			}
			await new Promise((resolve) => setTimeout(resolve, attempt * 100));
		}
	}
};

const safeInsert = async (query, params, retries = 5) => {
	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			await pool.query(query, params);
			return true;
		} catch (error) {
			if (error.code === "23505") {
				if (
					params[0] &&
					typeof params[0] === "string" &&
					params[0].match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
				) {
					params[0] = uuid();
					continue;
				}
			}

			if (attempt === retries) {
				console.warn(`   ⚠ Insert failed:`, error.message.substring(0, 100));
				return false;
			}

			await new Promise((resolve) => setTimeout(resolve, attempt * 50));
		}
	}
	return false;
};

const serviceCategories = [
	{ name: "Plumbing", description: "Plumbing repairs, installations, and maintenance", icon: "🔧" },
	{ name: "Electrical", description: "Electrical services and repairs", icon: "⚡" },
	{ name: "Carpentry", description: "Carpentry and woodwork services", icon: "🔨" },
	{ name: "Painting", description: "Interior and exterior painting services", icon: "🎨" },
	{ name: "Cleaning", description: "Home and office deep cleaning services", icon: "🧹" },
	{ name: "AC Service & Repair", description: "Air conditioner servicing, installation and repair", icon: "❄️" },
	{ name: "Pest Control", description: "Pest control and extermination services", icon: "🐛" },
	{ name: "Appliance Repair", description: "Repair of household appliances", icon: "🔧" },
	{ name: "Home Tutor", description: "Private tutoring for school and competitive exams", icon: "📚" },
	{ name: "Mobile Repair", description: "Smartphone and tablet repair services", icon: "📱" },
	{ name: "Cook / Home Chef", description: "Personal cook or tiffin service at home", icon: "👨‍🍳" },
	{ name: "Computer Repair", description: "Laptop and desktop repair services", icon: "💻" },
	{ name: "Beauty & Grooming", description: "Salon and grooming services at home", icon: "💇" },
	{ name: "Packers & Movers", description: "Packing and moving household goods", icon: "📦" },
	{ name: "Water Purifier Service", description: "RO and water purifier installation and service", icon: "💧" },
	{ name: "CCTV Installation", description: "Security camera installation and maintenance", icon: "📹" },
	{ name: "Yoga / Fitness Trainer", description: "Personal yoga and fitness training at home", icon: "🧘" },
	{ name: "Car Wash & Detailing", description: "Car washing and detailing at doorstep", icon: "🚗" },
	{ name: "Tailoring & Alterations", description: "Clothing stitching and alteration services", icon: "🧵" },
	{ name: "Inverter & Battery Service", description: "UPS, inverter and battery service and repair", icon: "🔋" },
];

const cities = [
	{ name: "Mumbai", state: "MH", lat: 19.0760, lng: 72.8777 },
	{ name: "Delhi", state: "DL", lat: 28.6139, lng: 77.2090 },
	{ name: "Bengaluru", state: "KA", lat: 12.9716, lng: 77.5946 },
	{ name: "Chennai", state: "TN", lat: 13.0827, lng: 80.2707 },
	{ name: "Hyderabad", state: "TS", lat: 17.3850, lng: 78.4867 },
	{ name: "Pune", state: "MH", lat: 18.5204, lng: 73.8567 },
	{ name: "Ahmedabad", state: "GJ", lat: 23.0225, lng: 72.5714 },
	{ name: "Kolkata", state: "WB", lat: 22.5726, lng: 88.3639 },
	{ name: "Jaipur", state: "RJ", lat: 26.9124, lng: 75.7873 },
	{ name: "Surat", state: "GJ", lat: 21.1702, lng: 72.8311 },
];

class DatabaseSeeder {
	constructor() {
		this.userIds = [];
		this.customerIds = [];
		this.providerIds = []; // users.id for provider-role users
		this.adminIds = [];
		this.categoryIds = [];
		this.categoryNameMap = new Map(); // categoryId -> name
		this.locationIds = [];
		this.locationCityMap = new Map(); // locationId -> city name
		this.requestIds = [];
		this.requestDetailsMap = new Map();
		this.proposalIds = [];
		this.acceptedProposals = [];
		this.jobIds = [];
		this.jobDetailsMap = new Map(); // jobId -> { customerId, providerUserId }
		this.paymentIds = [];
		this.providerRecordIds = []; // providers.id (NOT users.id)
		this.providerUserMap = new Map(); // providers.id -> users.id
		this.couponIds = [];
		this.planIds = [];
		this.messageIds = [];
		this.userEmailMap = new Map(); // userId -> email
		this.userDefaultPaymentSet = new Set();
		this.emailCounter = 0; // used by nextEmail()
	}

	/** Returns kishor81160@gmail.com for the first call, kishor81160+N@gmail.com for subsequent calls. */
	nextEmail() {
		const email = this.emailCounter === 0
			? 'kishor81160@gmail.com'
			: `kishor81160+${this.emailCounter}@gmail.com`;
		this.emailCounter++;
		return email;
	}

	async run() {
		console.log("🌱 Starting database seeding...\n");
		console.log("📊 Features: FK-safe ordering, retry logic, all 50 tables\n");

		try {
			await this.testConnection();

			const runStep = async (name, fn) => {
				try {
					await fn();
				} catch (error) {
					console.error(`   ❌ ${name} failed: ${error.message}`);
				}
			};

			// Identity / Auth
			await runStep('seedServiceCategories', () => this.seedServiceCategories());
			await runStep('seedRBAC', () => this.seedRBAC());
			await runStep('seedUsers', () => this.seedUsers());
			await runStep('seedEmailVerificationTokens', () => this.seedEmailVerificationTokens());
			await runStep('seedPasswordResetTokens', () => this.seedPasswordResetTokens());
			await runStep('seedSessions', () => this.seedSessions());
			await runStep('seedLoginAttempts', () => this.seedLoginAttempts());
			await runStep('seedLoginHistory', () => this.seedLoginHistory());
			await runStep('seedSocialAccounts', () => this.seedSocialAccounts());
			await runStep('seedUserDevices', () => this.seedUserDevices());
			await runStep('seedTwoFactorSecrets', () => this.seedTwoFactorSecrets());
			await runStep('seedMagicLinkTokens', () => this.seedMagicLinkTokens());
			await runStep('seedAccountDeletionRequests', () => this.seedAccountDeletionRequests());

			// Providers
			await runStep('seedProviders', () => this.seedProviders());
			await runStep('seedProviderServices', () => this.seedProviderServices());
			await runStep('seedProviderAvailability', () => this.seedProviderAvailability());
			await runStep('seedProviderPortfolio', () => this.seedProviderPortfolio());
			await runStep('seedProviderDocuments', () => this.seedProviderDocuments());

			// Marketplace
			await runStep('seedLocations', () => this.seedLocations());
			await runStep('seedServiceRequests', () => this.seedServiceRequests());
			await runStep('seedProposals', () => this.seedProposals());
			await runStep('seedJobs', () => this.seedJobs());

			// Payments
			await runStep('seedPaymentWebhooks', () => this.seedPaymentWebhooks());
			await runStep('seedPayments', () => this.seedPayments());
			await runStep('seedRefunds', () => this.seedRefunds());

			// Reviews & Messaging
			await runStep('seedReviews', () => this.seedReviews());
			await runStep('seedReviewHelpfulVotes', () => this.seedReviewHelpfulVotes());
			await runStep('seedMessages', () => this.seedMessages());
			await runStep('seedAttachments', () => this.seedAttachments());

			// Comms
			await runStep('seedNotifications', () => this.seedNotifications());
			await runStep('seedNotificationDeliveries', () => this.seedNotificationDeliveries());

			// Marketplace extras
			await runStep('seedFavorites', () => this.seedFavorites());
			await runStep('seedCoupons', () => this.seedCoupons());
			await runStep('seedCouponUsage', () => this.seedCouponUsage());
			await runStep('seedDisputes', () => this.seedDisputes());

			// Oversight
			await runStep('seedAuditLogs', () => this.seedAuditLogs());
			await runStep('seedUserActivityLogs', () => this.seedUserActivityLogs());
			await runStep('seedAdminActions', () => this.seedAdminActions());
			await runStep('seedContactMessages', () => this.seedContactMessages());
			await runStep('seedDailyMetrics', () => this.seedDailyMetrics());

			// Infrastructure
			await runStep('seedEvents', () => this.seedEvents());
			await runStep('seedBackgroundJobs', () => this.seedBackgroundJobs());
			await runStep('seedRateLimits', () => this.seedRateLimits());
			await runStep('seedFeatureFlags', () => this.seedFeatureFlags());
			await runStep('seedSystemSettings', () => this.seedSystemSettings());

			// Subscriptions
			await runStep('seedPricingPlans', () => this.seedPricingPlans());
			await runStep('seedSubscriptions', () => this.seedSubscriptions());

			// User preferences
			await runStep('seedSavedPaymentMethods', () => this.seedSavedPaymentMethods());
			await runStep('seedNotificationPreferences', () => this.seedNotificationPreferences());
			await runStep('seedUnsubscribes', () => this.seedUnsubscribes());
			await runStep('seedProviderReviewAggregates', () => this.seedProviderReviewAggregates());

			console.log("\n✅ Database seeding completed successfully!");
			console.log("\n📊 Summary:");
			console.log(`   Users: ${this.userIds.length}`);
			console.log(`   Providers: ${this.providerRecordIds.length}`);
			console.log(`   Categories: ${this.categoryIds.length}`);
			console.log(`   Service Requests: ${this.requestIds.length}`);
			console.log(`   Proposals: ${this.proposalIds.length}`);
			console.log(`   Jobs: ${this.jobIds.length}`);
			console.log(`   Payments: ${this.paymentIds.length}`);
			console.log(`   Messages: ${this.messageIds.length}`);
		} catch (error) {
			console.error("❌ Seeding encountered an error:", error.message);
			console.log("✓ Continuing despite error...");
		} finally {
			await pool.end();
			console.log("\n👋 Database connection closed");
		}
	}

	async testConnection() {
		try {
			const result = await pool.query("SELECT NOW()");
			console.log("✅ Database connection successful");

			// Check if required tables exist
			const tables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'providers', 'provider_services', 'service_categories')
      `);

			const tableNames = tables.rows.map((r) => r.table_name);
			const requiredTables = ["users", "providers", "provider_services", "service_categories"];
			const missingTables = requiredTables.filter((t) => !tableNames.includes(t));

			if (missingTables.length > 0) {
				console.error("❌ Missing required tables:", missingTables.join(", "));
				console.error("\n⚠️  Please run the schema first:");
				console.error("   psql -U postgres -d marketplace -f schema.sql\n");
				throw new Error("Database schema not applied");
			}

			console.log("✅ Required tables verified\n");
			return true;
		} catch (error) {
			console.error("❌ Database error:", error.message);
			throw error;
		}
	}

	async seedServiceCategories() {
		console.log("📁 Seeding service categories...");
		let inserted = 0;
		let existing = 0;

		for (const category of serviceCategories) {
			// First, check if category already exists
			const check = await safeQuery("SELECT id FROM service_categories WHERE name = $1", [category.name]);

			if (check.rows.length > 0) {
				// Category exists, use its ID
				this.categoryIds.push(check.rows[0].id);
				this.categoryNameMap.set(check.rows[0].id, category.name);
				existing++;
			} else {
				// Category doesn't exist, insert it
				const id = uuid();
				const success = await safeInsert(
					`INSERT INTO service_categories (id, display_id, name, description, icon, active) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
					[id, displayId('CAT'), category.name, category.description, category.icon, true],
				);

				if (success) {
					// Query back the actual ID that was inserted (safeInsert might have regenerated it)
					const actual = await safeQuery("SELECT id FROM service_categories WHERE name = $1", [category.name]);
					if (actual.rows.length > 0) {
						this.categoryIds.push(actual.rows[0].id);
						this.categoryNameMap.set(actual.rows[0].id, category.name);
						inserted++;
					}
				} else {
					// Insertion failed, try to get ID again in case it was just inserted
					const retry = await safeQuery("SELECT id FROM service_categories WHERE name = $1", [category.name]);
					if (retry.rows.length > 0) {
						this.categoryIds.push(retry.rows[0].id);
						existing++;
					}
				}
			}
		}

		console.log(
			`   ✓ Service categories ready: ${inserted} inserted, ${existing} existing (Total: ${this.categoryIds.length})`,
		);
	}

	async seedRBAC() {
		console.log("🔐 Seeding RBAC roles & permissions...");

		// --- Roles ---
		const roles = [
			{ name: 'admin', display_name: 'Administrator', description: 'Full platform access' },
			{ name: 'customer', display_name: 'Customer', description: 'Service requester' },
			{ name: 'provider', display_name: 'Provider', description: 'Service provider' },
		];
		for (const role of roles) {
			await safeInsert(
				`INSERT INTO roles (id, name, display_name, description) VALUES (uuid_generate_v4(), $1, $2, $3) ON CONFLICT (name) DO NOTHING`,
				[role.name, role.display_name, role.description],
			);
		}

		// --- Permissions ---
		const permissions = [
			['dashboard.view', 'View Dashboard', 'Access the dashboard', 'dashboard', 'view'],
			['users.list', 'List Users', 'View user list', 'users', 'list'],
			['users.read', 'Read User', 'View user details', 'users', 'read'],
			['users.create', 'Create User', 'Create new users', 'users', 'create'],
			['users.update', 'Update User', 'Update user details', 'users', 'update'],
			['users.delete', 'Delete User', 'Delete users', 'users', 'delete'],
			['users.manage', 'Manage All Users', 'Full user management access', 'users', 'manage'],
			['profile.view', 'View Own Profile', 'View own profile', 'profile', 'view'],
			['profile.update', 'Update Own Profile', 'Update own profile', 'profile', 'update'],
			['providers.list', 'List Providers', 'View provider list', 'providers', 'list'],
			['providers.read', 'Read Provider', 'View provider details', 'providers', 'read'],
			['providers.verify', 'Verify Provider', 'Approve or verify providers', 'providers', 'verify'],
			['providers.manage', 'Manage Providers', 'Full provider management', 'providers', 'manage'],
			['provider_profile.view', 'View Provider Profile', 'View own provider profile', 'provider_profile', 'view'],
			['provider_profile.update', 'Update Provider Profile', 'Update own provider profile', 'provider_profile', 'update'],
			['provider_services.manage', 'Manage Provider Services', 'Manage own services offered', 'provider_services', 'manage'],
			['provider_availability.manage', 'Manage Availability', 'Manage own availability schedule', 'provider_availability', 'manage'],
			['provider_portfolio.manage', 'Manage Portfolio', 'Manage portfolio items', 'provider_portfolio', 'manage'],
			['provider_documents.manage', 'Manage Documents', 'Manage provider documents', 'provider_documents', 'manage'],
			['requests.create', 'Create Request', 'Create service requests', 'requests', 'create'],
			['requests.read', 'Read Requests', 'View service requests', 'requests', 'read'],
			['requests.update', 'Update Request', 'Update own service requests', 'requests', 'update'],
			['requests.delete', 'Delete Request', 'Delete own service requests', 'requests', 'delete'],
			['requests.browse', 'Browse Requests', 'Browse available requests', 'requests', 'browse'],
			['requests.manage', 'Manage All Requests', 'Manage any service request', 'requests', 'manage'],
			['requests.view_stats', 'View Request Stats', 'View request statistics', 'requests', 'view_stats'],
			['categories.read', 'Read Categories', 'View service categories', 'categories', 'read'],
			['categories.manage', 'Manage Categories', 'Create/update/delete categories', 'categories', 'manage'],
			['proposals.create', 'Create Proposal', 'Submit proposals', 'proposals', 'create'],
			['proposals.read', 'Read Proposals', 'View proposals', 'proposals', 'read'],
			['proposals.update', 'Update Proposal', 'Update own proposals', 'proposals', 'update'],
			['proposals.accept', 'Accept Proposal', 'Accept proposals on own requests', 'proposals', 'accept'],
			['proposals.manage', 'Manage All Proposals', 'Manage any proposal', 'proposals', 'manage'],
			['jobs.create', 'Create Job', 'Create jobs from accepted proposals', 'jobs', 'create'],
			['jobs.read', 'Read Jobs', 'View job details', 'jobs', 'read'],
			['jobs.update_status', 'Update Job Status', 'Start/complete jobs', 'jobs', 'update_status'],
			['jobs.manage', 'Manage All Jobs', 'Manage any job', 'jobs', 'manage'],
			['jobs.view_stats', 'View Job Stats', 'View job statistics', 'jobs', 'view_stats'],
			['reviews.create', 'Create Review', 'Submit reviews', 'reviews', 'create'],
			['reviews.read', 'Read Reviews', 'View reviews', 'reviews', 'read'],
			['reviews.update', 'Update Review', 'Update own reviews', 'reviews', 'update'],
			['reviews.delete', 'Delete Review', 'Delete reviews', 'reviews', 'delete'],
			['reviews.manage', 'Manage All Reviews', 'Manage any review', 'reviews', 'manage'],
			['favorites.manage', 'Manage Favorites', 'Add/remove favorites', 'favorites', 'manage'],
			['payments.create', 'Create Payment', 'Make payments', 'payments', 'create'],
			['payments.read', 'Read Own Payments', 'View own payment history', 'payments', 'read'],
			['payments.manage', 'Manage All Payments', 'View and manage all payments', 'payments', 'manage'],
			['payments.view_stats', 'View Payment Stats', 'View payment statistics', 'payments', 'view_stats'],
			['refunds.create', 'Request Refund', 'Request refunds', 'refunds', 'create'],
			['refunds.manage', 'Manage Refunds', 'Manage all refunds', 'refunds', 'manage'],
			['subscriptions.manage', 'Manage Subscriptions', 'Manage own subscriptions', 'subscriptions', 'manage'],
			['earnings.view', 'View Earnings', 'View own earning reports', 'earnings', 'view'],
			['earnings.manage', 'Manage All Earnings', 'View and manage all earnings', 'earnings', 'manage'],
			['coupons.manage', 'Manage Coupons', 'Create/update/delete coupons', 'coupons', 'manage'],
			['notifications.view', 'View Notifications', 'View own notifications', 'notifications', 'view'],
			['notifications.manage', 'Manage Notifications', 'Manage all notifications', 'notifications', 'manage'],
			['messages.send', 'Send Messages', 'Send messages in conversations', 'messages', 'send'],
			['messages.read', 'Read Messages', 'Read own messages', 'messages', 'read'],
			['messages.manage', 'Manage All Messages', 'Manage any message', 'messages', 'manage'],
			['disputes.file', 'File Dispute', 'File a dispute', 'disputes', 'file'],
			['disputes.read', 'Read Disputes', 'View own disputes', 'disputes', 'read'],
			['disputes.manage', 'Manage All Disputes', 'Manage and resolve disputes', 'disputes', 'manage'],
			['disputes.view_stats', 'View Dispute Stats', 'View dispute statistics', 'disputes', 'view_stats'],
			['analytics.view', 'View Analytics', 'View platform analytics', 'analytics', 'view'],
			['analytics.manage', 'Manage Analytics', 'Full analytics access and export', 'analytics', 'manage'],
			['audit.view', 'View Audit Logs', 'View audit logs', 'audit', 'view'],
			['audit.manage', 'Manage Audit Logs', 'Full audit log management', 'audit', 'manage'],
			['admin.access', 'Admin Panel Access', 'Access the admin panel', 'admin', 'access'],
			['admin.contact_view', 'View Contact Submissions', 'View contact form submissions', 'admin', 'contact_view'],
			['settings.manage', 'Manage System Settings', 'Manage platform settings', 'settings', 'manage'],
			['roles.read', 'Read Roles', 'View roles and permissions', 'roles', 'read'],
			['roles.manage', 'Manage Roles', 'Create/update/delete roles and assign permissions', 'roles', 'manage'],
			['infrastructure.events', 'Manage Events', 'View and manage system events', 'infrastructure', 'events'],
			['infrastructure.jobs', 'Manage Background Jobs', 'View and manage background jobs', 'infrastructure', 'jobs'],
			['infrastructure.rate_limits', 'Manage Rate Limits', 'Configure rate limits', 'infrastructure', 'rate_limits'],
			['infrastructure.feature_flags', 'Manage Feature Flags', 'Toggle feature flags', 'infrastructure', 'feature_flags'],
		];
		for (const [name, displayName, description, resource, action] of permissions) {
			await safeInsert(
				`INSERT INTO permissions (id, name, display_name, description, resource, action) VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5) ON CONFLICT (name) DO NOTHING`,
				[name, displayName, description, resource, action],
			);
		}

		// --- Role-Permission assignments ---
		// Admin gets ALL permissions
		await safeInsert(
			`INSERT INTO role_permissions (role_id, permission_id, created_at)
			 SELECT r.id, p.id, now()
			 FROM roles r CROSS JOIN permissions p
			 WHERE r.name = 'admin'
			 ON CONFLICT DO NOTHING`,
			[],
		);

		// Customer permissions
		const customerPerms = [
			'dashboard.view', 'profile.view', 'profile.update',
			'providers.list', 'providers.read', 'categories.read',
			'requests.create', 'requests.read', 'requests.update', 'requests.delete',
			'proposals.read', 'proposals.accept',
			'jobs.create', 'jobs.read',
			'reviews.create', 'reviews.read', 'reviews.update',
			'favorites.manage',
			'payments.create', 'payments.read',
			'refunds.create',
			'notifications.view',
			'messages.send', 'messages.read',
			'disputes.file', 'disputes.read',
		];
		await safeInsert(
			`INSERT INTO role_permissions (role_id, permission_id, created_at)
			 SELECT r.id, p.id, now()
			 FROM roles r CROSS JOIN permissions p
			 WHERE r.name = 'customer' AND p.name = ANY($1::text[])
			 ON CONFLICT DO NOTHING`,
			[customerPerms],
		);

		// Provider permissions
		const providerPerms = [
			'dashboard.view', 'profile.view', 'profile.update',
			'providers.read', 'categories.read',
			'provider_profile.view', 'provider_profile.update',
			'provider_services.manage', 'provider_availability.manage',
			'provider_portfolio.manage', 'provider_documents.manage',
			'requests.read', 'requests.browse',
			'proposals.create', 'proposals.read', 'proposals.update',
			'jobs.read', 'jobs.update_status',
			'reviews.read',
			'earnings.view',
			'subscriptions.manage',
			'notifications.view',
			'messages.send', 'messages.read',
			'disputes.file', 'disputes.read',
			'payments.read',
		];
		await safeInsert(
			`INSERT INTO role_permissions (role_id, permission_id, created_at)
			 SELECT r.id, p.id, now()
			 FROM roles r CROSS JOIN permissions p
			 WHERE r.name = 'provider' AND p.name = ANY($1::text[])
			 ON CONFLICT DO NOTHING`,
			[providerPerms],
		);

		console.log("   ✓ RBAC roles, permissions, and assignments seeded");
	}

	async seedUsers() {
		console.log("👥 Seeding users...");
		const hashedPassword = await bcrypt.hash(DEFAULT_SEED_PASSWORD, 10);
		let created = 0;

		// Create 1 admin
		const adminId = uuid();
		const adminEmail = this.nextEmail();
		await safeInsert(
			`INSERT INTO users (id, display_id, email, name, phone, password_hash, role, role_id, email_verified, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, (SELECT id FROM roles WHERE name = $7), $8, $9)
       ON CONFLICT (email) DO NOTHING`,
			[adminId, displayId('USR'), adminEmail, "Kishor Admin", "+91 98765 43210", hashedPassword, "admin", true, "active"],
		);
		const existingAdmin = await safeQuery("SELECT id FROM users WHERE email = $1", [adminEmail]);
		if (existingAdmin.rows.length > 0) {
			const actualAdminId = existingAdmin.rows[0].id;
			this.adminIds.push(actualAdminId);
			this.userIds.push(actualAdminId);
			this.userEmailMap.set(actualAdminId, adminEmail);
			created++;
		}

		// Second admin
		const admin2Email = this.nextEmail();
		const admin2Id = uuid();
		await safeInsert(
			`INSERT INTO users (id, display_id, email, name, phone, password_hash, role, role_id, email_verified, phone_verified, timezone, language, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, (SELECT id FROM roles WHERE name = $7), $8, $9, $10, $11, $12)
       ON CONFLICT (email) DO NOTHING`,
			[
				admin2Id,
				displayId('USR'),
				admin2Email,
				"Kishor Support",
				"+91 98765 43211",
				hashedPassword,
				"admin",
				true,
				true,
				"UTC",
				"en",
				"active",
			],
		);
		const existingAdmin2 = await safeQuery("SELECT id FROM users WHERE email = $1", [admin2Email]);
		if (existingAdmin2.rows.length > 0) {
			const actualAdmin2Id = existingAdmin2.rows[0].id;
			this.adminIds.push(actualAdmin2Id);
			this.userIds.push(actualAdmin2Id);
			this.userEmailMap.set(actualAdmin2Id, admin2Email);
		}

		// Create 200 customers
		for (let i = 0; i < 200; i++) {
			const id = uuid();
			const firstName = randomPick(indianFirstNames);
			const lastName = randomPick(indianLastNames);
			const email = this.nextEmail();

			await safeInsert(
				`INSERT INTO users (id, display_id, email, name, phone, password_hash, role, role_id, email_verified, phone_verified, profile_picture_url, timezone, language, last_login_at, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, (SELECT id FROM roles WHERE name = $7), $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (email) DO NOTHING`,
				[
					id,
					displayId('USR'),
					email,
					`${firstName} ${lastName}`,
					`+91${randomInt(6000000000, 9999999999)}`,
					hashedPassword,
					"customer",
					randomInt(0, 1) === 1,
					randomInt(0, 1) === 1,
					faker.image.avatar(),
					'Asia/Kolkata',
					"en",
					randomDate(new Date(2024, 0, 1), new Date()),
					randomPick(["active", "active", "active", "suspended"]),
				],
			);

			// Always check if the user exists (whether inserted or already existed)
			const existingCustomer = await safeQuery("SELECT id FROM users WHERE email = $1", [email]);
			if (existingCustomer.rows.length > 0) {
				const actualCustomerId = existingCustomer.rows[0].id;
				this.customerIds.push(actualCustomerId);
				this.userIds.push(actualCustomerId);
				this.userEmailMap.set(actualCustomerId, email);
				created++;
			}
		}

		// Create 120 providers
		for (let i = 0; i < 120; i++) {
			const id = uuid();
			const firstName = randomPick(indianFirstNames);
			const lastName = randomPick(indianLastNames);
			const email = this.nextEmail();

			await safeInsert(
				`INSERT INTO users (id, display_id, email, name, phone, password_hash, role, role_id, email_verified, phone_verified, profile_picture_url, timezone, language, last_login_at, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, (SELECT id FROM roles WHERE name = $7), $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (email) DO NOTHING`,
				[
					id,
					displayId('USR'),
					email,
					`${firstName} ${lastName}`,
					`+91${randomInt(6000000000, 9999999999)}`,
					hashedPassword,
					"provider",
					true,
					true,
					faker.image.avatar(),
					'Asia/Kolkata',
					"en",
					randomDate(new Date(2024, 0, 1), new Date()),
					"active",
				],
			);

			// Always check if the user exists (whether inserted or already existed)
			const existingProvider = await safeQuery("SELECT id FROM users WHERE email = $1", [email]);
			if (existingProvider.rows.length > 0) {
				const actualProviderId = existingProvider.rows[0].id;
				this.providerIds.push(actualProviderId);
				this.userIds.push(actualProviderId);
				this.userEmailMap.set(actualProviderId, email);
				created++;
			}
		}

		console.log(
			`   ✓ Created ${created} users (${this.customerIds.length} customers, ${this.providerIds.length} providers, ${this.adminIds.length} admins)`,
		);

		// Backfill role_id from users.role → roles.name
		await safeInsert(
			`UPDATE users u SET role_id = r.id FROM roles r WHERE u.role = r.name AND u.role_id IS NULL`,
			[],
		);
		console.log("   ✓ Backfilled users.role_id from RBAC roles");
	}

	async seedSessions() {
		console.log("🔐 Seeding sessions...");
		let count = 0;

		for (let i = 0; i < 300; i++) {
			if (this.userIds.length === 0) break;

			const success = await safeInsert(
				`INSERT INTO sessions (id, display_id, user_id, refresh_token, ip_address, user_agent, device_type, location, expires_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (refresh_token) WHERE refresh_token IS NOT NULL DO UPDATE SET expires_at = EXCLUDED.expires_at`,
				[
					uuid(),
					displayId('SES'),
					randomPick(this.userIds),
					crypto.randomBytes(32).toString("hex"),
					faker.internet.ip(),
					faker.internet.userAgent(),
					randomPick(["desktop", "mobile", "tablet"]),
					faker.location.city(),
					new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
				],
			);

			if (success) count++;
		}

		console.log(`   ✓ Created ${count} sessions`);
	}

	async seedLoginAttempts() {
		console.log("🔑 Seeding login attempts...");
		let count = 0;

		for (let i = 0; i < 600; i++) {
			if (this.userIds.length === 0) break;

			const userId = randomPick(this.userIds);
			const email = this.userEmailMap.get(userId) || faker.internet.email();

			const success = await safeInsert(
				`INSERT INTO login_attempts (id, email, ip_address, user_agent, location, success, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
				[
					uuid(),
					email,
					faker.internet.ip(),
					faker.internet.userAgent(),
					faker.location.city(),
					randomInt(0, 10) > 2,
					randomDate(new Date(2024, 0, 1), new Date()),
				],
			);

			if (success) count++;
		}

		console.log(`   ✓ Created ${count} login attempts`);
	}

	async seedEmailVerificationTokens() {
		console.log("📧 Seeding email verification tokens...");
		let count = 0;
		const unverifiedUsers = await safeQuery(`SELECT id FROM users WHERE email_verified = false LIMIT 100`);
		for (const user of unverifiedUsers.rows) {
			const success = await safeInsert(
				`INSERT INTO email_verification_tokens (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)
         ON CONFLICT (token) DO UPDATE SET expires_at = EXCLUDED.expires_at`,
				[uuid(), user.id, crypto.randomBytes(32).toString("hex"), new Date(Date.now() + 24 * 60 * 60 * 1000)],
			);
			if (success) count++;
		}
		console.log(`   ✓ Created ${count} email verification tokens`);
	}

	async seedPasswordResetTokens() {
		console.log("🔑 Seeding password reset tokens...");
		let count = 0;
		for (const userId of this.userIds.slice(0, 30)) {
			if (randomInt(0, 3) === 0) {
				const success = await safeInsert(
					`INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)
         ON CONFLICT (token) DO UPDATE SET expires_at = EXCLUDED.expires_at`,
					[
						uuid(),
						userId,
						crypto.randomBytes(32).toString("hex"),
						new Date(Date.now() + randomInt(1, 24) * 60 * 60 * 1000),
					],
				);
				if (success) count++;
			}
		}
		console.log(`   ✓ Created ${count} password reset tokens`);
	}

	async seedLoginHistory() {
		console.log("📋 Seeding login history...");
		let count = 0;
		for (let i = 0; i < 800; i++) {
			if (this.userIds.length === 0) break;
			const isSuccess = randomInt(0, 10) > 1;
			const success = await safeInsert(
				`INSERT INTO login_history (id, user_id, ip_address, user_agent, location, device_type, success, failure_reason, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
				[
					uuid(),
					randomPick(this.userIds),
					faker.internet.ip(),
					faker.internet.userAgent(),
					faker.location.city(),
					randomPick(["desktop", "mobile", "tablet"]),
					isSuccess,
					isSuccess ? null : randomPick(["invalid_password", "account_suspended", "too_many_attempts"]),
					randomDate(new Date(2024, 0, 1), new Date()),
				],
			);
			if (success) count++;
		}
		console.log(`   ✓ Created ${count} login history records`);
	}

	async seedSocialAccounts() {
		console.log("🌐 Seeding social accounts...");
		let count = 0;
		const sampleUsers = randomPickMultiple(this.userIds, Math.min(80, this.userIds.length));
		for (const userId of sampleUsers) {
			if (randomInt(0, 1) === 1) {
				const success = await safeInsert(
					`INSERT INTO social_accounts (id, user_id, provider, provider_user_id, access_token)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (provider, provider_user_id) DO NOTHING`,
					[
						uuid(),
						userId,
						randomPick(["google", "facebook"]),
						crypto.randomBytes(10).toString("hex"),
						crypto.randomBytes(32).toString("hex"),
					],
				);
				if (success) count++;
			}
		}
		console.log(`   ✓ Created ${count} social accounts`);
	}

	async seedUserDevices() {
		console.log("📱 Seeding user devices...");
		let count = 0;
		for (let i = 0; i < 400; i++) {
			if (this.userIds.length === 0) break;
			const success = await safeInsert(
				`INSERT INTO user_devices (id, user_id, device_id, device_type, os, last_seen)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, device_id) DO NOTHING`,
				[
					uuid(),
					randomPick(this.userIds),
					crypto.randomBytes(16).toString("hex"),
					randomPick(["mobile", "tablet", "desktop"]),
					randomPick(["iOS", "Android", "Windows", "macOS", "Linux"]),
					randomDate(new Date(2024, 0, 1), new Date()),
				],
			);
			if (success) count++;
		}
		console.log(`   ✓ Created ${count} user devices`);
	}

	async seedProviders() {
		console.log("🏢 Seeding providers...");
		let count = 0;

		for (const userId of this.providerIds) {
			const id = uuid();
			await safeInsert(
				`INSERT INTO providers (id, display_id, user_id, business_name, description, profile_picture_url, rating, total_jobs_completed, years_of_experience, service_area_radius, response_time_avg, verification_status, certifications) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (user_id) DO NOTHING`,
				[
					id,
					displayId('PRV'),
					userId,
					randomPick(indianServiceBusinessNames),
					randomPick(providerBios),
					faker.image.url(),
					parseFloat((Math.random() * 2 + 3).toFixed(2)),
					randomInt(0, 200),
					randomInt(1, 25),
					randomInt(10, 50),
					randomInt(30, 180),
					randomPick(["pending", "verified", "verified", "verified"]),
					JSON.stringify([{ name: faker.lorem.words(3), issuer: randomPick(indianServiceBusinessNames), year: randomInt(2018, 2024) }]),
				],
			);
			const existing = await safeQuery("SELECT id FROM providers WHERE user_id = $1", [userId]);
			if (existing.rows.length > 0) {
				const actualId = existing.rows[0].id;
				if (!this.providerRecordIds.includes(actualId)) {
					this.providerRecordIds.push(actualId);
					this.providerUserMap.set(actualId, userId);
					count++;
				}
			}
		}

		console.log(`   ✓ Created ${count} providers`);
	}

	async seedProviderServices() {
		console.log("🔧 Seeding provider services...");
		let count = 0;

		for (const providerId of this.providerRecordIds) {
			const numServices = randomInt(1, 5);
			const selectedCategories = randomPickMultiple(this.categoryIds, numServices);

			for (const categoryId of selectedCategories) {
				const success = await safeInsert(
					`INSERT INTO provider_services (id, provider_id, category_id) 
           VALUES ($1, $2, $3)
           ON CONFLICT (provider_id, category_id) DO NOTHING`,
					[uuid(), providerId, categoryId],
				);

				if (success) count++;
			}
		}

		console.log(`   ✓ Created ${count} provider service mappings`);
	}

	async seedProviderAvailability() {
		console.log("📅 Seeding provider availability...");
		let count = 0;

		for (const providerId of this.providerRecordIds) {
			// Most providers work Mon-Fri
			for (let day = 1; day <= 5; day++) {
				const success = await safeInsert(
					`INSERT INTO provider_availability (id, provider_id, day_of_week, start_time, end_time) 
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (provider_id, day_of_week) DO NOTHING`,
					[uuid(), providerId, day, "09:00:00", "17:00:00"],
				);

				if (success) count++;
			}

			// Some also work weekends
			if (randomInt(0, 1) === 1) {
				const success = await safeInsert(
					`INSERT INTO provider_availability (id, provider_id, day_of_week, start_time, end_time) 
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (provider_id, day_of_week) DO NOTHING`,
					[uuid(), providerId, 6, "10:00:00", "14:00:00"],
				);

				if (success) count++;
			}
		}

		console.log(`   ✓ Created ${count} availability slots`);
	}

	async seedProviderPortfolio() {
		console.log("🖼️ Seeding provider portfolio...");
		let count = 0;

		for (const providerId of this.providerRecordIds) {
			const numItems = randomInt(2, 8);

			for (let i = 0; i < numItems; i++) {
				const success = await safeInsert(
					`INSERT INTO provider_portfolio (id, provider_id, title, description, image_url, display_order) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
					[uuid(), providerId, faker.lorem.words(3), faker.lorem.sentence(), faker.image.url(), i],
				);

				if (success) count++;
			}
		}

		console.log(`   ✓ Created ${count} portfolio items`);
	}

	async seedProviderDocuments() {
		console.log("📄 Seeding provider documents...");
		let count = 0;
		const docTypes = ["government_id", "business_license", "insurance_certificate", "certification", "tax_document"];
		const adminId = this.adminIds.length > 0 ? this.adminIds[0] : null;

		for (const providerId of this.providerRecordIds) {
			const numDocs = randomInt(2, 4);
			const selectedTypes = randomPickMultiple(docTypes, numDocs);
			for (const docType of selectedTypes) {
				const isVerified = randomInt(0, 10) > 3;
				const isRejected = !isVerified && randomInt(0, 1) === 1;
				const success = await safeInsert(
					`INSERT INTO provider_documents (id, provider_id, document_type, document_url, document_name, document_number, verified, rejected, rejection_reason, verified_by, verified_at, expires_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
					[
						uuid(),
						providerId,
						docType,
						faker.internet.url(),
						`${docType.replace(/_/g, "-")}-${crypto.randomBytes(4).toString("hex").toUpperCase()}.pdf`,
						crypto.randomBytes(5).toString("hex").toUpperCase(),
						isVerified,
						isRejected,
						isRejected ? faker.lorem.sentence() : null,
						isVerified && adminId ? adminId : null,
						isVerified ? randomDate(new Date(2024, 0, 1), new Date()) : null,
						new Date(Date.now() + randomInt(180, 1095) * 24 * 60 * 60 * 1000),
					],
				);
				if (success) count++;
			}
		}

		console.log(`   ✓ Created ${count} documents`);
	}

	async seedLocations() {
		console.log("📍 Seeding locations...");
		let count = 0;

		for (let i = 0; i < 450; i++) {
			const city = randomPick(cities);
			const id = uuid();
			const userId = randomInt(0, 1) === 1 && this.userIds.length > 0 ? randomPick(this.userIds) : null;

			const success = await safeInsert(
				`INSERT INTO locations (id, display_id, user_id, latitude, longitude, address, city, state, zip_code, country) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
				[
					id,
					displayId('LOC'),
					userId,
					city.lat + (Math.random() - 0.5) * 0.2,
					city.lng + (Math.random() - 0.5) * 0.2,
					faker.location.streetAddress(),
					city.name,
					city.state,
					`${randomInt(100000, 999999)}`,
					"IN",
				],
			);

			if (success) {
				this.locationIds.push(id);
				this.locationCityMap.set(id, city.name);
				count++;
			}
		}

		console.log(`   ✓ Created ${count} locations`);
	}

	async seedServiceRequests() {
		console.log("📝 Seeding service requests...");
		const statuses = ["open", "assigned", "completed", "cancelled"];
		const urgencies = ["low", "medium", "high", "urgent"];
		const isAnonymous = false; // set true to seed guest/anonymous requests instead
		let count = 0;

		for (let i = 0; i < 500; i++) {
			if (this.categoryIds.length === 0 || this.locationIds.length === 0) break;

			const id = uuid();
			// Enforce check_user_or_guest: either userId OR all 3 guest fields must be present
			let userId = null;
			let guestName = null;
			let guestEmail = null;
			let guestPhone = null;
			if (isAnonymous || this.customerIds.length === 0) {
				guestName = faker.person.fullName();
				guestEmail = uniqueEmail(faker.person.firstName(), faker.person.lastName());
				guestPhone = `+91${randomInt(6000000000, 9999999999)}`;
			} else {
				userId = randomPick(this.customerIds);
			}
			const categoryId = randomPick(this.categoryIds);
			const locationId = randomPick(this.locationIds);
			const catName = this.categoryNameMap.get(categoryId) || 'default';
			const reqDesc = randomPick(requestDescriptionsByCategory[catName] || requestDescriptionsByCategory['default']);

			const success = await safeInsert(
				`INSERT INTO service_requests (id, display_id, user_id, category_id, location_id, description, budget, images, preferred_date, urgency, expiry_date, view_count, status, guest_name, guest_email, guest_phone, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
				[
					id,
					displayId('REQ'),
					userId,
					categoryId,
					locationId,
					reqDesc,
					randomInt(50, 5000) * 100,
					JSON.stringify([faker.image.url(), faker.image.url()]),
					randomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
					randomPick(urgencies),
					new Date(Date.now() + randomInt(7, 30) * 24 * 60 * 60 * 1000),
					randomInt(0, 100),
					randomPick(statuses),
					guestName,
					guestEmail,
					guestPhone,
					randomDate(new Date(2024, 0, 1), new Date()),
				],
			);

			if (success) {
				this.requestIds.push(id);
				this.requestDetailsMap.set(id, { userId, categoryId });
				count++;

				// Search index with real category name and city
				const categoryName = this.categoryNameMap.get(categoryId) || "Service";
				const cityName = this.locationCityMap.get(locationId) || "Location";
				await safeInsert(
					`INSERT INTO service_request_search (request_id, category, location, description) 
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (request_id) DO NOTHING`,
					[id, categoryName, cityName, reqDesc],
				);
			}
		}

		console.log(`   ✓ Created ${count} service requests`);
	}

	async seedProposals() {
		console.log("💼 Seeding proposals...");
		const statuses = ["pending", "accepted", "rejected", "withdrawn"];
		let count = 0;

		for (let i = 0; i < 1200; i++) {
			if (this.requestIds.length === 0 || this.providerRecordIds.length === 0) break;

			const id = uuid();
			const status = randomPick(statuses);
			const requestId = randomPick(this.requestIds);
			const providerId = randomPick(this.providerRecordIds);
			const startDate = randomDate(new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
			const completionDate = randomDate(startDate, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

			const success = await safeInsert(
				`INSERT INTO proposals (id, display_id, request_id, provider_id, price, message, estimated_hours, start_date, completion_date, rejected_reason, status, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT DO NOTHING`,
				[
					id,
					displayId('PRP'),
					requestId,
					providerId,
					randomInt(50, 5000) * 100,
					randomPick(proposalMessages),
					randomInt(1, 40),
					startDate,
					completionDate,
					status === "rejected" ? randomPick(disputeReasons) : null,
					status,
					randomDate(new Date(2024, 0, 1), new Date()),
				],
			);

			if (success) {
				this.proposalIds.push(id);
				if (status === "accepted") {
					this.acceptedProposals.push({ id, requestId, providerId });
				}
				count++;
			}
		}

		console.log(`   ✓ Created ${count} proposals (${this.acceptedProposals.length} accepted)`);
	}

	async seedJobs() {
		console.log("👷 Seeding jobs...");
		const statuses = ["pending", "scheduled", "in_progress", "completed", "cancelled", "disputed"];
		let count = 0;

		for (const proposal of this.acceptedProposals.slice(0, 200)) {
			if (this.customerIds.length === 0) break;
			const id = uuid();
			// Use request's actual customer instead of random
			const requestDetails = this.requestDetailsMap.get(proposal.requestId);
			const customerId = requestDetails?.userId || randomPick(this.customerIds);
			const providerUserId = this.providerUserMap.get(proposal.providerId) || null;
			const status = randomPick(statuses);
			const createdAt = randomDate(new Date(2024, 0, 1), new Date());
			const startedAt = (status !== "scheduled" && status !== "pending") ? randomDate(createdAt, new Date()) : null;
			const completedAt = status === "completed" && startedAt ? randomDate(startedAt, new Date()) : null;

			const success = await safeInsert(
				`INSERT INTO jobs (id, display_id, request_id, provider_id, customer_id, proposal_id, actual_amount, cancelled_by, cancellation_reason, status, started_at, completed_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
				[
					id,
					displayId('JOB'),
					proposal.requestId,
					proposal.providerId,
					customerId,
					proposal.id,
					randomInt(50, 5000) * 100,
					status === "cancelled" ? customerId : null,
					status === "cancelled" ? faker.lorem.sentence() : null,
					status,
					startedAt,
					completedAt,
					createdAt,
				],
			);
			if (success) {
				this.jobIds.push(id);
				this.jobDetailsMap.set(id, { customerId, providerUserId, providerId: proposal.providerId });
				count++;
			}
		}

		const extraNeeded = Math.max(0, 400 - count);
		if (extraNeeded > 0 && this.requestIds.length > 0 && this.providerRecordIds.length > 0 && this.customerIds.length > 0) {
			// Only use requests that don't already have an active (non-cancelled/disputed) job
			// to avoid violating idx_jobs_request_unique ON jobs(request_id) WHERE status NOT IN ('cancelled','disputed')
			const availableReqs = await safeQuery(
				`SELECT id FROM service_requests WHERE id NOT IN (
					SELECT request_id FROM jobs WHERE status NOT IN ('cancelled','disputed')
				) ORDER BY RANDOM() LIMIT $1`,
				[extraNeeded * 3],
			);
			const reqPool = availableReqs.rows.map((r) => r.id);
			// If all requests are occupied, we can still seed extra jobs with safe statuses
			// that don't violate the partial unique index (cancelled/disputed are exempt)
			const safeStatuses = ['cancelled', 'disputed'];
			const useAnyRequest = reqPool.length === 0;
			const effectivePool = useAnyRequest ? this.requestIds : reqPool;

			for (let i = 0; i < extraNeeded && i < effectivePool.length; i++) {
				const id = uuid();
				const customerId = randomPick(this.customerIds);
				const providerId = randomPick(this.providerRecordIds);
				const providerUserId = this.providerUserMap.get(providerId) || null;
				// If forced to reuse occupied requests, only use statuses exempt from the unique constraint
				const status = useAnyRequest ? randomPick(safeStatuses) : randomPick(statuses);
				const createdAt = randomDate(new Date(2024, 0, 1), new Date());
				const startedAt = (status !== "scheduled" && status !== "pending") ? randomDate(createdAt, new Date()) : null;
				const completedAt = status === "completed" && startedAt ? randomDate(startedAt, new Date()) : null;

				const success = await safeInsert(
					`INSERT INTO jobs (id, display_id, request_id, provider_id, customer_id, actual_amount, cancelled_by, cancellation_reason, status, started_at, completed_at, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
					[
						id,
						displayId('JOB'),
						effectivePool[i],
						providerId,
						customerId,
						randomInt(50, 5000) * 100,
						status === "cancelled" ? customerId : null,
						status === "cancelled" ? faker.lorem.sentence() : null,
						status,
						startedAt,
						completedAt,
						createdAt,
					],
				);

				if (success) {
					this.jobIds.push(id);
					this.jobDetailsMap.set(id, { customerId, providerUserId, providerId });
					count++;
				}
			}
		}

		console.log(`   ✓ Created ${count} jobs`);
	}

	async seedPaymentWebhooks() {
		console.log("🔔 Seeding payment webhooks...");
		let count = 0;
		const gateways = ["razorpay", "stripe", "paypal"];
		const eventTypes = ["payment.completed", "payment.failed", "refund.created", "subscription.cancelled"];
		for (let i = 0; i < 200; i++) {
			const externalId = crypto.randomBytes(8).toString("hex").toUpperCase();
			const isProcessed = randomInt(0, 10) > 2;
			const success = await safeInsert(
				`INSERT INTO payment_webhooks (id, gateway, payload, processed, event_type, external_id, created_at, processed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
				[
					uuid(),
					randomPick(gateways),
					JSON.stringify({ data: { id: externalId, amount: randomInt(50, 5000) * 100 }, event: "webhook" }),
					isProcessed,
					randomPick(eventTypes),
					externalId,
					randomDate(new Date(2024, 0, 1), new Date()),
					isProcessed ? randomDate(new Date(2024, 0, 1), new Date()) : null,
				],
			);
			if (success) count++;
		}
		console.log(`   ✓ Created ${count} payment webhooks`);
	}

	async seedPayments() {
		console.log("💳 Seeding payments...");
		const statuses = ["pending", "completed", "failed"];
		let count = 0;

		// Only create payments for jobs that don't already have one (re-run safety + consistent FK references)
		const payableJobs = await safeQuery(
			`SELECT j.id, j.customer_id, j.provider_id FROM jobs j
			 WHERE j.status NOT IN ('cancelled', 'disputed')
			 AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.job_id = j.id)`,
		);

		for (const job of payableJobs.rows) {
			const id = uuid();
			const amount = randomInt(50, 5000) * 100;
			const platformFee = Math.floor(amount * 0.15);
			const providerAmount = amount - platformFee;
			const status = randomPick(statuses);

			const success = await safeInsert(
				`INSERT INTO payments (id, display_id, job_id, user_id, provider_id, amount, platform_fee, provider_amount, currency, payment_method, gateway, status, transaction_id, created_at, paid_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
				[
					id,
					displayId('PAY'),
					job.id,
					job.customer_id,
					job.provider_id,
					amount,
					platformFee,
					providerAmount,
					"INR",
					randomPick(["card", "upi", "netbanking"]),
					"razorpay",
					status,
					crypto.randomBytes(8).toString("hex").toUpperCase(),
					randomDate(new Date(2024, 0, 1), new Date()),
					status === "completed" ? randomDate(new Date(2024, 0, 1), new Date()) : null,
				],
			);

			if (success) {
				this.paymentIds.push(id);
				count++;
			}
		}

		console.log(`   ✓ Created ${count} payments`);
	}

	async seedRefunds() {
		console.log("💰 Seeding refunds...");
		let count = 0;

		const refundablePayments = await safeQuery(
			`SELECT id, amount FROM payments WHERE status IN ('failed', 'completed') LIMIT 200`,
		);

		for (const payment of refundablePayments.rows) {
			if (randomInt(0, 10) < 3) {
				// 30% chance of refund
				const refundMultiplier = randomPick([0.5, 0.75, 1.0]);
				const refundAmount = Math.max(1, Math.floor(payment.amount * refundMultiplier));
				const success = await safeInsert(
					`INSERT INTO refunds (id, display_id, payment_id, amount, status, reason) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
					[
						uuid(),
						displayId('RFD'),
						payment.id,
						refundAmount,
						randomPick(["pending", "completed", "failed"]),
						randomPick([
							"Service not completed as described",
							"Provider no-show",
							"Quality not acceptable",
							"Customer cancelled",
							faker.lorem.sentence(),
						]),
					],
				);
				if (success) count++;
			}
		}

		console.log(`   ✓ Created ${count} refunds`);
	}

	async seedReviews() {
		console.log("⭐ Seeding reviews...");
		let count = 0;

		const completedJobs = await safeQuery(
			`SELECT id, customer_id, provider_id FROM jobs WHERE status = 'completed' LIMIT 300`,
		);

		for (const job of completedJobs.rows) {
			if (randomInt(0, 10) < 8) {
				const rating = randomInt(1, 5);
				const hasResponse = rating >= 4 && randomInt(0, 1) === 1;
				const reviewCreatedAt = randomDate(new Date(2024, 0, 1), new Date());
				const success = await safeInsert(
					`INSERT INTO reviews (id, display_id, job_id, user_id, provider_id, rating, comment, response, response_at, helpful_count, verified_purchase, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (job_id, user_id) DO NOTHING`,
					[
						uuid(),
						displayId('REV'),
						job.id,
						job.customer_id,
						job.provider_id,
						rating,
						randomPick(reviewCommentsByRating[rating] || reviewCommentsByRating[3]),
						hasResponse ? randomPick(providerResponses) : null,
						hasResponse ? randomDate(reviewCreatedAt, new Date()) : null,
						randomInt(0, 20),
						true,
						reviewCreatedAt,
					],
				);

				if (success) count++;
			}
		}

		console.log(`   ✓ Created ${count} reviews`);
	}

	async seedReviewHelpfulVotes() {
		console.log("👍 Seeding review helpful votes...");
		let count = 0;

		// Fetch reviews that have a non-zero helpful_count so the votes back them up
		const reviews = await safeQuery(
			`SELECT id, helpful_count FROM reviews WHERE helpful_count > 0 LIMIT 500`,
		);

		const allUserIds = [...this.userIds];
		if (allUserIds.length === 0) return;

		for (const review of reviews.rows) {
			// Pick min(helpful_count, available users) distinct voters
			const votesNeeded = Math.min(review.helpful_count, allUserIds.length, 20);
			const voters = randomPickMultiple(allUserIds, votesNeeded);

			for (const userId of voters) {
				const ok = await safeInsert(
					`INSERT INTO review_helpful_votes (review_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
					[review.id, userId],
				);
				if (ok) count++;
			}
		}

		// Reconcile reviews.helpful_count to match actual vote rows (single-query update)
		await safeQuery(`
			UPDATE reviews r
			SET helpful_count = v.vote_count
			FROM (
				SELECT review_id, COUNT(*)::INT AS vote_count
				FROM review_helpful_votes
				GROUP BY review_id
			) v
			WHERE r.id = v.review_id
		`);

		console.log(`   ✓ Created ${count} review helpful votes`);
	}

	async seedMessages() {
		console.log("💬 Seeding messages...");
		let count = 0;

		for (const jobId of this.jobIds.slice(0, 250)) {
			const jobDetails = this.jobDetailsMap.get(jobId);
			const participants = jobDetails ? [jobDetails.customerId] : [];
			if (jobDetails && jobDetails.providerUserId) participants.push(jobDetails.providerUserId);
			if (participants.length === 0) continue;

			const numMessages = randomInt(3, 15);

			for (let i = 0; i < numMessages; i++) {
				const id = uuid();
				const isRead = randomInt(0, 1) === 1;

				const success = await safeInsert(
					`INSERT INTO messages (id, display_id, job_id, sender_id, message, read, read_at, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
					[
						id,
						displayId('MSG'),
						jobId,
						randomPick(participants),
						randomPick(conversationMessages),
						isRead,
						isRead ? randomDate(new Date(2024, 0, 1), new Date()) : null,
						randomDate(new Date(2024, 0, 1), new Date()),
					],
				);

				if (success) {
					this.messageIds.push(id);
					count++;
				}
			}
		}

		console.log(`   ✓ Created ${count} messages`);
	}

	async seedAttachments() {
		console.log("📎 Seeding attachments...");
		let count = 0;

		const messages = await safeQuery("SELECT id FROM messages ORDER BY RANDOM() LIMIT 500");

		for (const message of messages.rows) {
			if (randomInt(0, 10) < 3) {
				const success = await safeInsert(
					`INSERT INTO attachments (id, message_id, file_url, file_name, file_size, mime_type) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
					[
						uuid(),
						message.id,
						faker.internet.url(),
						faker.system.fileName(),
						randomInt(1000, 5000000),
						randomPick(["image/jpeg", "image/png", "application/pdf", "application/msword"]),
					],
				);

				if (success) count++;
			}
		}

		console.log(`   ✓ Created ${count} attachments`);
	}

	async seedNotifications() {
		console.log("🔔 Seeding notifications...");
		const types = [
			"request_created",
			"proposal_received",
			"job_started",
			"payment_completed",
			"review_received",
			"message_received",
		];
		let count = 0;

		for (let i = 0; i < 1200; i++) {
			if (this.userIds.length === 0) break;

			const success = await safeInsert(
				`INSERT INTO notifications (id, display_id, user_id, type, message, read, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
				[
					uuid(),
					displayId('NTF'),
					randomPick(this.userIds),
					randomPick(types),
					faker.lorem.sentence(),
					randomInt(0, 1) === 1,
					randomDate(new Date(2024, 0, 1), new Date()),
				],
			);

			if (success) count++;
		}

		console.log(`   ✓ Created ${count} notifications`);
	}

	async seedNotificationDeliveries() {
		console.log("📨 Seeding notification deliveries...");
		let count = 0;

		const notifications = await safeQuery("SELECT id FROM notifications LIMIT 800");

		for (const notification of notifications.rows) {
			const channels = randomPickMultiple(["email", "sms", "push"], randomInt(1, 3));

			for (const channel of channels) {
				const status = randomPick(["delivered", "failed", "pending"]);
				const success = await safeInsert(
					`INSERT INTO notification_deliveries (id, notification_id, channel, status, delivered_at) 
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (notification_id, channel) DO NOTHING`,
					[
						uuid(),
						notification.id,
						channel,
						status,
						status === "delivered" ? randomDate(new Date(2024, 0, 1), new Date()) : null,
					],
				);

				if (success) count++;
			}
		}

		console.log(`   ✓ Created ${count} notification deliveries`);
	}

	async seedFavorites() {
		console.log("❤️ Seeding favorites...");
		let count = 0;

		for (let i = 0; i < 400; i++) {
			if (this.customerIds.length === 0 || this.providerRecordIds.length === 0) break;

			const success = await safeInsert(
				`INSERT INTO favorites (id, user_id, provider_id) 
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, provider_id) DO NOTHING`,
				[uuid(), randomPick(this.customerIds), randomPick(this.providerRecordIds)],
			);

			if (success) count++;
		}

		console.log(`   ✓ Created ${count} favorites`);
	}

	async seedCoupons() {
		console.log("🎫 Seeding coupons...");
		let count = 0;
		const adminId = this.adminIds.length > 0 ? this.adminIds[0] : null;

		for (let i = 0; i < 180; i++) {
			const id = uuid();
			const code = i < realCouponCodes.length
				? realCouponCodes[i]
				: `PROMO${String(i - realCouponCodes.length + 1).padStart(3, '0')}`;

			await safeInsert(
				`INSERT INTO coupons (id, display_id, code, discount_percent, max_uses, max_uses_per_user, min_purchase_amount, active, created_by, expires_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (code) DO NOTHING`,
				[
					id,
					displayId('CPN'),
					code,
					randomInt(5, 50),
					randomInt(10, 1000),
					randomInt(1, 3),
					randomInt(0, 50) * 100,
					randomInt(0, 10) > 3, // 70% active
					adminId,
					new Date(Date.now() + randomInt(30, 365) * 24 * 60 * 60 * 1000),
				],
			);

			// Always check if the coupon exists (whether inserted or already existed)
			const existingCoupon = await safeQuery("SELECT id FROM coupons WHERE code = $1", [code]);
			if (existingCoupon.rows.length > 0) {
				const actualCouponId = existingCoupon.rows[0].id;
				this.couponIds.push(actualCouponId);
				count++;
			}
		}

		console.log(`   ✓ Created ${count} coupons`);
	}

	async seedCouponUsage() {
		console.log("🏷️ Seeding coupon usage...");
		let count = 0;

		for (let i = 0; i < 350; i++) {
			if (this.couponIds.length === 0 || this.userIds.length === 0) break;

			const success = await safeInsert(
				`INSERT INTO coupon_usage (id, coupon_id, user_id, used_at) 
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (coupon_id, user_id) DO NOTHING`,
				[uuid(), randomPick(this.couponIds), randomPick(this.userIds), randomDate(new Date(2024, 0, 1), new Date())],
			);

			if (success) count++;
		}

		console.log(`   ✓ Created ${count} coupon usage records`);
	}

	async seedDisputes() {
		console.log("⚖️ Seeding disputes...");
		let count = 0;

		const disputedJobs = await safeQuery(`SELECT id, customer_id FROM jobs WHERE status = 'disputed' LIMIT 120`);

		for (const job of disputedJobs.rows) {
			if (!job.customer_id) continue;
			const adminId = this.adminIds.length > 0 ? randomPick(this.adminIds) : null;
			const status = randomPick(["open", "investigating", "resolved", "closed"]);
			const isResolved = status === "resolved" || status === "closed";
			const success = await safeInsert(
				`INSERT INTO disputes (id, display_id, job_id, opened_by, reason, status, resolution, resolved_by, resolved_at, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
				[
					uuid(),
					displayId('DIS'),
					job.id,
					job.customer_id,
					randomPick(disputeReasons),
					status,
					isResolved ? randomPick(disputeResolutions) : null,
					isResolved && adminId ? adminId : null,
					isResolved ? randomDate(new Date(2024, 0, 1), new Date()) : null,
					randomDate(new Date(2024, 0, 1), new Date()),
				],
			);

			if (success) count++;
		}

		console.log(`   ✓ Created ${count} disputes`);
	}

	async seedAuditLogs() {
		console.log("📋 Seeding audit logs...");
		const actions = ["create", "update", "delete", "suspend", "verify"];
		const entities = ["user", "provider", "request", "job", "payment"];
		let count = 0;

		for (let i = 0; i < 800; i++) {
			const success = await safeInsert(
				`INSERT INTO audit_logs (id, user_id, action, entity, entity_id, metadata, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
				[
					uuid(),
					this.adminIds.length > 0 ? randomPick(this.adminIds) : randomPick(this.userIds),
					randomPick(actions),
					randomPick(entities),
					uuid(),
					JSON.stringify({ ip: faker.internet.ip(), changes: ["field1", "field2"] }),
					randomDate(new Date(2024, 0, 1), new Date()),
				],
			);

			if (success) count++;
		}

		console.log(`   ✓ Created ${count} audit logs`);
	}

	async seedUserActivityLogs() {
		console.log("📊 Seeding user activity logs...");
		const actions = ["login", "logout", "profile_update", "request_create", "proposal_submit", "payment_made"];
		let count = 0;

		for (let i = 0; i < 2000; i++) {
			if (this.userIds.length === 0) break;

			const success = await safeInsert(
				`INSERT INTO user_activity_logs (id, user_id, action, metadata, ip_address, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
				[
					uuid(),
					randomPick(this.userIds),
					randomPick(actions),
					JSON.stringify({ page: faker.internet.url(), duration: randomInt(1, 300) }),
					faker.internet.ip(),
					randomDate(new Date(2024, 0, 1), new Date()),
				],
			);

			if (success) count++;
		}

		console.log(`   ✓ Created ${count} user activity logs`);
	}

	async seedEvents() {
		console.log("📡 Seeding events...");
		const eventTypes = [
			"request.created",
			"proposal.submitted",
			"job.started",
			"payment.completed",
			"review.submitted",
		];
		let count = 0;

		for (let i = 0; i < 1200; i++) {
			const success = await safeInsert(
				`INSERT INTO events (id, display_id, event_type, payload, created_at) 
         VALUES ($1, $2, $3, $4, $5)`,
				[
					uuid(),
					displayId('EVT'),
					randomPick(eventTypes),
					JSON.stringify({
						entity_id: uuid(),
						user_id: this.userIds.length > 0 ? randomPick(this.userIds) : null,
						data: {},
					}),
					randomDate(new Date(2024, 0, 1), new Date()),
				],
			);

			if (success) count++;
		}

		console.log(`   ✓ Created ${count} events`);
	}

	async seedBackgroundJobs() {
		console.log("⚙️ Seeding background jobs...");
		const jobTypes = [
			"send_email",
			"send_sms",
			"process_payment",
			"generate_report",
			"cleanup_expired",
			"refresh_materialized_views",
		];
		const statuses = ["pending", "processing", "completed", "failed"];
		let count = 0;

		for (let i = 0; i < 600; i++) {
			const status = randomPick(statuses);
			const success = await safeInsert(
				`INSERT INTO background_jobs (id, display_id, job_type, payload, status, attempts, last_error, scheduled_for, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
				[
					uuid(),
					displayId('BGJ'),
					randomPick(jobTypes),
					JSON.stringify({ data: "sample", retryable: true }),
					status,
					randomInt(0, 3),
					status === "failed" ? faker.lorem.sentence() : null,
					randomDate(new Date(2024, 0, 1), new Date(Date.now() + 24 * 60 * 60 * 1000)),
					randomDate(new Date(2024, 0, 1), new Date()),
				],
			);

			if (success) count++;
		}

		console.log(`   ✓ Created ${count} background jobs`);
	}

	async seedRateLimits() {
		console.log("🚦 Seeding rate limits...");
		// Seed representative rate-limit windows so the table isn't empty.
		// Keys follow the pattern used by the API gateway: ip:<addr>, user:<id>, global:<endpoint>
		let count = 0;
		const endpoints = ["/auth/login", "/auth/register", "/auth/otp", "/requests", "/payments"];
		const now = new Date();

		// Simulate some active windows (last 60 s)
		for (let i = 0; i < 50; i++) {
			const windowStart = new Date(now.getTime() - randomInt(0, 60) * 1000);
			const key =
				randomInt(0, 2) === 0 ? `ip:${faker.internet.ip()}`
					: randomInt(0, 1) === 0 ? `user:${this.userIds.length > 0 ? randomPick(this.userIds) : uuid()}`
						: `global:${randomPick(endpoints)}`;

			const success = await safeInsert(
				`INSERT INTO rate_limits (id, key, request_count, window_start)
         VALUES ($1, $2, $3, $4)`,
				[uuid(), key, randomInt(1, 20), windowStart],
			);

			if (success) count++;
		}

		// Simulate some expired windows (historical data)
		for (let i = 0; i < 100; i++) {
			const windowStart = randomDate(new Date(2025, 0, 1), new Date(now.getTime() - 120 * 1000));
			const key = randomInt(0, 1) === 0 ? `ip:${faker.internet.ip()}` : `global:${randomPick(endpoints)}`;

			const success = await safeInsert(
				`INSERT INTO rate_limits (id, key, request_count, window_start)
         VALUES ($1, $2, $3, $4)`,
				[uuid(), key, randomInt(1, 100), windowStart],
			);

			if (success) count++;
		}

		console.log(`   ✓ Created ${count} rate limit records`);
	}

	async seedFeatureFlags() {
		console.log("🚩 Seeding feature flags...");
		const flags = [
			{ key: "enable_chat", enabled: true },
			{ key: "enable_video_calls", enabled: false },
			{ key: "enable_subscriptions", enabled: true },
			{ key: "enable_instant_booking", enabled: true },
			{ key: "enable_background_checks", enabled: false },
		];

		let count = 0;
		for (const flag of flags) {
			const success = await safeInsert(
				`INSERT INTO feature_flags (key, enabled, rollout_percentage) 
         VALUES ($1, $2, $3)
         ON CONFLICT (key) DO UPDATE SET enabled = EXCLUDED.enabled`,
				[flag.key, flag.enabled, randomInt(50, 100)],
			);

			if (success) count++;
		}

		console.log(`   ✓ Created ${count} feature flags`);
	}

	async seedSystemSettings() {
		console.log("⚙️ Seeding system settings...");
		const adminId = this.adminIds.length > 0 ? this.adminIds[0] : null;
		const settings = [
			{ key: "platform_fee_percentage", value: "15", description: "Platform commission percentage" },
			{ key: "min_payout_amount", value: "5000", description: "Minimum payout amount in cents" },
			{ key: "max_proposal_count", value: "10", description: "Max proposals per request" },
			{ key: "request_expiry_days", value: "30", description: "Days until open request expires" },
			{ key: "support_email", value: "support@marketplace.com", description: "Support contact email" },
			{ key: "max_login_attempts", value: "5", description: "Max failed login attempts before lockout" },
			{ key: "session_timeout_minutes", value: "15", description: "JWT access token lifetime in minutes" },
			{ key: "otp_expiry_minutes", value: "10", description: "OTP verification code expiry in minutes" },
			{ key: "maintenance_mode", value: "false", description: "Set to true to put the platform in maintenance mode" },
			{ key: "maintenance_message", value: "We are performing scheduled maintenance. Please check back shortly.", description: "Message shown to users during maintenance mode" },
			{ key: "provider_verification_required", value: "true", description: "Require admin verification before providers can accept jobs" },
			{ key: "max_providers_per_category", value: "500", description: "Maximum number of providers allowed per service category" },
			{ key: "max_services_per_provider", value: "10", description: "Maximum number of service categories a provider can offer" },
			{ key: "review_auto_approve_days", value: "7", description: "Days after job completion before review is auto-approved if no response" },
			{ key: "min_review_length", value: "10", description: "Minimum character count for a review comment" },
			{ key: "default_currency", value: "INR", description: "Default currency for all monetary values on the platform" },
			{ key: "default_timezone", value: "Asia/Kolkata", description: "Default timezone for scheduling and display" },
			{ key: "max_file_upload_size_mb", value: "10", description: "Maximum file upload size in megabytes" },
			{ key: "allowed_file_types", value: "image/jpeg,image/png,image/webp,application/pdf", description: "Comma-separated list of allowed MIME types for uploads" },
			{ key: "contact_phone", value: "+91 98765 43210", description: "Public support phone number shown on contact page" },
			{ key: "contact_address", value: "123 Marketplace Tower, MG Road, Bengaluru, Karnataka 560001", description: "Public office address shown on contact page" },
			{ key: "terms_version", value: "1.0", description: "Current version of the Terms of Service document" },
			{ key: "privacy_version", value: "1.0", description: "Current version of the Privacy Policy document" },
		];

		let count = 0;
		for (const setting of settings) {
			const success = await safeInsert(
				`INSERT INTO system_settings (key, value, description, updated_by) 
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description`,
				[setting.key, setting.value, setting.description, adminId],
			);

			if (success) count++;
		}

		console.log(`   ✓ Created ${count} system settings`);
	}

	async seedAdminActions() {
		console.log("👮 Seeding admin actions...");
		if (this.adminIds.length === 0) {
			console.log("   ⚠️  Skipping admin actions (no admin users found)");
			return;
		}
		const actions = [
			"suspend_user",
			"verify_provider",
			"resolve_dispute",
			"refund_payment",
			"delete_content",
			"feature_toggle",
		];
		const targetTypes = ["user", "provider", "dispute", "payment", "request"];
		let count = 0;

		for (let i = 0; i < 400; i++) {
			const targetType = randomPick(targetTypes);
			let targetId = uuid();
			if (targetType === "user" && this.userIds.length > 0) targetId = randomPick(this.userIds);
			else if (targetType === "provider" && this.providerRecordIds.length > 0)
				targetId = randomPick(this.providerRecordIds);
			else if (targetType === "request" && this.requestIds.length > 0) targetId = randomPick(this.requestIds);

			const success = await safeInsert(
				`INSERT INTO admin_actions (id, display_id, admin_id, action, target_type, target_id, reason, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
				[
					uuid(),
					displayId('ADM'),
					randomPick(this.adminIds),
					randomPick(actions),
					targetType,
					targetId,
					faker.lorem.sentence(),
					randomDate(new Date(2024, 0, 1), new Date()),
				],
			);

			if (success) count++;
		}

		console.log(`   ✓ Created ${count} admin actions`);
	}

	async seedContactMessages() {
		console.log("📧 Seeding contact messages...");
		const statuses = ["new", "in_progress", "resolved", "closed"];
		let count = 0;

		for (let i = 0; i < 250; i++) {
			const hasUser = randomInt(0, 1) === 1 && this.userIds.length > 0;
			const status = randomPick(statuses);
			const isAssigned = status !== "new" && this.adminIds.length > 0;
			const isResolved = status === "resolved" || status === "closed";

			const success = await safeInsert(
				`INSERT INTO contact_messages (id, name, email, subject, message, status, user_id, assigned_to, admin_notes, ip_address, user_agent, created_at, resolved_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
				[
					uuid(),
					`${randomPick(indianFirstNames)} ${randomPick(indianLastNames)}`,
					this.nextEmail(),
					randomPick(contactSubjects),
					randomPick(contactMessageBodies),
					status,
					hasUser ? randomPick(this.userIds) : null,
					isAssigned ? randomPick(this.adminIds) : null,
					isAssigned ? faker.lorem.sentence() : null,
					faker.internet.ip(),
					faker.internet.userAgent(),
					randomDate(new Date(2024, 0, 1), new Date()),
					isResolved ? randomDate(new Date(2024, 0, 1), new Date()) : null,
				],
			);

			if (success) count++;
		}

		console.log(`   ✓ Created ${count} contact messages`);
	}

	async seedDailyMetrics() {
		console.log("📈 Seeding daily metrics...");
		const startDate = new Date(2024, 0, 1);
		const endDate = new Date();
		const days = Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
		let count = 0;

		for (let i = 0; i < days; i++) {
			const date = new Date(startDate);
			date.setDate(date.getDate() + i);

			const success = await safeInsert(
				`INSERT INTO daily_metrics (date, total_users, total_requests, total_proposals, total_jobs, total_payments) 
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (date) DO UPDATE SET
           total_users = EXCLUDED.total_users,
           total_requests = EXCLUDED.total_requests,
           total_proposals = EXCLUDED.total_proposals,
           total_jobs = EXCLUDED.total_jobs,
           total_payments = EXCLUDED.total_payments`,
				[
					date.toISOString().split("T")[0],
					randomInt(100, 200) + i,
					randomInt(50, 150),
					randomInt(40, 120),
					randomInt(30, 100),
					randomInt(20, 80),
				],
			);

			if (success) count++;
		}

		console.log(`   ✓ Created ${count} daily metrics`);
	}

	async seedPricingPlans() {
		console.log("💵 Seeding pricing plans...");
		const plans = [
			{
				name: "Free",
				description: "For individual service providers just getting started",
				price: 0,
				billing_period: "monthly",
				features: JSON.stringify(["Up to 5 proposals/month", "Basic profile", "Email support"]),
			},
			{
				name: "Basic",
				description: "For individual service providers",
				price: 299,
				billing_period: "monthly",
				features: JSON.stringify(["Up to 10 proposals/month", "Enhanced profile", "Priority email support"]),
			},
			{
				name: "Professional",
				description: "For established professionals",
				price: 999,
				billing_period: "monthly",
				features: JSON.stringify([
					"Unlimited proposals",
					"Featured profile",
					"Priority support",
					"Analytics dashboard",
				]),
			},
			{
				name: "Business",
				description: "For service businesses and teams",
				price: 2499,
				billing_period: "monthly",
				features: JSON.stringify([
					"Everything in Pro",
					"Multiple team members",
					"API access",
					"Custom branding",
					"Dedicated account manager",
				]),
			},
			{
				name: "Professional Annual",
				description: "Professional plan billed annually (save 20%)",
				price: 9588,
				billing_period: "yearly",
				features: JSON.stringify(["Everything in Professional", "2 months free", "Annual savings"]),
			},
		];

		let inserted = 0;
		let existing = 0;

		for (const plan of plans) {
			// Check if plan already exists
			const check = await safeQuery("SELECT id FROM pricing_plans WHERE name = $1", [plan.name]);

			if (check.rows.length > 0) {
				this.planIds.push(check.rows[0].id);
				existing++;
			} else {
				const id = uuid();
				const success = await safeInsert(
					`INSERT INTO pricing_plans (id, name, description, price, billing_period, features, active) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
					[id, plan.name, plan.description, plan.price, plan.billing_period, plan.features, true],
				);

				if (success) {
					this.planIds.push(id);
					inserted++;
				}
			}
		}

		console.log(`   ✓ Pricing plans ready: ${inserted} inserted, ${existing} existing (Total: ${this.planIds.length})`);
	}

	async seedSubscriptions() {
		console.log("📅 Seeding subscriptions...");

		if (this.providerRecordIds.length === 0 || this.planIds.length === 0) {
			console.log("   ⚠️  Skipping subscriptions (no providers or plans)");
			return;
		}

		let count = 0;

		// Give each provider a subscription (some active, some expired)
		for (const providerId of this.providerRecordIds) {
			const planId = randomPick(this.planIds);
			const status = randomPick(["active", "active", "active", "cancelled", "expired"]); // 60% active
			const startedAt = randomDate(new Date(2024, 0, 1), new Date());
			const daysToAdd = status === "active" ? randomInt(30, 365) : randomInt(-30, 0); // Active: future expiry, Others: past expiry

			const success = await safeInsert(
				`INSERT INTO subscriptions (id, display_id, provider_id, plan_id, status, started_at, expires_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
				[
					uuid(),
					displayId('SUB'),
					providerId,
					planId,
					status,
					startedAt,
					new Date(startedAt.getTime() + daysToAdd * 24 * 60 * 60 * 1000),
				],
			);

			if (success) count++;
		}

		console.log(`   ✓ Created ${count} subscriptions`);
	}

	async seedSavedPaymentMethods() {
		console.log("💳 Seeding saved payment methods...");
		let count = 0;
		// Track which users already have a default to enforce UNIQUE (user_id) WHERE is_default = true
		const defaultSet = new Set();

		for (let i = 0; i < 300; i++) {
			if (this.userIds.length === 0) break;
			const userId = randomPick(this.userIds);
			const wantsDefault = !defaultSet.has(userId) && randomInt(0, 3) === 0;
			if (wantsDefault) defaultSet.add(userId);

			const success = await safeInsert(
				`INSERT INTO saved_payment_methods (id, user_id, payment_type, card_brand, last_four, expiry_month, expiry_year, is_default, billing_email) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
				[
					uuid(),
					userId,
					randomPick(["card", "bank_account", "paypal"]),
					randomPick(["Visa", "Mastercard", "Amex", null]),
					String(randomInt(1000, 9999)),
					randomInt(1, 12),
					randomInt(2025, 2030),
					wantsDefault,
					this.userEmailMap.get(userId) || uniqueEmail(faker.person.firstName(), faker.person.lastName()),
				],
			);

			if (success) count++;
		}

		console.log(`   ✓ Created ${count} saved payment methods`);
	}

	async seedNotificationPreferences() {
		console.log("🔔 Seeding notification preferences...");
		let count = 0;

		for (const userId of this.userIds) {
			const success = await safeInsert(
				`INSERT INTO notification_preferences (id, user_id, email_notifications, sms_notifications, push_notifications, marketing_emails, new_request_alerts, proposal_alerts, job_updates, payment_alerts, review_alerts, message_alerts) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (user_id) DO UPDATE SET
           email_notifications = EXCLUDED.email_notifications,
           sms_notifications = EXCLUDED.sms_notifications,
           push_notifications = EXCLUDED.push_notifications`,
				[
					uuid(),
					userId,
					randomInt(0, 1) === 1, // email_notifications
					randomInt(0, 1) === 1, // sms_notifications
					randomInt(0, 1) === 1, // push_notifications
					randomInt(0, 3) === 0, // marketing_emails (25%)
					randomInt(0, 10) > 2, // new_request_alerts (70%)
					randomInt(0, 10) > 2, // proposal_alerts (70%)
					randomInt(0, 10) > 1, // job_updates (80%)
					true, // payment_alerts (always on)
					randomInt(0, 10) > 3, // review_alerts (60%)
					randomInt(0, 10) > 1, // message_alerts (80%)
				],
			);

			if (success) count++;
		}

		console.log(`   ✓ Created ${count} notification preferences`);
	}

	async seedUnsubscribes() {
		console.log("🚫 Seeding unsubscribes...");
		let count = 0;

		for (let i = 0; i < 100; i++) {
			if (this.userIds.length === 0) break;

			const userId = randomPick(this.userIds);
			const email = this.userEmailMap.get(userId) || uniqueEmail(faker.person.firstName(), faker.person.lastName());

			const success = await safeInsert(
				`INSERT INTO unsubscribes (id, user_id, email, reason, unsubscribed_at) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET reason = EXCLUDED.reason`,
				[uuid(), userId, email, faker.lorem.sentence(), randomDate(new Date(2024, 0, 1), new Date())],
			);

			if (success) count++;
		}

		console.log(`   ✓ Created ${count} unsubscribe records`);
	}

	async seedTwoFactorSecrets() {
		console.log("🔐 Seeding two-factor secrets...");
		let count = 0;
		// Seed 2FA for ~25% of users
		const eligible = this.userIds.filter(() => randomInt(0, 3) === 0);

		for (const userId of eligible) {
			const enabled = randomInt(0, 1) === 1;
			const backupCodes = Array.from({ length: 8 }, () => Math.random().toString(36).substring(2, 10).toUpperCase());

			const success = await safeInsert(
				`INSERT INTO two_factor_secrets (id, user_id, secret, backup_codes, enabled)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id) DO NOTHING`,
				[
					uuid(),
					userId,
					faker.string.alphanumeric(32).toUpperCase(), // TOTP base32 secret
					`{${backupCodes.map((c) => `"${c}"`).join(",")}}`,
					enabled,
				],
			);

			if (success) count++;
		}

		console.log(`   ✓ Created ${count} two-factor secrets`);
	}

	async seedMagicLinkTokens() {
		console.log("🔗 Seeding magic link tokens...");
		let count = 0;

		for (let i = 0; i < 80; i++) {
			if (this.userIds.length === 0) break;
			const userId = randomPick(this.userIds);
			const email = this.userEmailMap.get(userId) || uniqueEmail(faker.person.firstName(), faker.person.lastName());
			const isUsed = randomInt(0, 2) === 0;
			const createdAt = randomDate(new Date(2025, 0, 1), new Date());
			const expiresAt = new Date(createdAt.getTime() + 15 * 60 * 1000); // 15 min expiry

			const success = await safeInsert(
				`INSERT INTO magic_link_tokens (id, user_id, email, token, expires_at, used_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (token) DO UPDATE SET expires_at = EXCLUDED.expires_at`,
				[
					uuid(),
					userId,
					email,
					faker.string.alphanumeric(64),
					expiresAt,
					isUsed ? new Date(createdAt.getTime() + randomInt(1, 60) * 1000) : null,
					createdAt,
				],
			);

			if (success) count++;
		}

		console.log(`   ✓ Created ${count} magic link tokens`);
	}

	async seedAccountDeletionRequests() {
		console.log("🗑️ Seeding account deletion requests...");
		let count = 0;
		// Only a small subset of users request deletion
		const requesters = this.customerIds.slice(0, Math.min(20, this.customerIds.length));

		for (const userId of requesters) {
			const requestedAt = randomDate(new Date(2025, 0, 1), new Date());
			const isCancelled = randomInt(0, 2) === 0;
			const isCompleted = !isCancelled && randomInt(0, 3) === 0;

			const success = await safeInsert(
				`INSERT INTO account_deletion_requests (id, user_id, reason, requested_at, completed_at, cancelled_at, cancellation_reason)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id) DO NOTHING`,
				[
					uuid(),
					userId,
					randomPick([
						"No longer need the platform",
						"Privacy concerns",
						"Switching to competitor",
						"Too many notifications",
						null,
					]),
					requestedAt,
					isCompleted ? new Date(requestedAt.getTime() + 7 * 24 * 60 * 60 * 1000) : null,
					isCancelled ? new Date(requestedAt.getTime() + randomInt(1, 48) * 60 * 60 * 1000) : null,
					isCancelled ? "User changed their mind" : null,
				],
			);

			if (success) count++;
		}

		console.log(`   ✓ Created ${count} account deletion requests`);
	}

	async seedProviderReviewAggregates() {
		console.log("⭐ Seeding provider review aggregates...");
		if (this.providerRecordIds.length === 0) {
			console.log("   ⚠️  Skipping (no providers found)");
			return;
		}

		// Recompute aggregates from actual seeded review data — do not use random values.
		// The schema trigger handles real-time updates; this backfills the initial seed state.
		const result = await safeQuery(`
			INSERT INTO provider_review_aggregates
				(provider_id, total_reviews, average_rating,
				 rating_1_count, rating_2_count, rating_3_count, rating_4_count, rating_5_count,
				 last_review_at, updated_at)
			SELECT
				provider_id,
				COUNT(*)::INT                                          AS total_reviews,
				ROUND(AVG(rating)::NUMERIC, 2)                         AS average_rating,
				COUNT(*) FILTER (WHERE rating = 1)::INT                AS rating_1_count,
				COUNT(*) FILTER (WHERE rating = 2)::INT                AS rating_2_count,
				COUNT(*) FILTER (WHERE rating = 3)::INT                AS rating_3_count,
				COUNT(*) FILTER (WHERE rating = 4)::INT                AS rating_4_count,
				COUNT(*) FILTER (WHERE rating = 5)::INT                AS rating_5_count,
				MAX(created_at)                                        AS last_review_at,
				NOW()                                                  AS updated_at
			FROM reviews
			GROUP BY provider_id
			ON CONFLICT (provider_id) DO UPDATE SET
				total_reviews   = EXCLUDED.total_reviews,
				average_rating  = EXCLUDED.average_rating,
				rating_1_count  = EXCLUDED.rating_1_count,
				rating_2_count  = EXCLUDED.rating_2_count,
				rating_3_count  = EXCLUDED.rating_3_count,
				rating_4_count  = EXCLUDED.rating_4_count,
				rating_5_count  = EXCLUDED.rating_5_count,
				last_review_at  = EXCLUDED.last_review_at,
				updated_at      = NOW()
		`);

		console.log(`   ✓ Synced provider review aggregates from actual review data`);
	}
}

// Run the seeder
const seeder = new DatabaseSeeder();
seeder.run().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});

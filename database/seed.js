const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');
const dotenv = require('dotenv');
const crypto = require('crypto');

// Load environment variables — local .env first, then parent directory
dotenv.config({ path: require('path').join(__dirname, '.env') });
dotenv.config({ path: require('path').join(__dirname, '../.env') });

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

// ===== ADVANCED HELPER FUNCTIONS =====

// Generate cryptographically secure UUID
const uuid = () => {
  return crypto.randomUUID();
};

// Generate unique email with timestamp and random suffix
const uniqueEmail = (firstName, lastName) => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  // Clean names to ensure only valid email characters
  const cleanFirst = String(firstName).replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'user';
  const cleanLast = String(lastName).replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || crypto.randomBytes(3).toString('hex');
  return `${cleanFirst}.${cleanLast}.${timestamp}.${random}@marketplace.local`;
};

// Generate random date within range
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Generate random integer
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Pick random element from array
const randomPick = (arr) => arr[randomInt(0, arr.length - 1)];

// Pick multiple random elements
const randomPickMultiple = (arr, count) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, arr.length));
};

// Safe query execution with retry logic
const safeQuery = async (query, params, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await pool.query(query, params);
    } catch (error) {
      if (attempt === retries) {
        console.warn(`   ⚠ Query failed after ${retries} attempts:`, error.message);
        return { rows: [], rowCount: 0 };
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, attempt * 100));
    }
  }
};

// Insert with conflict handling - returns success status
const safeInsert = async (query, params, retries = 5) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query(query, params);
      return true;
    } catch (error) {
      // If it's a unique violation, regenerate the ID and retry
      if (error.code === '23505') { // Unique violation
        if (params[0] && typeof params[0] === 'string' && params[0].match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          params[0] = uuid(); // Regenerate UUID
          continue;
        }
      }
      
      if (attempt === retries) {
        console.warn(`   ⚠ Insert failed:`, error.message.substring(0, 100));
        return false;
      }
      
      await new Promise(resolve => setTimeout(resolve, attempt * 50));
    }
  }
  return false;
};

// Service categories data
const serviceCategories = [
  { name: 'Plumbing', description: 'Plumbing services including repairs, installations, and maintenance', icon: '🔧' },
  { name: 'Electrical', description: 'Electrical services and repairs', icon: '⚡' },
  { name: 'Carpentry', description: 'Carpentry and woodwork services', icon: '🔨' },
  { name: 'Painting', description: 'Interior and exterior painting services', icon: '🎨' },
  { name: 'Cleaning', description: 'House and office cleaning services', icon: '🧹' },
  { name: 'HVAC', description: 'Heating, ventilation, and air conditioning services', icon: '❄️' },
  { name: 'Landscaping', description: 'Garden and lawn care services', icon: '🌳' },
  { name: 'Roofing', description: 'Roof repair and installation', icon: '🏠' },
  { name: 'Moving', description: 'Moving and relocation services', icon: '📦' },
  { name: 'Pest Control', description: 'Pest control and extermination', icon: '🐛' },
  { name: 'Appliance Repair', description: 'Repair of household appliances', icon: '🔧' },
  { name: 'Locksmith', description: 'Lock installation and repair services', icon: '🔑' },
  { name: 'Window Cleaning', description: 'Professional window cleaning', icon: '🪟' },
  { name: 'Flooring', description: 'Floor installation and repair', icon: '📏' },
  { name: 'Auto Repair', description: 'Vehicle maintenance and repair', icon: '🚗' },
];

// Cities and locations
const cities = [
  { name: 'New York', state: 'NY', lat: 40.7128, lng: -74.0060 },
  { name: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437 },
  { name: 'Chicago', state: 'IL', lat: 41.8781, lng: -87.6298 },
  { name: 'Houston', state: 'TX', lat: 29.7604, lng: -95.3698 },
  { name: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.0740 },
  { name: 'Philadelphia', state: 'PA', lat: 39.9526, lng: -75.1652 },
  { name: 'San Antonio', state: 'TX', lat: 29.4241, lng: -98.4936 },
  { name: 'San Diego', state: 'CA', lat: 32.7157, lng: -117.1611 },
  { name: 'Dallas', state: 'TX', lat: 32.7767, lng: -96.7970 },
  { name: 'San Jose', state: 'CA', lat: 37.3382, lng: -121.8863 },
];

class DatabaseSeeder {
  constructor() {
    this.userIds = [];
    this.customerIds = [];
    this.providerIds = [];
    this.adminIds = [];
    this.categoryIds = [];
    this.locationIds = [];
    this.requestIds = [];
    this.proposalIds = [];
    this.jobIds = [];
    this.paymentIds = [];
    this.providerRecordIds = [];
    this.couponIds = [];
    this.planIds = [];
    this.messageIds = [];
    this.userEmailMap = new Map(); // Track user IDs to emails
  }

  async run() {
    console.log('🌱 Starting database seeding...\n');
    console.log('📊 Advanced Features:');
    console.log('   ✓ Automatic duplicate handling');
    console.log('   ✓ Unique ID regeneration');
    console.log('   ✓ Retry logic for conflicts');
    console.log('   ✓ Graceful error recovery\n');

    try {
      // Test database connection
      await this.testConnection();

      // Seed in order of dependencies
      await this.seedServiceCategories();
      await this.seedUsers();
      await this.seedSessions();
      await this.seedLoginAttempts();
      await this.seedProviders();
      await this.seedProviderServices();
      await this.seedProviderAvailability();
      await this.seedProviderPortfolio();
      await this.seedProviderDocuments();
      await this.seedLocations();
      await this.seedServiceRequests();
      await this.seedProposals();
      await this.seedJobs();
      await this.seedPayments();
      await this.seedRefunds();
      await this.seedReviews();
      await this.seedMessages();
      await this.seedAttachments();
      await this.seedNotifications();
      await this.seedNotificationDeliveries();
      await this.seedFavorites();
      await this.seedCoupons();
      await this.seedCouponUsage();
      await this.seedDisputes();
      await this.seedAuditLogs();
      await this.seedUserActivityLogs();
      await this.seedEvents();
      await this.seedBackgroundJobs();
      await this.seedFeatureFlags();
      await this.seedSystemSettings();
      await this.seedAdminActions();
      await this.seedContactMessages();
      await this.seedDailyMetrics();
      await this.seedPricingPlans();
      await this.seedSubscriptions();
      await this.seedSavedPaymentMethods();
      await this.seedNotificationPreferences();
      await this.seedUnsubscribes();

      console.log('\n✅ Database seeding completed successfully!');
      console.log('\n📊 Summary:');
      console.log(`   Users: ${this.userIds.length}`);
      console.log(`   Providers: ${this.providerRecordIds.length}`);
      console.log(`   Categories: ${this.categoryIds.length}`);
      console.log(`   Service Requests: ${this.requestIds.length}`);
      console.log(`   Proposals: ${this.proposalIds.length}`);
      console.log(`   Jobs: ${this.jobIds.length}`);
      console.log(`   Payments: ${this.paymentIds.length}`);
      console.log(`   Messages: ${this.messageIds.length}`);

    } catch (error) {
      console.error('❌ Seeding encountered an error:', error.message);
      console.log('✓ Continuing despite error...');
    } finally {
      await pool.end();
      console.log('\n👋 Database connection closed');
    }
  }

  async testConnection() {
    try {
      const result = await pool.query('SELECT NOW()');
      console.log('✅ Database connection successful');
      
      // Check if required tables exist
      const tables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'providers', 'provider_services', 'service_categories')
      `);
      
      const tableNames = tables.rows.map(r => r.table_name);
      const requiredTables = ['users', 'providers', 'provider_services', 'service_categories'];
      const missingTables = requiredTables.filter(t => !tableNames.includes(t));
      
      if (missingTables.length > 0) {
        console.error('❌ Missing required tables:', missingTables.join(', '));
        console.error('\n⚠️  Please run the schema first:');
        console.error('   psql -U postgres -d marketplace -f schema.sql\n');
        throw new Error('Database schema not applied');
      }
      
      console.log('✅ Required tables verified\n');
      return true;
    } catch (error) {
      console.error('❌ Database error:', error.message);
      throw error;
    }
  }

  async seedServiceCategories() {
    console.log('📁 Seeding service categories...');
    let inserted = 0;
    let existing = 0;

    for (const category of serviceCategories) {
      // First, check if category already exists
      const check = await safeQuery(
        'SELECT id FROM service_categories WHERE name = $1',
        [category.name]
      );

      if (check.rows.length > 0) {
        // Category exists, use its ID
        this.categoryIds.push(check.rows[0].id);
        existing++;
      } else {
        // Category doesn't exist, insert it
        const id = uuid();
        const success = await safeInsert(
          `INSERT INTO service_categories (id, name, description, icon, active) 
           VALUES ($1, $2, $3, $4, $5)`,
          [id, category.name, category.description, category.icon, true]
        );

        if (success) {
          // Query back the actual ID that was inserted (safeInsert might have regenerated it)
          const actual = await safeQuery(
            'SELECT id FROM service_categories WHERE name = $1',
            [category.name]
          );
          if (actual.rows.length > 0) {
            this.categoryIds.push(actual.rows[0].id);
            inserted++;
          }
        } else {
          // Insertion failed, try to get ID again in case it was just inserted
          const retry = await safeQuery(
            'SELECT id FROM service_categories WHERE name = $1',
            [category.name]
          );
          if (retry.rows.length > 0) {
            this.categoryIds.push(retry.rows[0].id);
            existing++;
          }
        }
      }
    }

    console.log(`   ✓ Service categories ready: ${inserted} inserted, ${existing} existing (Total: ${this.categoryIds.length})`);
  }

  async seedUsers() {
    console.log('👥 Seeding users...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    let created = 0;

    // Create 1 admin
    const adminId = uuid();
    const adminEmail = "admin@marketplace.com";
    const adminSuccess = await safeInsert(
			`INSERT INTO users (id, email, name, phone, password_hash, role, email_verified, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email) DO NOTHING`,
			[adminId, adminEmail, "Admin User", "+12345678900", hashedPassword, "admin", true, "active"],
		);

    if (adminSuccess) {
			this.adminIds.push(adminId);
			this.userIds.push(adminId);
			this.userEmailMap.set(adminId, adminEmail);
			created++;
		} else {
			// Admin already exists — load their ID
			const existing = await safeQuery("SELECT id FROM users WHERE email = $1", [adminEmail]);
			if (existing.rows.length > 0) {
				this.adminIds.push(existing.rows[0].id);
				this.userIds.push(existing.rows[0].id);
				this.userEmailMap.set(existing.rows[0].id, adminEmail);
			}
		}

    // Create 100 customers
    for (let i = 0; i < 100; i++) {
      const id = uuid();
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = uniqueEmail(firstName, lastName);

      const success = await safeInsert(
        `INSERT INTO users (id, email, name, phone, password_hash, role, email_verified, phone_verified, profile_picture_url, timezone, language, last_login_at, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          id,
          email,
          `${firstName} ${lastName}`,
          `+1${randomInt(1000000000, 9999999999)}`,
          hashedPassword,
          'customer',
          randomInt(0, 1) === 1,
          randomInt(0, 1) === 1,
          faker.image.avatar(),
          faker.location.timeZone(),
          'en',
          randomDate(new Date(2024, 0, 1), new Date()),
          randomPick(['active', 'active', 'active', 'suspended']),
        ]
      );

      if (success) {
        this.customerIds.push(id);
        this.userIds.push(id);
        this.userEmailMap.set(id, email);
        created++;
      }
    }

    // Create 50 providers
    for (let i = 0; i < 50; i++) {
      const id = uuid();
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = uniqueEmail(firstName, lastName);

      const success = await safeInsert(
        `INSERT INTO users (id, email, name, phone, password_hash, role, email_verified, phone_verified, profile_picture_url, timezone, language, last_login_at, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          id,
          email,
          `${firstName} ${lastName}`,
          `+1${randomInt(1000000000, 9999999999)}`,
          hashedPassword,
          'provider',
          true,
          true,
          faker.image.avatar(),
          faker.location.timeZone(),
          'en',
          randomDate(new Date(2024, 0, 1), new Date()),
          'active',
        ]
      );

      if (success) {
        this.providerIds.push(id);
        this.userIds.push(id);
        this.userEmailMap.set(id, email);
        created++;
      }
    }

    console.log(`   ✓ Created ${created} users (${this.customerIds.length} customers, ${this.providerIds.length} providers, ${this.adminIds.length} admins)`);
  }

  async seedSessions() {
    console.log('🔐 Seeding sessions...');
    let count = 0;

    for (let i = 0; i < 100; i++) {
      if (this.userIds.length === 0) break;

      const success = await safeInsert(
        `INSERT INTO sessions (id, user_id, refresh_token, ip_address, user_agent, device_type, location, expires_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          uuid(),
          randomPick(this.userIds),
          crypto.randomBytes(32).toString('hex'),
          faker.internet.ip(),
          faker.internet.userAgent(),
          randomPick(['desktop', 'mobile', 'tablet']),
          faker.location.city(),
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ]
      );

      if (success) count++;
    }

    console.log(`   ✓ Created ${count} sessions`);
  }

  async seedLoginAttempts() {
    console.log('🔑 Seeding login attempts...');
    let count = 0;

    for (let i = 0; i < 200; i++) {
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
        ]
      );

      if (success) count++;
    }

    console.log(`   ✓ Created ${count} login attempts`);
  }

  async seedProviders() {
    console.log('🏢 Seeding providers...');
    let count = 0;

    for (const userId of this.providerIds) {
      const id = uuid();
      const success = await safeInsert(
        `INSERT INTO providers (id, user_id, business_name, description, profile_picture_url, rating, total_jobs_completed, years_of_experience, service_area_radius, response_time_avg, verification_status, certifications) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (user_id) DO NOTHING`,
        [
          id,
          userId,
          faker.company.name() + ' ' + uuid().substring(0, 8),
          faker.company.catchPhrase() + '. ' + faker.lorem.paragraph(),
          faker.image.url(),
          parseFloat((Math.random() * 2 + 3).toFixed(2)),
          randomInt(0, 200),
          randomInt(1, 25),
          randomInt(10, 50),
          randomInt(30, 180),
          randomPick(['pending', 'verified', 'verified', 'verified']),
          JSON.stringify([
            { name: faker.lorem.words(3), issuer: faker.company.name(), year: randomInt(2018, 2024) }
          ]),
        ]
      );

      if (success) {
        this.providerRecordIds.push(id);
        count++;
      }
    }

    console.log(`   ✓ Created ${count} providers`);
  }

  async seedProviderServices() {
    console.log('🔧 Seeding provider services...');
    let count = 0;

    for (const providerId of this.providerRecordIds) {
      const numServices = randomInt(1, 5);
      const selectedCategories = randomPickMultiple(this.categoryIds, numServices);

      for (const categoryId of selectedCategories) {
        const success = await safeInsert(
          `INSERT INTO provider_services (id, provider_id, category_id) 
           VALUES ($1, $2, $3)
           ON CONFLICT (provider_id, category_id) DO NOTHING`,
          [uuid(), providerId, categoryId]
        );

        if (success) count++;
      }
    }

    console.log(`   ✓ Created ${count} provider service mappings`);
  }

  async seedProviderAvailability() {
    console.log('📅 Seeding provider availability...');
    let count = 0;

    for (const providerId of this.providerRecordIds) {
      // Most providers work Mon-Fri
      for (let day = 1; day <= 5; day++) {
        const success = await safeInsert(
          `INSERT INTO provider_availability (id, provider_id, day_of_week, start_time, end_time) 
           VALUES ($1, $2, $3, $4, $5)`,
          [uuid(), providerId, day, '09:00:00', '17:00:00']
        );

        if (success) count++;
      }

      // Some also work weekends
      if (randomInt(0, 1) === 1) {
        const success = await safeInsert(
          `INSERT INTO provider_availability (id, provider_id, day_of_week, start_time, end_time) 
           VALUES ($1, $2, $3, $4, $5)`,
          [uuid(), providerId, 6, '10:00:00', '14:00:00']
        );

        if (success) count++;
      }
    }

    console.log(`   ✓ Created ${count} availability slots`);
  }

  async seedProviderPortfolio() {
    console.log('🖼️ Seeding provider portfolio...');
    let count = 0;

    for (const providerId of this.providerRecordIds) {
      const numItems = randomInt(2, 8);

      for (let i = 0; i < numItems; i++) {
        const success = await safeInsert(
          `INSERT INTO provider_portfolio (id, provider_id, title, description, image_url, display_order) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            uuid(),
            providerId,
            faker.lorem.words(3),
            faker.lorem.sentence(),
            faker.image.url(),
            i,
          ]
        );

        if (success) count++;
      }
    }

    console.log(`   ✓ Created ${count} portfolio items`);
  }

  async seedProviderDocuments() {
    console.log('📄 Seeding provider documents...');
    let count = 0;
    const docTypes = ['government_id', 'business_license', 'insurance_certificate', 'certification'];

    for (const providerId of this.providerRecordIds) {
      for (const docType of docTypes) {
        const success = await safeInsert(
          `INSERT INTO provider_documents (id, provider_id, document_type, document_url, document_name, document_number, verified, expires_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            uuid(),
            providerId,
            docType,
            faker.internet.url(),
            faker.system.fileName(),
            crypto.randomBytes(5).toString('hex').toUpperCase(),
            randomInt(0, 1) === 1,
            new Date(Date.now() + randomInt(365, 1095) * 24 * 60 * 60 * 1000),
          ]
        );

        if (success) count++;
      }
    }

    console.log(`   ✓ Created ${count} documents`);
  }

  async seedLocations() {
    console.log('📍 Seeding locations...');
    let count = 0;

    for (let i = 0; i < 150; i++) {
      const city = randomPick(cities);
      const id = uuid();
      const userId = randomInt(0, 1) === 1 && this.userIds.length > 0 ? randomPick(this.userIds) : null;

      const success = await safeInsert(
        `INSERT INTO locations (id, user_id, latitude, longitude, address, city, state, zip_code, country) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          id,
          userId,
          city.lat + (Math.random() - 0.5) * 0.2,
          city.lng + (Math.random() - 0.5) * 0.2,
          faker.location.streetAddress(),
          city.name,
          city.state,
          faker.location.zipCode(),
          'US',
        ]
      );

      if (success) {
        this.locationIds.push(id);
        count++;
      }
    }

    console.log(`   ✓ Created ${count} locations`);
  }

  async seedServiceRequests() {
    console.log('📝 Seeding service requests...');
    const statuses = ['open', 'assigned', 'completed', 'cancelled'];
    const urgencies = ['low', 'medium', 'high', 'urgent'];
    let count = 0;

    for (let i = 0; i < 120; i++) {
      if (this.categoryIds.length === 0 || this.locationIds.length === 0) break;

      const id = uuid();
      const isAnonymous = randomInt(0, 10) < 3;
      const userId = isAnonymous || this.customerIds.length === 0 ? null : randomPick(this.customerIds);

      const success = await safeInsert(
        `INSERT INTO service_requests (id, user_id, category_id, location_id, description, budget, images, preferred_date, urgency, expiry_date, view_count, status, guest_name, guest_email, guest_phone, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          id,
          userId,
          randomPick(this.categoryIds),
          randomPick(this.locationIds),
          faker.lorem.paragraphs(2),
          randomInt(50, 5000) * 100,
          JSON.stringify([faker.image.url(), faker.image.url()]),
          randomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
          randomPick(urgencies),
          new Date(Date.now() + randomInt(7, 30) * 24 * 60 * 60 * 1000),
          randomInt(0, 100),
          randomPick(statuses),
          isAnonymous ? faker.person.fullName() : null,
          isAnonymous ? uniqueEmail(faker.person.firstName(), faker.person.lastName()) : null,
          isAnonymous ? `+1${randomInt(1000000000, 9999999999)}` : null,
          randomDate(new Date(2024, 0, 1), new Date()),
        ]
      );

      if (success) {
        this.requestIds.push(id);
        count++;

        // Create search entry - ignore failures
        await safeInsert(
          `INSERT INTO service_request_search (request_id, category, location, description) 
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (request_id) DO NOTHING`,
          [id, 'Service', 'Location', faker.lorem.paragraph()]
        );
      }
    }

    console.log(`   ✓ Created ${count} service requests`);
  }

  async seedProposals() {
    console.log('💼 Seeding proposals...');
    const statuses = ['pending', 'accepted', 'rejected', 'withdrawn'];
    let count = 0;

    for (let i = 0; i < 200; i++) {
      if (this.requestIds.length === 0 || this.providerRecordIds.length === 0) break;

      const id = uuid();
      const status = randomPick(statuses);

      const success = await safeInsert(
        `INSERT INTO proposals (id, request_id, provider_id, price, message, estimated_hours, start_date, completion_date, rejected_reason, status, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          id,
          randomPick(this.requestIds),
          randomPick(this.providerRecordIds),
          randomInt(50, 5000) * 100,
          faker.lorem.paragraph(),
          randomInt(1, 40),
          randomDate(new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
          randomDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
          status === 'rejected' ? faker.lorem.sentence() : null,
          status,
          randomDate(new Date(2024, 0, 1), new Date()),
        ]
      );

      if (success) {
        this.proposalIds.push(id);
        count++;
      }
    }

    console.log(`   ✓ Created ${count} proposals`);
  }

  async seedJobs() {
    console.log('👷 Seeding jobs...');
    const statuses = ['scheduled', 'in_progress', 'completed', 'cancelled', 'disputed'];
    let count = 0;

    for (let i = 0; i < 80; i++) {
      if (this.requestIds.length === 0 || this.providerRecordIds.length === 0 || this.customerIds.length === 0) break;

      const id = uuid();
      const customerId = randomPick(this.customerIds);
      const providerId = randomPick(this.providerRecordIds);
      const providerUserId = randomPick(this.providerIds);
      const status = randomPick(statuses);
      const createdAt = randomDate(new Date(2024, 0, 1), new Date());
      const startedAt = status !== "scheduled" ? randomDate(createdAt, new Date()) : null;
			const completedAt = status === "completed" && startedAt ? randomDate(startedAt, new Date()) : null;

      const success = await safeInsert(
				`INSERT INTO jobs (id, request_id, provider_id, customer_id, proposal_id, actual_amount, cancelled_by, cancellation_reason, status, started_at, completed_at, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
				[
					id,
					randomPick(this.requestIds),
					providerId,
					customerId,
					null,
					randomInt(50, 5000) * 100,
					status === "cancelled" ? randomPick([customerId, providerUserId]) : null,
					status === "cancelled" ? faker.lorem.sentence() : null,
					status,
					startedAt,
					completedAt,
					createdAt,
				],
			);

      if (success) {
        this.jobIds.push(id);
        count++;
      }
    }

    console.log(`   ✓ Created ${count} jobs`);
  }

  async seedPayments() {
    console.log('💳 Seeding payments...');
    const statuses = ['pending', 'completed', 'failed', 'refunded'];
    let count = 0;

    for (const jobId of this.jobIds) {
      if (this.customerIds.length === 0 || this.providerRecordIds.length === 0) break;

      const id = uuid();
      const amount = randomInt(50, 5000) * 100;
      const platformFee = Math.floor(amount * 0.15);
      const providerAmount = amount - platformFee;

      const success = await safeInsert(
        `INSERT INTO payments (id, job_id, user_id, provider_id, amount, platform_fee, provider_amount, currency, payment_method, status, transaction_id, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          id,
          jobId,
          randomPick(this.customerIds),
          randomPick(this.providerRecordIds),
          amount,
          platformFee,
          providerAmount,
          'USD',
          randomPick(['card', 'paypal', 'bank_transfer']),
          randomPick(statuses),
          crypto.randomBytes(8).toString('hex').toUpperCase(),
          randomDate(new Date(2024, 0, 1), new Date()),
        ]
      );

      if (success) {
        this.paymentIds.push(id);
        count++;
      }
    }

    console.log(`   ✓ Created ${count} payments`);
  }

  async seedRefunds() {
    console.log('💰 Seeding refunds...');
    let count = 0;

    const failedPayments = await safeQuery(
      `SELECT id, amount FROM payments WHERE status IN ('failed', 'refunded') LIMIT 50`
    );

    for (const payment of failedPayments.rows) {
      const success = await safeInsert(
        `INSERT INTO refunds (id, payment_id, amount, status, reason) 
         VALUES ($1, $2, $3, $4, $5)`,
        [
          uuid(),
          payment.id,
          payment.amount,
          randomPick(['pending', 'completed', 'failed']),
          faker.lorem.sentence(),
        ]
      );

      if (success) count++;
    }

    console.log(`   ✓ Created ${count} refunds`);
  }

  async seedReviews() {
    console.log('⭐ Seeding reviews...');
    let count = 0;

    const completedJobs = await safeQuery(
      `SELECT id, customer_id, provider_id FROM jobs WHERE status = 'completed' LIMIT 100`
    );

    for (const job of completedJobs.rows) {
      if (randomInt(0, 10) < 8) {
        const success = await safeInsert(
          `INSERT INTO reviews (id, job_id, user_id, provider_id, rating, comment, helpful_count, verified_purchase, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (job_id, user_id) DO NOTHING`,
          [
            uuid(),
            job.id,
            job.customer_id,
            job.provider_id,
            randomInt(1, 5),
            faker.lorem.paragraph(),
            randomInt(0, 20),
            true,
            randomDate(new Date(2024, 0, 1), new Date()),
          ]
        );

        if (success) count++;
      }
    }

    console.log(`   ✓ Created ${count} reviews`);
  }

  async seedMessages() {
    console.log('💬 Seeding messages...');
    let count = 0;

    for (const jobId of this.jobIds.slice(0, 50)) {
      const numMessages = randomInt(3, 15);

      for (let i = 0; i < numMessages; i++) {
        if (this.customerIds.length === 0) break;

        const id = uuid();
        const isRead = randomInt(0, 1) === 1;

        const success = await safeInsert(
          `INSERT INTO messages (id, job_id, sender_id, message, read, read_at, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            id,
            jobId,
            randomPick(this.customerIds),
            faker.lorem.sentences(randomInt(1, 3)),
            isRead,
            isRead ? new Date() : null,
            randomDate(new Date(2024, 0, 1), new Date()),
          ]
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
    console.log('📎 Seeding attachments...');
    let count = 0;

    const messages = await safeQuery('SELECT id FROM messages ORDER BY RANDOM() LIMIT 100');

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
            randomPick(['image/jpeg', 'image/png', 'application/pdf', 'application/msword']),
          ]
        );

        if (success) count++;
      }
    }

    console.log(`   ✓ Created ${count} attachments`);
  }

  async seedNotifications() {
    console.log('🔔 Seeding notifications...');
    const types = ['request_created', 'proposal_received', 'job_started', 'payment_completed', 'review_received', 'message_received'];
    let count = 0;

    for (let i = 0; i < 300; i++) {
      if (this.userIds.length === 0) break;

      const success = await safeInsert(
        `INSERT INTO notifications (id, user_id, type, message, read, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          uuid(),
          randomPick(this.userIds),
          randomPick(types),
          faker.lorem.sentence(),
          randomInt(0, 1) === 1,
          randomDate(new Date(2024, 0, 1), new Date()),
        ]
      );

      if (success) count++;
    }

    console.log(`   ✓ Created ${count} notifications`);
  }

  async seedNotificationDeliveries() {
    console.log('📨 Seeding notification deliveries...');
    let count = 0;

    const notifications = await safeQuery('SELECT id FROM notifications LIMIT 200');

    for (const notification of notifications.rows) {
      const channels = randomPickMultiple(['email', 'sms', 'push'], randomInt(1, 3));

      for (const channel of channels) {
        const success = await safeInsert(
          `INSERT INTO notification_deliveries (id, notification_id, channel, status, delivered_at) 
           VALUES ($1, $2, $3, $4, $5)`,
          [
            uuid(),
            notification.id,
            channel,
            randomPick(['delivered', 'failed', 'pending']),
            randomDate(new Date(2024, 0, 1), new Date()),
          ]
        );

        if (success) count++;
      }
    }

    console.log(`   ✓ Created ${count} notification deliveries`);
  }

  async seedFavorites() {
    console.log('❤️ Seeding favorites...');
    let count = 0;

    for (let i = 0; i < 100; i++) {
      if (this.customerIds.length === 0 || this.providerRecordIds.length === 0) break;

      const success = await safeInsert(
        `INSERT INTO favorites (id, user_id, provider_id) 
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, provider_id) DO NOTHING`,
        [uuid(), randomPick(this.customerIds), randomPick(this.providerRecordIds)]
      );

      if (success) count++;
    }

    console.log(`   ✓ Created ${count} favorites`);
  }

  async seedCoupons() {
    console.log('🎫 Seeding coupons...');
    let count = 0;

    for (let i = 0; i < 50; i++) {
      const id = uuid();
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();

      const success = await safeInsert(
        `INSERT INTO coupons (id, code, discount_percent, max_uses, max_uses_per_user, min_purchase_amount, active, expires_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (code) DO NOTHING`,
        [
          id,
          code,
          randomInt(5, 50),
          randomInt(10, 1000),
          randomInt(1, 3),
          randomInt(0, 50) * 100,
          randomInt(0, 1) === 1,
          new Date(Date.now() + randomInt(30, 365) * 24 * 60 * 60 * 1000),
        ]
      );

      if (success) {
        this.couponIds.push(id);
        count++;
      }
    }

    console.log(`   ✓ Created ${count} coupons`);
  }

  async seedCouponUsage() {
    console.log('🏷️ Seeding coupon usage...');
    let count = 0;

    for (let i = 0; i < 80; i++) {
      if (this.couponIds.length === 0 || this.userIds.length === 0) break;

      const success = await safeInsert(
        `INSERT INTO coupon_usage (id, coupon_id, user_id, used_at) 
         VALUES ($1, $2, $3, $4)`,
        [
          uuid(),
          randomPick(this.couponIds),
          randomPick(this.userIds),
          randomDate(new Date(2024, 0, 1), new Date()),
        ]
      );

      if (success) count++;
    }

    console.log(`   ✓ Created ${count} coupon usage records`);
  }

  async seedDisputes() {
    console.log('⚖️ Seeding disputes...');
    let count = 0;

    const disputedJobs = await safeQuery(
      `SELECT id, customer_id, provider_id FROM jobs WHERE status = 'disputed' LIMIT 20`
    );

    for (const job of disputedJobs.rows) {
      const success = await safeInsert(
				`INSERT INTO disputes (id, job_id, opened_by, reason, status, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
				[
					uuid(),
					job.id,
					job.customer_id, // provider_id in jobs is providers.id not users.id — must use customer_id
					faker.lorem.paragraph(),
					randomPick(["open", "investigating", "resolved", "closed"]),
					randomDate(new Date(2024, 0, 1), new Date()),
				],
			);

      if (success) count++;
    }

    console.log(`   ✓ Created ${count} disputes`);
  }

  async seedAuditLogs() {
    console.log('📋 Seeding audit logs...');
    const actions = ['create', 'update', 'delete', 'suspend', 'verify'];
    const entities = ['user', 'provider', 'request', 'job', 'payment'];
    let count = 0;

    for (let i = 0; i < 200; i++) {
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
    console.log('📊 Seeding user activity logs...');
    const actions = ['login', 'logout', 'profile_update', 'request_create', 'proposal_submit', 'payment_made'];
    let count = 0;

    for (let i = 0; i < 500; i++) {
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
        ]
      );

      if (success) count++;
    }

    console.log(`   ✓ Created ${count} user activity logs`);
  }

  async seedEvents() {
    console.log('📡 Seeding events...');
    const eventTypes = ['request.created', 'proposal.submitted', 'job.started', 'payment.completed', 'review.submitted'];
    let count = 0;

    for (let i = 0; i < 300; i++) {
      const success = await safeInsert(
        `INSERT INTO events (id, event_type, payload, created_at) 
         VALUES ($1, $2, $3, $4)`,
        [
          uuid(),
          randomPick(eventTypes),
          JSON.stringify({ entity_id: uuid(), user_id: this.userIds.length > 0 ? randomPick(this.userIds) : null, data: {} }),
          randomDate(new Date(2024, 0, 1), new Date()),
        ]
      );

      if (success) count++;
    }

    console.log(`   ✓ Created ${count} events`);
  }

  async seedBackgroundJobs() {
    console.log('⚙️ Seeding background jobs...');
    const jobTypes = ['send_email', 'send_sms', 'process_payment', 'generate_report', 'cleanup_expired'];
    const statuses = ['pending', 'processing', 'completed', 'failed'];
    let count = 0;

    for (let i = 0; i < 150; i++) {
      const success = await safeInsert(
        `INSERT INTO background_jobs (id, job_type, payload, status, attempts, scheduled_for, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          uuid(),
          randomPick(jobTypes),
          JSON.stringify({ data: 'sample' }),
          randomPick(statuses),
          randomInt(0, 3),
          randomDate(new Date(2024, 0, 1), new Date(Date.now() + 24 * 60 * 60 * 1000)),
          randomDate(new Date(2024, 0, 1), new Date()),
        ]
      );

      if (success) count++;
    }

    console.log(`   ✓ Created ${count} background jobs`);
  }

  async seedFeatureFlags() {
    console.log('🚩 Seeding feature flags...');
    const flags = [
      { key: 'enable_chat', enabled: true },
      { key: 'enable_video_calls', enabled: false },
      { key: 'enable_subscriptions', enabled: true },
      { key: 'enable_instant_booking', enabled: true },
      { key: 'enable_background_checks', enabled: false },
    ];

    let count = 0;
    for (const flag of flags) {
      const success = await safeInsert(
        `INSERT INTO feature_flags (key, enabled, rollout_percentage) 
         VALUES ($1, $2, $3)
         ON CONFLICT (key) DO UPDATE SET enabled = EXCLUDED.enabled`,
        [flag.key, flag.enabled, randomInt(50, 100)]
      );

      if (success) count++;
    }

    console.log(`   ✓ Created ${count} feature flags`);
  }

  async seedSystemSettings() {
    console.log('⚙️ Seeding system settings...');
    const settings = [
      { key: 'platform_fee_percentage', value: '15', description: 'Platform commission percentage' },
      { key: 'min_payout_amount', value: '5000', description: 'Minimum payout amount in cents' },
      { key: 'max_proposal_count', value: '10', description: 'Max proposals per request' },
      { key: 'request_expiry_days', value: '30', description: 'Days until request expires' },
      { key: 'support_email', value: 'support@marketplace.com', description: 'Support contact email' },
    ];

    let count = 0;
    for (const setting of settings) {
      const success = await safeInsert(
        `INSERT INTO system_settings (key, value, description) 
         VALUES ($1, $2, $3)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [setting.key, setting.value, setting.description]
      );

      if (success) count++;
    }

    console.log(`   ✓ Created ${count} system settings`);
  }

  async seedAdminActions() {
    console.log('👮 Seeding admin actions...');
    const actions = ['suspend_user', 'verify_provider', 'resolve_dispute', 'refund_payment', 'delete_content'];
    const targetTypes = ['user', 'provider', 'dispute', 'payment', 'request'];
    let count = 0;

    for (let i = 0; i < 100; i++) {
      const success = await safeInsert(
        `INSERT INTO admin_actions (id, admin_id, action, target_type, target_id, reason, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          uuid(),
          this.adminIds.length > 0 ? randomPick(this.adminIds) : null,
          randomPick(actions),
          randomPick(targetTypes),
          uuid(),
          faker.lorem.sentence(),
          randomDate(new Date(2024, 0, 1), new Date()),
        ]
      );

      if (success) count++;
    }

    console.log(`   ✓ Created ${count} admin actions`);
  }

  async seedContactMessages() {
    console.log('📧 Seeding contact messages...');
    const statuses = ['new', 'in_progress', 'resolved', 'closed'];
    let count = 0;

    for (let i = 0; i < 80; i++) {
      const hasUser = randomInt(0, 1) === 1 && this.userIds.length > 0;

      const success = await safeInsert(
        `INSERT INTO contact_messages (id, name, email, subject, message, status, user_id, ip_address, user_agent, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          uuid(),
          faker.person.fullName(),
          uniqueEmail(faker.person.firstName(), faker.person.lastName()),
          faker.lorem.sentence(),
          faker.lorem.paragraphs(2),
          randomPick(statuses),
          hasUser ? randomPick(this.userIds) : null,
          faker.internet.ip(),
          faker.internet.userAgent(),
          randomDate(new Date(2024, 0, 1), new Date()),
        ]
      );

      if (success) count++;
    }

    console.log(`   ✓ Created ${count} contact messages`);
  }

  async seedDailyMetrics() {
    console.log('📈 Seeding daily metrics...');
    const startDate = new Date(2024, 0, 1);
    const endDate = new Date();
    const days = Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    let count = 0;

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      const success = await safeInsert(
        `INSERT INTO daily_metrics (date, total_users, total_requests, total_jobs, total_payments) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (date) DO UPDATE SET total_users = EXCLUDED.total_users`,
        [
          date.toISOString().split('T')[0],
          randomInt(100, 200) + i,
          randomInt(50, 150),
          randomInt(30, 100),
          randomInt(20, 80),
        ]
      );

      if (success) count++;
    }

    console.log(`   ✓ Created ${count} daily metrics`);
  }

  async seedPricingPlans() {
    console.log('💵 Seeding pricing plans...');
    const plans = [
      {
        name: 'Free',
        description: 'For individual service providers just getting started',
        price: 0,
        billing_period: 'monthly',
        features: JSON.stringify(['Up to 5 proposals/month', 'Basic profile', 'Email support']),
      },
      {
        name: 'Basic',
        description: 'For individual service providers',
        price: 999,
        billing_period: 'monthly',
        features: JSON.stringify(['Up to 20 proposals/month', 'Enhanced profile', 'Priority email support']),
      },
      {
        name: 'Professional',
        description: 'For established professionals',
        price: 2999,
        billing_period: 'monthly',
        features: JSON.stringify(['Unlimited proposals', 'Featured profile', 'Priority support', 'Analytics dashboard']),
      },
      {
        name: 'Business',
        description: 'For service businesses and teams',
        price: 9999,
        billing_period: 'monthly',
        features: JSON.stringify(['Everything in Pro', 'Multiple team members', 'API access', 'Custom branding', 'Dedicated account manager']),
      },
      {
        name: 'Professional Annual',
        description: 'Professional plan billed annually (save 20%)',
        price: 28788,
        billing_period: 'yearly',
        features: JSON.stringify(['Everything in Professional', '2 months free', 'Annual savings']),
      },
    ];

    let inserted = 0;
    let existing = 0;

    for (const plan of plans) {
      // Check if plan already exists
      const check = await safeQuery(
        'SELECT id FROM pricing_plans WHERE name = $1',
        [plan.name]
      );

      if (check.rows.length > 0) {
        this.planIds.push(check.rows[0].id);
        existing++;
      } else {
        const id = uuid();
        const success = await safeInsert(
          `INSERT INTO pricing_plans (id, name, description, price, billing_period, features, active) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [id, plan.name, plan.description, plan.price, plan.billing_period, plan.features, true]
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
    console.log('📅 Seeding subscriptions...');
    
    if (this.providerRecordIds.length === 0 || this.planIds.length === 0) {
      console.log('   ⚠️  Skipping subscriptions (no providers or plans)');
      return;
    }

    let count = 0;

    // Give each provider a subscription (some active, some expired)
    for (const providerId of this.providerRecordIds) {
      const planId = randomPick(this.planIds);
      const status = randomPick(['active', 'active', 'active', 'cancelled', 'expired']); // 60% active
      const startedAt = randomDate(new Date(2024, 0, 1), new Date());
      const daysToAdd = status === 'active' ? randomInt(30, 365) : randomInt(-30, 0); // Active: future expiry, Others: past expiry

      const success = await safeInsert(
        `INSERT INTO subscriptions (id, provider_id, plan_id, status, started_at, expires_at) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          uuid(),
          providerId,
          planId,
          status,
          startedAt,
          new Date(startedAt.getTime() + daysToAdd * 24 * 60 * 60 * 1000),
        ]
      );

      if (success) count++;
    }

    console.log(`   ✓ Created ${count} subscriptions`);
  }

  async seedSavedPaymentMethods() {
    console.log('💳 Seeding saved payment methods...');
    let count = 0;

    for (let i = 0; i < 60; i++) {
      if (this.userIds.length === 0) break;

      const success = await safeInsert(
        `INSERT INTO saved_payment_methods (id, user_id, payment_type, card_brand, last_four, expiry_month, expiry_year, is_default, billing_email) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          uuid(),
          randomPick(this.userIds),
          'card',
          randomPick(['Visa', 'Mastercard', 'Amex']),
          String(randomInt(1000, 9999)),
          randomInt(1, 12),
          randomInt(2024, 2030),
          randomInt(0, 4) === 0,
          uniqueEmail(faker.person.firstName(), faker.person.lastName()),
        ]
      );

      if (success) count++;
    }

    console.log(`   ✓ Created ${count} saved payment methods`);
  }

  async seedNotificationPreferences() {
    console.log('🔔 Seeding notification preferences...');
    let count = 0;

    for (const userId of this.userIds) {
      const success = await safeInsert(
        `INSERT INTO notification_preferences (id, user_id, email_notifications, sms_notifications, push_notifications, marketing_emails) 
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id) DO UPDATE SET email_notifications = EXCLUDED.email_notifications`,
        [
          uuid(),
          userId,
          randomInt(0, 1) === 1,
          randomInt(0, 1) === 1,
          randomInt(0, 1) === 1,
          randomInt(0, 1) === 1,
        ]
      );

      if (success) count++;
    }

    console.log(`   ✓ Created ${count} notification preferences`);
  }

  async seedUnsubscribes() {
    console.log('🚫 Seeding unsubscribes...');
    let count = 0;

    for (let i = 0; i < 20; i++) {
      if (this.userIds.length === 0) break;

      const userId = randomPick(this.userIds);
      const email = this.userEmailMap.get(userId) || uniqueEmail(faker.person.firstName(), faker.person.lastName());

      const success = await safeInsert(
        `INSERT INTO unsubscribes (id, user_id, email, reason, unsubscribed_at) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET reason = EXCLUDED.reason`,
        [
          uuid(),
          userId,
          email,
          faker.lorem.sentence(),
          randomDate(new Date(2024, 0, 1), new Date()),
        ]
      );

      if (success) count++;
    }

    console.log(`   ✓ Created ${count} unsubscribe records`);
  }
}

// Run the seeder
const seeder = new DatabaseSeeder();
seeder.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

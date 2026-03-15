import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

// Database connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'marketplace',
});

// Helper to generate UUID
const uuid = () => faker.string.uuid();

// Helper to generate random date within range
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper to generate random integer
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper to pick random element from array
const randomPick = <T>(arr: T[]): T => arr[randomInt(0, arr.length - 1)];

// Helper to pick multiple random elements
const randomPickMultiple = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, arr.length));
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
  private userIds: string[] = [];
  private customerIds: string[] = [];
  private providerIds: string[] = [];
  private adminIds: string[] = [];
  private categoryIds: string[] = [];
  private locationIds: string[] = [];
  private requestIds: string[] = [];
  private proposalIds: string[] = [];
  private jobIds: string[] = [];
  private paymentIds: string[] = [];
  private providerRecordIds: string[] = [];
  private couponIds: string[] = [];
  private planIds: string[] = [];

  async run() {
    console.log('🌱 Starting database seeding...\n');

    try {
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
      
    } catch (error) {
      console.error('❌ Error seeding database:', error);
      throw error;
    } finally {
      await pool.end();
    }
  }

  async seedServiceCategories() {
    console.log('📁 Seeding service categories...');
    for (const category of serviceCategories) {
      const id = uuid();
      await pool.query(
        `INSERT INTO service_categories (id, name, description, icon, active) 
         VALUES ($1, $2, $3, $4, $5)`,
        [id, category.name, category.description, category.icon, true]
      );
      this.categoryIds.push(id);
    }
    console.log(`   ✓ Created ${this.categoryIds.length} categories`);
  }

  async seedUsers() {
    console.log('👥 Seeding users...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create 1 admin
    const adminId = uuid();
    await pool.query(
      `INSERT INTO users (id, email, name, phone, password_hash, role, email_verified, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [adminId, 'admin@marketplace.com', 'Admin User', '+1234567890', hashedPassword, 'admin', true, 'active']
    );
    this.adminIds.push(adminId);
    this.userIds.push(adminId);

    // Create 100 customers
    for (let i = 0; i < 100; i++) {
      const id = uuid();
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      await pool.query(
        `INSERT INTO users (id, email, name, phone, password_hash, role, email_verified, phone_verified, profile_picture_url, timezone, language, last_login_at, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          id,
          faker.internet.email({ firstName, lastName }).toLowerCase(),
          `${firstName} ${lastName}`,
          faker.phone.number('+1##########'),
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
      this.customerIds.push(id);
      this.userIds.push(id);
    }

    // Create 50 providers
    for (let i = 0; i < 50; i++) {
      const id = uuid();
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      await pool.query(
        `INSERT INTO users (id, email, name, phone, password_hash, role, email_verified, phone_verified, profile_picture_url, timezone, language, last_login_at, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          id,
          faker.internet.email({ firstName, lastName }).toLowerCase(),
          `${firstName} ${lastName}`,
          faker.phone.number('+1##########'),
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
      this.providerIds.push(id);
      this.userIds.push(id);
    }

    console.log(`   ✓ Created ${this.userIds.length} users (${this.customerIds.length} customers, ${this.providerIds.length} providers, ${this.adminIds.length} admins)`);
  }

  async seedSessions() {
    console.log('🔐 Seeding sessions...');
    for (let i = 0; i < 100; i++) {
      const userId = randomPick(this.userIds);
      await pool.query(
        `INSERT INTO sessions (id, user_id, refresh_token, ip_address, user_agent, device_type, location, expires_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          uuid(),
          userId,
          faker.string.alphanumeric(64),
          faker.internet.ip(),
          faker.internet.userAgent(),
          randomPick(['desktop', 'mobile', 'tablet']),
          faker.location.city(),
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        ]
      );
    }
    console.log('   ✓ Created 100 sessions');
  }

  async seedLoginAttempts() {
    console.log('🔑 Seeding login attempts...');
    for (let i = 0; i < 200; i++) {
      const user = randomPick(this.userIds);
      const userEmail = await pool.query('SELECT email FROM users WHERE id = $1', [user]);
      await pool.query(
        `INSERT INTO login_attempts (id, email, ip_address, user_agent, location, success, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          uuid(),
          userEmail.rows[0].email,
          faker.internet.ip(),
          faker.internet.userAgent(),
          faker.location.city(),
          randomInt(0, 10) > 2, // 80% success rate
          randomDate(new Date(2024, 0, 1), new Date()),
        ]
      );
    }
    console.log('   ✓ Created 200 login attempts');
  }

  async seedProviders() {
    console.log('🏢 Seeding providers...');
    for (const userId of this.providerIds) {
      const id = uuid();
      await pool.query(
        `INSERT INTO providers (id, user_id, business_name, description, profile_picture_url, rating, total_jobs_completed, years_of_experience, service_area_radius, response_time_avg, verification_status, certifications) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          id,
          userId,
          faker.company.name(),
          faker.company.catchPhrase() + '. ' + faker.lorem.paragraph(),
          faker.image.url(),
          parseFloat((Math.random() * 2 + 3).toFixed(2)), // 3.0 to 5.0
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
      this.providerRecordIds.push(id);
    }
    console.log(`   ✓ Created ${this.providerRecordIds.length} providers`);
  }

  async seedProviderServices() {
    console.log('🔧 Seeding provider services...');
    let count = 0;
    for (const providerId of this.providerRecordIds) {
      const numServices = randomInt(1, 5);
      const selectedCategories = randomPickMultiple(this.categoryIds, numServices);
      for (const categoryId of selectedCategories) {
        await pool.query(
          `INSERT INTO provider_services (id, provider_id, category_id) 
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [uuid(), providerId, categoryId]
        );
        count++;
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
        await pool.query(
          `INSERT INTO provider_availability (id, provider_id, day_of_week, start_time, end_time) 
           VALUES ($1, $2, $3, $4, $5)`,
          [uuid(), providerId, day, '09:00:00', '17:00:00']
        );
        count++;
      }
      // Some also work weekends
      if (randomInt(0, 1) === 1) {
        await pool.query(
          `INSERT INTO provider_availability (id, provider_id, day_of_week, start_time, end_time) 
           VALUES ($1, $2, $3, $4, $5)`,
          [uuid(), providerId, 6, '10:00:00', '14:00:00']
        );
        count++;
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
        await pool.query(
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
        count++;
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
        await pool.query(
          `INSERT INTO provider_documents (id, provider_id, document_type, document_url, document_name, document_number, verified, expires_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            uuid(),
            providerId,
            docType,
            faker.internet.url(),
            faker.system.fileName(),
            faker.string.alphanumeric(10).toUpperCase(),
            randomInt(0, 1) === 1,
            new Date(Date.now() + randomInt(365, 1095) * 24 * 60 * 60 * 1000),
          ]
        );
        count++;
      }
    }
    console.log(`   ✓ Created ${count} documents`);
  }

  async seedLocations() {
    console.log('📍 Seeding locations...');
    for (let i = 0; i < 150; i++) {
      const city = randomPick(cities);
      const id = uuid();
      const userId = randomInt(0, 1) === 1 ? randomPick(this.userIds) : null;
      await pool.query(
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
      this.locationIds.push(id);
    }
    console.log(`   ✓ Created ${this.locationIds.length} locations`);
  }

  async seedServiceRequests() {
    console.log('📝 Seeding service requests...');
    const statuses = ['open', 'assigned', 'completed', 'cancelled'];
    const urgencies = ['low', 'medium', 'high', 'urgent'];

    for (let i = 0; i < 120; i++) {
      const id = uuid();
      const isAnonymous = randomInt(0, 10) < 3; // 30% anonymous
      const userId = isAnonymous ? null : randomPick(this.customerIds);
      const categoryId = randomPick(this.categoryIds);
      const locationId = randomPick(this.locationIds);

      await pool.query(
        `INSERT INTO service_requests (id, user_id, category_id, location_id, description, budget, images, preferred_date, urgency, expiry_date, view_count, status, guest_name, guest_email, guest_phone, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          id,
          userId,
          categoryId,
          locationId,
          faker.lorem.paragraphs(2),
          randomInt(50, 5000) * 100, // $50 to $5000 in cents
          JSON.stringify([faker.image.url(), faker.image.url()]),
          randomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
          randomPick(urgencies),
          new Date(Date.now() + randomInt(7, 30) * 24 * 60 * 60 * 1000),
          randomInt(0, 100),
          randomPick(statuses),
          isAnonymous ? faker.person.fullName() : null,
          isAnonymous ? faker.internet.email() : null,
          isAnonymous ? faker.phone.number('+1##########') : null,
          randomDate(new Date(2024, 0, 1), new Date()),
        ]
      );
      this.requestIds.push(id);

      // Create search entry
      const category = await pool.query('SELECT name FROM service_categories WHERE id = $1', [categoryId]);
      const location = await pool.query('SELECT city, state FROM locations WHERE id = $1', [locationId]);
      await pool.query(
        `INSERT INTO service_request_search (request_id, category, location, description) 
         VALUES ($1, $2, $3, $4)`,
        [
          id,
          category.rows[0]?.name || '',
          `${location.rows[0]?.city || ''}, ${location.rows[0]?.state || ''}`,
          faker.lorem.paragraph(),
        ]
      );
    }
    console.log(`   ✓ Created ${this.requestIds.length} service requests`);
  }

  async seedProposals() {
    console.log('💼 Seeding proposals...');
    const statuses = ['pending', 'accepted', 'rejected', 'withdrawn'];

    for (let i = 0; i < 200; i++) {
      const id = uuid();
      const requestId = randomPick(this.requestIds);
      const providerId = randomPick(this.providerRecordIds);
      const status = randomPick(statuses);

      await pool.query(
        `INSERT INTO proposals (id, request_id, provider_id, price, message, estimated_hours, start_date, completion_date, rejected_reason, status, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          id,
          requestId,
          providerId,
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
      this.proposalIds.push(id);
    }
    console.log(`   ✓ Created ${this.proposalIds.length} proposals`);
  }

  async seedJobs() {
    console.log('👷 Seeding jobs...');
    const statuses = ['scheduled', 'in_progress', 'completed', 'cancelled', 'disputed'];

    for (let i = 0; i < 80; i++) {
      const id = uuid();
      const requestId = randomPick(this.requestIds);
      
      // Get request details
      const request = await pool.query('SELECT user_id FROM service_requests WHERE id = $1', [requestId]);
      const customerId = request.rows[0]?.user_id;
      
      if (!customerId) continue; // Skip anonymous requests for jobs

      const providerId = randomPick(this.providerRecordIds);
      const status = randomPick(statuses);
      const createdAt = randomDate(new Date(2024, 0, 1), new Date());

      await pool.query(
        `INSERT INTO jobs (id, request_id, provider_id, customer_id, proposal_id, actual_amount, cancelled_by, cancellation_reason, status, started_at, completed_at, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          id,
          requestId,
          providerId,
          customerId,
          null, // Could link to a proposal
          randomInt(50, 5000) * 100,
          status === 'cancelled' ? randomPick([customerId, providerId]) : null,
          status === 'cancelled' ? faker.lorem.sentence() : null,
          status,
          status !== 'scheduled' ? randomDate(createdAt, new Date()) : null,
          status === 'completed' ? randomDate(createdAt, new Date()) : null,
          createdAt,
        ]
      );
      this.jobIds.push(id);
    }
    console.log(`   ✓ Created ${this.jobIds.length} jobs`);
  }

  async seedPayments() {
    console.log('💳 Seeding payments...');
    const statuses = ['pending', 'completed', 'failed', 'refunded'];

    for (const jobId of this.jobIds) {
      const id = uuid();
      const job = await pool.query('SELECT customer_id, provider_id, actual_amount FROM jobs WHERE id = $1', [jobId]);
      const { customer_id, provider_id, actual_amount } = job.rows[0];

      const amount = actual_amount || randomInt(50, 5000) * 100;
      const platformFee = Math.floor(amount * 0.15); // 15% platform fee
      const providerAmount = amount - platformFee;

      await pool.query(
        `INSERT INTO payments (id, job_id, user_id, provider_id, amount, platform_fee, provider_amount, currency, payment_method, status, transaction_id, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          id,
          jobId,
          customer_id,
          provider_id,
          amount,
          platformFee,
          providerAmount,
          'USD',
          randomPick(['card', 'paypal', 'bank_transfer']),
          randomPick(statuses),
          faker.string.alphanumeric(16).toUpperCase(),
          randomDate(new Date(2024, 0, 1), new Date()),
        ]
      );
      this.paymentIds.push(id);
    }
    console.log(`   ✓ Created ${this.paymentIds.length} payments`);
  }

  async seedRefunds() {
    console.log('💰 Seeding refunds...');
    const failedPayments = await pool.query(
      `SELECT id, amount FROM payments WHERE status IN ('failed', 'refunded') LIMIT 50`
    );

    for (const payment of failedPayments.rows) {
      await pool.query(
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
    }
    console.log(`   ✓ Created ${failedPayments.rows.length} refunds`);
  }

  async seedReviews() {
    console.log('⭐ Seeding reviews...');
    const completedJobs = await pool.query(
      `SELECT id, customer_id, provider_id FROM jobs WHERE status = 'completed'`
    );

    let count = 0;
    for (const job of completedJobs.rows) {
      // 80% chance of review
      if (randomInt(0, 10) < 8) {
        await pool.query(
          `INSERT INTO reviews (id, job_id, user_id, provider_id, rating, comment, helpful_count, verified_purchase, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
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
        count++;
      }
    }
    console.log(`   ✓ Created ${count} reviews`);
  }

  async seedMessages() {
    console.log('💬 Seeding messages...');
    let count = 0;
    for (const jobId of this.jobIds) {
      const job = await pool.query('SELECT customer_id, provider_id FROM jobs WHERE id = $1', [jobId]);
      const { customer_id, provider_id } = job.rows[0];

      const numMessages = randomInt(3, 15);
      for (let i = 0; i < numMessages; i++) {
        const senderId = randomPick([customer_id, provider_id]);
        const isRead = randomInt(0, 1) === 1;
        await pool.query(
          `INSERT INTO messages (id, job_id, sender_id, message, read, read_at, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            uuid(),
            jobId,
            senderId,
            faker.lorem.sentences(randomInt(1, 3)),
            isRead,
            isRead ? new Date() : null,
            randomDate(new Date(2024, 0, 1), new Date()),
          ]
        );
        count++;
      }
    }
    console.log(`   ✓ Created ${count} messages`);
  }

  async seedAttachments() {
    console.log('📎 Seeding attachments...');
    const messages = await pool.query('SELECT id FROM messages ORDER BY RANDOM() LIMIT 100');
    
    for (const message of messages.rows) {
      // 30% chance of attachment
      if (randomInt(0, 10) < 3) {
        await pool.query(
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
      }
    }
    console.log('   ✓ Created attachments');
  }

  async seedNotifications() {
    console.log('🔔 Seeding notifications...');
    const types = ['request_created', 'proposal_received', 'job_started', 'payment_completed', 'review_received', 'message_received'];
    
    for (let i = 0; i < 300; i++) {
      await pool.query(
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
    }
    console.log('   ✓ Created 300 notifications');
  }

  async seedNotificationDeliveries() {
    console.log('📨 Seeding notification deliveries...');
    const notifications = await pool.query('SELECT id FROM notifications');
    
    for (const notification of notifications.rows) {
      const channels = randomPickMultiple(['email', 'sms', 'push'], randomInt(1, 3));
      for (const channel of channels) {
        await pool.query(
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
      }
    }
    console.log('   ✓ Created notification deliveries');
  }

  async seedFavorites() {
    console.log('❤️ Seeding favorites...');
    let count = 0;
    for (let i = 0; i < 100; i++) {
      try {
        await pool.query(
          `INSERT INTO favorites (id, user_id, provider_id) 
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [uuid(), randomPick(this.customerIds), randomPick(this.providerRecordIds)]
        );
        count++;
      } catch (e) {
        // Skip duplicates
      }
    }
    console.log(`   ✓ Created ${count} favorites`);
  }

  async seedCoupons() {
    console.log('🎫 Seeding coupons...');
    for (let i = 0; i < 50; i++) {
      const id = uuid();
      await pool.query(
        `INSERT INTO coupons (id, code, discount_percent, max_uses, max_uses_per_user, min_purchase_amount, active, expires_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          id,
          faker.string.alphanumeric(8).toUpperCase(),
          randomInt(5, 50),
          randomInt(10, 1000),
          randomInt(1, 3),
          randomInt(0, 50) * 100,
          randomInt(0, 1) === 1,
          new Date(Date.now() + randomInt(30, 365) * 24 * 60 * 60 * 1000),
        ]
      );
      this.couponIds.push(id);
    }
    console.log(`   ✓ Created ${this.couponIds.length} coupons`);
  }

  async seedCouponUsage() {
    console.log('🏷️ Seeding coupon usage...');
    for (let i = 0; i < 80; i++) {
      await pool.query(
        `INSERT INTO coupon_usage (id, coupon_id, user_id, used_at) 
         VALUES ($1, $2, $3, $4)`,
        [
          uuid(),
          randomPick(this.couponIds),
          randomPick(this.userIds),
          randomDate(new Date(2024, 0, 1), new Date()),
        ]
      );
    }
    console.log('   ✓ Created 80 coupon usage records');
  }

  async seedDisputes() {
    console.log('⚖️ Seeding disputes...');
    const disputedJobs = await pool.query(
      `SELECT id, customer_id, provider_id FROM jobs WHERE status = 'disputed' LIMIT 10`
    );

    for (const job of disputedJobs.rows) {
      await pool.query(
        `INSERT INTO disputes (id, job_id, opened_by, reason, status, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          uuid(),
          job.id,
          randomPick([job.customer_id, job.provider_id]),
          faker.lorem.paragraph(),
          randomPick(['open', 'investigating', 'resolved', 'closed']),
          randomDate(new Date(2024, 0, 1), new Date()),
        ]
      );
    }
    console.log(`   ✓ Created ${disputedJobs.rows.length} disputes`);
  }

  async seedAuditLogs() {
    console.log('📋 Seeding audit logs...');
    const actions = ['create', 'update', 'delete', 'suspend', 'verify'];
    const entities = ['user', 'provider', 'request', 'job', 'payment'];

    for (let i = 0; i < 200; i++) {
      await pool.query(
        `INSERT INTO audit_logs (id, user_id, action, entity, entity_id, metadata, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          uuid(),
          randomPick([...this.adminIds, null]),
          randomPick(actions),
          randomPick(entities),
          uuid(),
          JSON.stringify({ ip: faker.internet.ip(), changes: ['field1', 'field2'] }),
          randomDate(new Date(2024, 0, 1), new Date()),
        ]
      );
    }
    console.log('   ✓ Created 200 audit logs');
  }

  async seedUserActivityLogs() {
    console.log('📊 Seeding user activity logs...');
    const actions = ['login', 'logout', 'profile_update', 'request_create', 'proposal_submit', 'payment_made'];

    for (let i = 0; i < 500; i++) {
      await pool.query(
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
    }
    console.log('   ✓ Created 500 user activity logs');
  }

  async seedEvents() {
    console.log('📡 Seeding events...');
    const eventTypes = ['request.created', 'proposal.submitted', 'job.started', 'payment.completed', 'review.submitted'];

    for (let i = 0; i < 300; i++) {
      await pool.query(
        `INSERT INTO events (id, event_type, payload, created_at) 
         VALUES ($1, $2, $3, $4)`,
        [
          uuid(),
          randomPick(eventTypes),
          JSON.stringify({ entity_id: uuid(), user_id: randomPick(this.userIds), data: {} }),
          randomDate(new Date(2024, 0, 1), new Date()),
        ]
      );
    }
    console.log('   ✓ Created 300 events');
  }

  async seedBackgroundJobs() {
    console.log('⚙️ Seeding background jobs...');
    const jobTypes = ['send_email', 'send_sms', 'process_payment', 'generate_report', 'cleanup_expired'];
    const statuses = ['pending', 'processing', 'completed', 'failed'];

    for (let i = 0; i < 150; i++) {
      await pool.query(
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
    }
    console.log('   ✓ Created 150 background jobs');
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

    for (const flag of flags) {
      await pool.query(
        `INSERT INTO feature_flags (key, enabled, rollout_percentage) 
         VALUES ($1, $2, $3)
         ON CONFLICT (key) DO NOTHING`,
        [flag.key, flag.enabled, randomInt(50, 100)]
      );
    }
    console.log('   ✓ Created 5 feature flags');
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

    for (const setting of settings) {
      await pool.query(
        `INSERT INTO system_settings (key, value, description) 
         VALUES ($1, $2, $3)
         ON CONFLICT (key) DO NOTHING`,
        [setting.key, setting.value, setting.description]
      );
    }
    console.log('   ✓ Created 5 system settings');
  }

  async seedAdminActions() {
    console.log('👮 Seeding admin actions...');
    const actions = ['suspend_user', 'verify_provider', 'resolve_dispute', 'refund_payment', 'delete_content'];
    const targetTypes = ['user', 'provider', 'dispute', 'payment', 'request'];

    for (let i = 0; i < 100; i++) {
      await pool.query(
        `INSERT INTO admin_actions (id, admin_id, action, target_type, target_id, reason, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          uuid(),
          randomPick(this.adminIds),
          randomPick(actions),
          randomPick(targetTypes),
          uuid(),
          faker.lorem.sentence(),
          randomDate(new Date(2024, 0, 1), new Date()),
        ]
      );
    }
    console.log('   ✓ Created 100 admin actions');
  }

  async seedContactMessages() {
    console.log('📧 Seeding contact messages...');
    const statuses = ['new', 'in_progress', 'resolved', 'closed'];

    for (let i = 0; i < 80; i++) {
      const hasUser = randomInt(0, 1) === 1;
      await pool.query(
        `INSERT INTO contact_messages (id, name, email, subject, message, status, user_id, ip_address, user_agent, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          uuid(),
          faker.person.fullName(),
          faker.internet.email(),
          faker.lorem.sentence(),
          faker.lorem.paragraphs(2),
          randomPick(statuses),
          hasUser ? randomPick(this.userIds) : null,
          faker.internet.ip(),
          faker.internet.userAgent(),
          randomDate(new Date(2024, 0, 1), new Date()),
        ]
      );
    }
    console.log('   ✓ Created 80 contact messages');
  }

  async seedDailyMetrics() {
    console.log('📈 Seeding daily metrics...');
    const startDate = new Date(2024, 0, 1);
    const endDate = new Date();
    const days = Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      await pool.query(
        `INSERT INTO daily_metrics (date, total_users, total_requests, total_jobs, total_payments) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (date) DO NOTHING`,
        [
          date.toISOString().split('T')[0],
          randomInt(100, 200) + i,
          randomInt(50, 150),
          randomInt(30, 100),
          randomInt(20, 80),
        ]
      );
    }
    console.log(`   ✓ Created ${days} daily metrics`);
  }

  async seedPricingPlans() {
    console.log('💵 Seeding pricing plans...');
    const plans = [
      {
        name: 'Basic',
        description: 'For individual service providers',
        price: 999, // $9.99
        billing_period: 'monthly',
        features: JSON.stringify(['Up to 10 proposals/month', 'Basic profile', 'Email support']),
      },
      {
        name: 'Professional',
        description: 'For established professionals',
        price: 2999, // $29.99
        billing_period: 'monthly',
        features: JSON.stringify(['Unlimited proposals', 'Featured profile', 'Priority support', 'Analytics']),
      },
      {
        name: 'Business',
        description: 'For service businesses',
        price: 9999, // $99.99
        billing_period: 'monthly',
        features: JSON.stringify(['Everything in Pro', 'Multiple team members', 'API access', 'Custom branding']),
      },
    ];

    for (const plan of plans) {
      const id = uuid();
      await pool.query(
        `INSERT INTO pricing_plans (id, name, description, price, billing_period, features, active) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, plan.name, plan.description, plan.price, plan.billing_period, plan.features, true]
      );
      this.planIds.push(id);
    }
    console.log(`   ✓ Created ${this.planIds.length} pricing plans`);
  }

  async seedSubscriptions() {
    console.log('📅 Seeding subscriptions...');
    for (let i = 0; i < 30; i++) {
      const status = randomPick(['active', 'cancelled', 'expired']);
      const startedAt = randomDate(new Date(2024, 0, 1), new Date());
      await pool.query(
        `INSERT INTO subscriptions (id, provider_id, plan_id, status, started_at, expires_at) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          uuid(),
          randomPick(this.providerRecordIds),
          randomPick(this.planIds),
          status,
          startedAt,
          new Date(startedAt.getTime() + 30 * 24 * 60 * 60 * 1000),
        ]
      );
    }
    console.log('   ✓ Created 30 subscriptions');
  }

  async seedSavedPaymentMethods() {
    console.log('💳 Seeding saved payment methods...');
    for (let i = 0; i < 60; i++) {
      await pool.query(
        `INSERT INTO saved_payment_methods (id, user_id, payment_type, card_brand, last_four, expiry_month, expiry_year, is_default, billing_email) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          uuid(),
          randomPick(this.userIds),
          'card',
          randomPick(['Visa', 'Mastercard', 'Amex']),
          faker.finance.accountNumber(4),
          randomInt(1, 12),
          randomInt(2024, 2030),
          randomInt(0, 4) === 0, // 25% default
          faker.internet.email(),
        ]
      );
    }
    console.log('   ✓ Created 60 saved payment methods');
  }

  async seedNotificationPreferences() {
    console.log('🔔 Seeding notification preferences...');
    for (const userId of this.userIds) {
      await pool.query(
        `INSERT INTO notification_preferences (id, user_id, email_notifications, sms_notifications, push_notifications, marketing_emails) 
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id) DO NOTHING`,
        [
          uuid(),
          userId,
          randomInt(0, 1) === 1,
          randomInt(0, 1) === 1,
          randomInt(0, 1) === 1,
          randomInt(0, 1) === 1,
        ]
      );
    }
    console.log(`   ✓ Created ${this.userIds.length} notification preferences`);
  }

  async seedUnsubscribes() {
    console.log('🚫 Seeding unsubscribes...');
    for (let i = 0; i < 20; i++) {
      const user = randomPick(this.userIds);
      const userEmail = await pool.query('SELECT email FROM users WHERE id = $1', [user]);
      
      await pool.query(
        `INSERT INTO unsubscribes (id, user_id, email, reason, unsubscribed_at) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO NOTHING`,
        [
          uuid(),
          user,
          userEmail.rows[0].email,
          faker.lorem.sentence(),
          randomDate(new Date(2024, 0, 1), new Date()),
        ]
      );
    }
    console.log('   ✓ Created unsubscribe records');
  }
}

// Run the seeder
const seeder = new DatabaseSeeder();
seeder.run().catch(console.error);

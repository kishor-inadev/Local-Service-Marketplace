const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from root .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres_dev_only',
  database: process.env.POSTGRES_DB || 'marketplace',
});

// All tables that should exist in the schema
const REQUIRED_TABLES = [
	"users",
	"sessions",
	"email_verification_tokens",
	"password_reset_tokens",
	"login_attempts",
	"login_history",
	"social_accounts",
	"user_devices",
	"two_factor_secrets",
	"magic_link_tokens",
	"account_deletion_requests",
	"providers",
	"service_categories",
	"provider_services",
	"provider_availability",
	"provider_portfolio",
	"provider_documents",
	"locations",
	"service_requests",
	"service_request_search",
	"proposals",
	"jobs",
	"payments",
	"payment_webhooks",
	"refunds",
	"reviews",
	"messages",
	"attachments",
	"notifications",
	"notification_deliveries",
	"favorites",
	"coupons",
	"coupon_usage",
	"disputes",
	"audit_logs",
	"user_activity_logs",
	"events",
	"background_jobs",
	"rate_limits",
	"feature_flags",
	"system_settings",
	"admin_actions",
	"contact_messages",
	"daily_metrics",
	"pricing_plans",
	"subscriptions",
	"saved_payment_methods",
	"notification_preferences",
	"unsubscribes",
	"provider_review_aggregates",
	// RBAC tables (seeded via roles/permissions/role_permissions)
	"roles",
	"permissions",
	"role_permissions",
	// Populated by trigger on message insert
	"conversations",
	// Seeded via review helpful votes
	"review_helpful_votes",
	// Dead-letter queue for BullMQ workers
	"failed_jobs",
	// Migration tracking infrastructure
	"schema_migrations",
];

async function verifySchema() {
  console.log('🔍 Verifying Database Schema...\n');

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful\n');

    // Get all tables in public schema
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const existingTables = result.rows.map(r => r.table_name);
    
    console.log(`📊 Found ${existingTables.length} tables in database\n`);

    // Check for missing tables
    const missingTables = REQUIRED_TABLES.filter(t => !existingTables.includes(t));
    
    // Check for extra tables
    const extraTables = existingTables.filter(t => !REQUIRED_TABLES.includes(t));

    // Display results
    if (missingTables.length === 0) {
      console.log('✅ All required tables exist!\n');
    } else {
      console.log(`❌ Missing ${missingTables.length} required tables:\n`);
      missingTables.forEach(table => {
        console.log(`   - ${table}`);
      });
      console.log('');
    }

    if (extraTables.length > 0) {
      console.log(`ℹ️  Found ${extraTables.length} additional tables (not used by seeder):\n`);
      extraTables.forEach(table => {
        console.log(`   - ${table}`);
      });
      console.log('');
    }

    // Intensive Column Check
    console.log('📋 Checking Critical Columns and Types...\n');
    
    const columnQuery = await pool.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);

    const tableColumns = columnQuery.rows.reduce((acc, col) => {
      if (!acc[col.table_name]) acc[col.table_name] = [];
      acc[col.table_name].push(col);
      return acc;
    }, {});

    let columnIssues = 0;

    // Check for display_id in user-facing tables
    const TABLES_NEEDING_DISPLAY_ID = [
      "users", "sessions", "providers", "service_categories", "locations",
      "service_requests", "proposals", "jobs", "payments", "refunds",
      "reviews", "messages", "notifications", "coupons", "disputes",
      "events", "background_jobs", "admin_actions", "subscriptions"
    ];

    TABLES_NEEDING_DISPLAY_ID.forEach(table => {
      if (existingTables.includes(table)) {
        const cols = tableColumns[table] || [];
        const hasDisplayId = cols.find(c => c.column_name === 'display_id');
        if (!hasDisplayId) {
          console.log(`   ❌ Table '${table}' is missing 'display_id'`);
          columnIssues++;
        }
      }
    });

    // Check for BIGINT in currency fields
    const CURRENCY_FIELDS = [
      { table: 'service_requests', column: 'budget' },
      { table: 'payments', column: 'amount' },
      { table: 'payments', column: 'platform_fee' },
      { table: 'payments', column: 'provider_amount' },
      { table: 'refunds', column: 'amount' },
      { table: 'pricing_plans', column: 'price' }
    ];

    CURRENCY_FIELDS.forEach(field => {
      if (existingTables.includes(field.table)) {
        const cols = tableColumns[field.table] || [];
        const col = cols.find(c => c.column_name === field.column);
        if (col && col.data_type !== 'bigint') {
          console.log(`   ❌ Field '${field.table}.${field.column}' should be 'bigint' but found '${col.data_type}'`);
          columnIssues++;
        }
      }
    });

    if (columnIssues === 0) {
      console.log('✅ All critical columns and types verified!\n');
    } else {
      console.log(`\n❌ Found ${columnIssues} column/type discrepancies\n`);
    }

    // Check foreign key constraints
    console.log('🔗 Checking Foreign Key Constraints...\n');
    
    const fkQuery = await pool.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, tc.constraint_name
    `);

    console.log(`✅ Found ${fkQuery.rows.length} foreign key constraints\n`);

    // Sample some key foreign keys
    const keyFKs = fkQuery.rows.filter(fk => 
      ['provider_services', 'providers', 'jobs', 'payments'].includes(fk.table_name)
    );

    if (keyFKs.length > 0) {
      console.log('Key Foreign Key Relationships:');
      keyFKs.slice(0, 10).forEach(fk => {
        console.log(`   ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
      console.log('');
    }

    // Check indexes
    const indexQuery = await pool.query(`
      SELECT
        schemaname,
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);

    console.log(`📑 Found ${indexQuery.rows.length} indexes\n`);

    // Check extensions
    const extQuery = await pool.query(`
      SELECT extname, extversion
      FROM pg_extension
      WHERE extname IN ('uuid-ossp', 'pgcrypto')
    `);

    console.log('🔌 Required Extensions:');
    const requiredExts = ['uuid-ossp', 'pgcrypto'];
    const existingExts = extQuery.rows.map(e => e.extname);
    
    requiredExts.forEach(ext => {
      if (existingExts.includes(ext)) {
        const version = extQuery.rows.find(e => e.extname === ext).extversion;
        console.log(`   ✅ ${ext} (v${version})`);
      } else {
        console.log(`   ❌ ${ext} - MISSING`);
        columnIssues++;
      }
    });
    console.log('');

    // Final verdict
    console.log('═══════════════════════════════════════════════════');
    
    if (missingTables.length === 0 && columnIssues === 0) {
      console.log('✅ SCHEMA IS COMPLETE AND READY FOR SEEDING');
      console.log('═══════════════════════════════════════════════════\n');
      console.log('You can now run: npm run seed\n');
      process.exit(0);
    } else {
      console.log('❌ SCHEMA IS INCOMPLETE OR HAS DISCREPANCIES');
      console.log('═══════════════════════════════════════════════════\n');
      console.log('To fix this, run:');
      console.log('  psql -U postgres -d marketplace -f schema.sql');
      console.log('\nOr with Docker:');
      console.log('  docker exec -i postgres psql -U postgres -d marketplace < database/schema.sql\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Ensure PostgreSQL is running');
    console.error('  2. Check .env file has correct credentials');
    console.error('  3. Verify database exists: createdb marketplace\n');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run verification
verifySchema();

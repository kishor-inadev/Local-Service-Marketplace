#!/usr/bin/env node

/**
 * Database Migration Runner
 * 
 * Applies SQL migration files in order, tracking which have been applied.
 * Supports up (apply) and down (rollback) operations.
 * 
 * Usage:
 *   node migrate.js up              # Apply all pending migrations
 *   node migrate.js up --to 015     # Apply up to migration 015
 *   node migrate.js down --to 014   # Rollback to migration 014
 *   node migrate.js status          # Show migration status
 *   node migrate.js create <name>   # Create a new migration file
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load environment variables
// Load local database/.env first so it takes precedence over docker.env
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
// docker.env fills in any remaining variables not set above (used inside Docker)
require('dotenv').config({ path: path.resolve(__dirname, '../docker.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

// ─── Database Connection ──────────────────────────────────────────────────────

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    return new Pool({ connectionString, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false });
  }
  return new Pool({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || process.env.POSTGRES_PASSWORD || 'postgres_dev_only',
    database: process.env.DATABASE_NAME || 'marketplace',
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });
}

// ─── Migration Tracking ──────────────────────────────────────────────────────

async function ensureTrackingTable(pool) {
  const trackingSql = fs.readFileSync(path.join(MIGRATIONS_DIR, '000_migration_tracking.sql'), 'utf8');
  await pool.query(trackingSql);
}

async function getAppliedMigrations(pool) {
  const result = await pool.query(
    'SELECT version, name, applied_at, checksum FROM schema_migrations ORDER BY version ASC'
  );
  return result.rows;
}

function getChecksum(content) {
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

// ─── Advisory Lock (Concurrency Safety) ──────────────────────────────────────

const MIGRATION_LOCK_ID = 839274628; // Arbitrary but fixed int32 for pg_advisory_lock

async function acquireLock(pool) {
  const result = await pool.query('SELECT pg_try_advisory_lock($1) AS acquired', [MIGRATION_LOCK_ID]);
  return result.rows[0].acquired;
}

async function releaseLock(pool) {
  await pool.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_ID]);
}

// ─── Migration File Discovery ─────────────────────────────────────────────────

function discoverMigrations() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => /^\d{3}_.*\.sql$/.test(f) && f !== '000_migration_tracking.sql')
    .sort();

  return files.map(file => {
    const match = file.match(/^(\d{3})_(.+)\.sql$/);
    const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

    // Split into UP and DOWN sections
    const downMarker = content.indexOf('-- DOWN');
    const upSql = downMarker >= 0 ? content.substring(0, downMarker).trim() : content.trim();
    const downSql = downMarker >= 0 ? content.substring(downMarker + 7).trim() : null;

    return {
      version: match[1],
      name: match[2],
      file,
      upSql,
      downSql,
      checksum: getChecksum(content),
    };
  });
}

// ─── Commands ─────────────────────────────────────────────────────────────────

async function migrateUp(pool, targetVersion) {
  const applied = await getAppliedMigrations(pool);
  const appliedVersions = new Set(applied.map(m => m.version));
  const migrations = discoverMigrations();
  const pending = migrations.filter(m => {
    if (appliedVersions.has(m.version)) return false;
    if (targetVersion && m.version > targetVersion) return false;
    return true;
  });

  if (pending.length === 0) {
    console.log('✅ No pending migrations.');
    return;
  }

  console.log(`\n📦 Applying ${pending.length} migration(s)...\n`);

  for (const migration of pending) {
    const start = Date.now();
    console.log(`  ⏳ ${migration.version}_${migration.name}...`);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(migration.upSql);
      await client.query(
        'INSERT INTO schema_migrations (version, name, checksum, execution_time_ms) VALUES ($1, $2, $3, $4)',
        [migration.version, migration.name, migration.checksum, Date.now() - start]
      );
      await client.query('COMMIT');
      console.log(`  ✅ ${migration.version}_${migration.name} (${Date.now() - start}ms)`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`  ❌ ${migration.version}_${migration.name} FAILED:`);
      console.error(`     ${err.message}`);
      process.exit(1);
    } finally {
      client.release();
    }
  }

  console.log(`\n✅ All migrations applied successfully.\n`);
}

async function migrateDown(pool, targetVersion) {
  if (!targetVersion) {
    console.error('❌ --to <version> is required for down migrations.');
    process.exit(1);
  }

  const applied = await getAppliedMigrations(pool);
  const migrations = discoverMigrations();
  const migrationsMap = new Map(migrations.map(m => [m.version, m]));

  // Find migrations to rollback (those applied AFTER target)
  const toRollback = applied
    .filter(a => a.version > targetVersion)
    .reverse(); // Rollback in reverse order

  if (toRollback.length === 0) {
    console.log('✅ No migrations to rollback.');
    return;
  }

  console.log(`\n🔄 Rolling back ${toRollback.length} migration(s)...\n`);

  for (const record of toRollback) {
    const migration = migrationsMap.get(record.version);
    if (!migration || !migration.downSql) {
      console.error(`  ❌ ${record.version}_${record.name}: No DOWN migration found. Cannot rollback.`);
      process.exit(1);
    }

    const start = Date.now();
    console.log(`  ⏳ Rolling back ${record.version}_${record.name}...`);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(migration.downSql);
      await client.query('DELETE FROM schema_migrations WHERE version = $1', [record.version]);
      await client.query('COMMIT');
      console.log(`  ✅ Rolled back ${record.version}_${record.name} (${Date.now() - start}ms)`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`  ❌ Rollback ${record.version}_${record.name} FAILED:`);
      console.error(`     ${err.message}`);
      process.exit(1);
    } finally {
      client.release();
    }
  }

  console.log(`\n✅ Rollback complete.\n`);
}

async function showStatus(pool) {
  const applied = await getAppliedMigrations(pool);
  const appliedVersions = new Map(applied.map(m => [m.version, m]));
  const migrations = discoverMigrations();

  console.log('\n📊 Migration Status\n');
  console.log('  Version  Status     Name                                      Applied At');
  console.log('  ───────  ─────────  ────────────────────────────────────────  ──────────────────────');

  for (const migration of migrations) {
    const record = appliedVersions.get(migration.version);
    const status = record ? '✅ Applied' : '⏳ Pending';
    const appliedAt = record ? new Date(record.applied_at).toISOString().replace('T', ' ').substring(0, 19) : '-';
    const name = migration.name.substring(0, 40).padEnd(40);
    console.log(`  ${migration.version}      ${status}  ${name}  ${appliedAt}`);
  }

  const pendingCount = migrations.filter(m => !appliedVersions.has(m.version)).length;
  console.log(`\n  Total: ${migrations.length} | Applied: ${applied.length} | Pending: ${pendingCount}\n`);
}

function createMigration(name) {
  if (!name) {
    console.error('❌ Migration name is required: node migrate.js create <name>');
    process.exit(1);
  }

  const existing = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => /^\d{3}_/.test(f))
    .sort();

  const lastVersion = existing.length > 0
    ? parseInt(existing[existing.length - 1].match(/^(\d{3})/)[1], 10)
    : 0;

  const nextVersion = String(lastVersion + 1).padStart(3, '0');
  const safeName = name.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
  const fileName = `${nextVersion}_${safeName}.sql`;
  const filePath = path.join(MIGRATIONS_DIR, fileName);

  const template = `-- Migration: ${name}
-- Version: ${nextVersion}
-- Date: ${new Date().toISOString().split('T')[0]}
-- Description: TODO - describe what this migration does

-- UP: Apply migration

-- TODO: Add your migration SQL here


-- DOWN
-- Rollback migration

-- TODO: Add rollback SQL here
`;

  fs.writeFileSync(filePath, template, 'utf8');
  console.log(`\n✅ Created migration: ${fileName}\n`);
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  const toIndex = args.indexOf('--to');
  const targetVersion = toIndex >= 0 ? args[toIndex + 1] : null;

  if (command === 'create') {
    createMigration(args.slice(1).join(' '));
    return;
  }

  const pool = createPool();

  try {
    await ensureTrackingTable(pool);

    switch (command) {
      case 'up': {
        const locked = await acquireLock(pool);
        if (!locked) {
          console.error('❌ Another migration is already running. Aborting.');
          process.exit(1);
        }
        try {
          await migrateUp(pool, targetVersion);
        } finally {
          await releaseLock(pool);
        }
        break;
      }
      case 'down': {
        const locked = await acquireLock(pool);
        if (!locked) {
          console.error('❌ Another migration is already running. Aborting.');
          process.exit(1);
        }
        try {
          await migrateDown(pool, targetVersion);
        } finally {
          await releaseLock(pool);
        }
        break;
      }
      case 'status':
        await showStatus(pool);
        break;
      default:
        console.log(`
Usage:
  node migrate.js up              Apply all pending migrations
  node migrate.js up --to 015     Apply up to migration 015
  node migrate.js down --to 014   Rollback to migration 014
  node migrate.js status          Show migration status
  node migrate.js create <name>   Create a new migration file
        `);
    }
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

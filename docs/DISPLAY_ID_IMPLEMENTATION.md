# Display ID Implementation Guide

## Overview

This guide describes how to add human-readable `display_id` fields to all major tables
in the Local Service Marketplace platform, including:

- Database schema migration and triggers (auto-generate on insert)
- Backend service changes (repositories, controllers, search, sort)
- API response format updates
- Frontend navigation, search, and display
- Email notifications using display IDs

**Format:** `PREFIX` + 8 random uppercase alphanumeric characters (A–Z, 0–9)
**Example:** `USR7K9X2MN4`, `JOB4R2F9HYZ`, `PAY8K3N2WQR`
**Total length:** 11 characters (3 prefix + 8 random)
**Collision probability:** ~1 in 2.8 trillion per prefix — zero concern at any scale

UUID internal primary keys are kept. `display_id` is an additional column for human use only.

---

## Prefix Reference

| Table | Prefix | Example |
|---|---|---|
| users | `USR` | `USR7K9X2MN4` |
| providers | `PRV` | `PRVB3P8WQ6T` |
| service_requests | `REQ` | `REQ4R2F9HYZ` |
| proposals | `PRP` | `PRPM6N3K8WD` |
| jobs | `JOB` | `JOBX5T7J2QR` |
| payments | `PAY` | `PAYH8K4N9FW` |
| reviews | `REV` | `REVC2V6P3LY` |
| messages | `MSG` | `MSGQ9W4R7TX` |
| notifications | `NTF` | `NTFE3J8M5GK` |
| disputes | `DSP` | `DSPY6F2H9NB` |
| service_categories | `CAT` | `CATW4K7T2RX` |
| coupons | `CPN` | `CPNL4V8R2FX` |
| refunds | `RFD` | `RFDT7M3K9WB` |
| events | `EVT` | `EVTP5N8H2QJ` |
| sessions | `SES` | `SESG6W3F9YR` |
| locations | `LOC` | `LOCP2K8T5NM` |
| subscriptions | `SUB` | `SUBR4K7P9WL` |
| coupons | `CPN` | `CPNM2J8T5FQ` |
| admin_actions | `ADM` | `ADMX9K4R2PL` |
| background_jobs | `BGJ` | `BGJL5T8K3WX` |

---

## Part 1: Database Migration

### Step 1.1 — Shared Generator Function

Run this SQL once. It creates a single reusable function that all table-specific triggers call.

```sql
-- =============================================================================
-- SHARED: Random alphanumeric generator
-- =============================================================================
CREATE OR REPLACE FUNCTION generate_display_id(prefix TEXT)
RETURNS TEXT AS $$
DECLARE
  chars  TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := prefix;
  i      INT;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * 36 + 1)::INT, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### Step 1.2 — Per-Table Trigger Functions (with collision-retry)

```sql
-- =============================================================================
-- USERS
-- =============================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;

CREATE OR REPLACE FUNCTION set_users_display_id() RETURNS TRIGGER AS $$
DECLARE candidate TEXT;
BEGIN
  IF NEW.display_id IS NULL THEN
    LOOP
      candidate := generate_display_id('USR');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM users WHERE display_id = candidate);
    END LOOP;
    NEW.display_id := candidate;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_display_id ON users;
CREATE TRIGGER trg_users_display_id
  BEFORE INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION set_users_display_id();

-- Backfill existing rows
UPDATE users SET display_id = subq.did
FROM (
  SELECT id,
    'USR' || string_agg(
      substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), ''
    ) AS did
  FROM users, generate_series(1,8)
  WHERE display_id IS NULL
  GROUP BY id
) subq
WHERE users.id = subq.id AND users.display_id IS NULL;


-- =============================================================================
-- PROVIDERS
-- =============================================================================
ALTER TABLE providers ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;

CREATE OR REPLACE FUNCTION set_providers_display_id() RETURNS TRIGGER AS $$
DECLARE candidate TEXT;
BEGIN
  IF NEW.display_id IS NULL THEN
    LOOP
      candidate := generate_display_id('PRV');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM providers WHERE display_id = candidate);
    END LOOP;
    NEW.display_id := candidate;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_providers_display_id ON providers;
CREATE TRIGGER trg_providers_display_id
  BEFORE INSERT ON providers
  FOR EACH ROW EXECUTE FUNCTION set_providers_display_id();

UPDATE providers SET display_id = subq.did
FROM (
  SELECT id, 'PRV' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM providers, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE providers.id = subq.id AND providers.display_id IS NULL;


-- =============================================================================
-- SERVICE_REQUESTS
-- =============================================================================
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;

CREATE OR REPLACE FUNCTION set_service_requests_display_id() RETURNS TRIGGER AS $$
DECLARE candidate TEXT;
BEGIN
  IF NEW.display_id IS NULL THEN
    LOOP
      candidate := generate_display_id('REQ');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM service_requests WHERE display_id = candidate);
    END LOOP;
    NEW.display_id := candidate;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_service_requests_display_id ON service_requests;
CREATE TRIGGER trg_service_requests_display_id
  BEFORE INSERT ON service_requests
  FOR EACH ROW EXECUTE FUNCTION set_service_requests_display_id();

UPDATE service_requests SET display_id = subq.did
FROM (
  SELECT id, 'REQ' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM service_requests, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE service_requests.id = subq.id AND service_requests.display_id IS NULL;


-- =============================================================================
-- PROPOSALS
-- =============================================================================
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;

CREATE OR REPLACE FUNCTION set_proposals_display_id() RETURNS TRIGGER AS $$
DECLARE candidate TEXT;
BEGIN
  IF NEW.display_id IS NULL THEN
    LOOP
      candidate := generate_display_id('PRP');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM proposals WHERE display_id = candidate);
    END LOOP;
    NEW.display_id := candidate;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_proposals_display_id ON proposals;
CREATE TRIGGER trg_proposals_display_id
  BEFORE INSERT ON proposals
  FOR EACH ROW EXECUTE FUNCTION set_proposals_display_id();

UPDATE proposals SET display_id = subq.did
FROM (
  SELECT id, 'PRP' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM proposals, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE proposals.id = subq.id AND proposals.display_id IS NULL;


-- =============================================================================
-- JOBS
-- =============================================================================
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;

CREATE OR REPLACE FUNCTION set_jobs_display_id() RETURNS TRIGGER AS $$
DECLARE candidate TEXT;
BEGIN
  IF NEW.display_id IS NULL THEN
    LOOP
      candidate := generate_display_id('JOB');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM jobs WHERE display_id = candidate);
    END LOOP;
    NEW.display_id := candidate;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_jobs_display_id ON jobs;
CREATE TRIGGER trg_jobs_display_id
  BEFORE INSERT ON jobs
  FOR EACH ROW EXECUTE FUNCTION set_jobs_display_id();

UPDATE jobs SET display_id = subq.did
FROM (
  SELECT id, 'JOB' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM jobs, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE jobs.id = subq.id AND jobs.display_id IS NULL;


-- =============================================================================
-- PAYMENTS
-- =============================================================================
ALTER TABLE payments ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;

CREATE OR REPLACE FUNCTION set_payments_display_id() RETURNS TRIGGER AS $$
DECLARE candidate TEXT;
BEGIN
  IF NEW.display_id IS NULL THEN
    LOOP
      candidate := generate_display_id('PAY');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM payments WHERE display_id = candidate);
    END LOOP;
    NEW.display_id := candidate;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payments_display_id ON payments;
CREATE TRIGGER trg_payments_display_id
  BEFORE INSERT ON payments
  FOR EACH ROW EXECUTE FUNCTION set_payments_display_id();

UPDATE payments SET display_id = subq.did
FROM (
  SELECT id, 'PAY' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM payments, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE payments.id = subq.id AND payments.display_id IS NULL;


-- =============================================================================
-- REVIEWS
-- =============================================================================
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;

CREATE OR REPLACE FUNCTION set_reviews_display_id() RETURNS TRIGGER AS $$
DECLARE candidate TEXT;
BEGIN
  IF NEW.display_id IS NULL THEN
    LOOP
      candidate := generate_display_id('REV');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM reviews WHERE display_id = candidate);
    END LOOP;
    NEW.display_id := candidate;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reviews_display_id ON reviews;
CREATE TRIGGER trg_reviews_display_id
  BEFORE INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION set_reviews_display_id();

UPDATE reviews SET display_id = subq.did
FROM (
  SELECT id, 'REV' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM reviews, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE reviews.id = subq.id AND reviews.display_id IS NULL;


-- =============================================================================
-- MESSAGES
-- =============================================================================
ALTER TABLE messages ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;

CREATE OR REPLACE FUNCTION set_messages_display_id() RETURNS TRIGGER AS $$
DECLARE candidate TEXT;
BEGIN
  IF NEW.display_id IS NULL THEN
    LOOP
      candidate := generate_display_id('MSG');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM messages WHERE display_id = candidate);
    END LOOP;
    NEW.display_id := candidate;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_messages_display_id ON messages;
CREATE TRIGGER trg_messages_display_id
  BEFORE INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION set_messages_display_id();

UPDATE messages SET display_id = subq.did
FROM (
  SELECT id, 'MSG' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM messages, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE messages.id = subq.id AND messages.display_id IS NULL;


-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;

CREATE OR REPLACE FUNCTION set_notifications_display_id() RETURNS TRIGGER AS $$
DECLARE candidate TEXT;
BEGIN
  IF NEW.display_id IS NULL THEN
    LOOP
      candidate := generate_display_id('NTF');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM notifications WHERE display_id = candidate);
    END LOOP;
    NEW.display_id := candidate;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notifications_display_id ON notifications;
CREATE TRIGGER trg_notifications_display_id
  BEFORE INSERT ON notifications
  FOR EACH ROW EXECUTE FUNCTION set_notifications_display_id();

UPDATE notifications SET display_id = subq.did
FROM (
  SELECT id, 'NTF' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM notifications, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE notifications.id = subq.id AND notifications.display_id IS NULL;


-- =============================================================================
-- DISPUTES
-- =============================================================================
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;

CREATE OR REPLACE FUNCTION set_disputes_display_id() RETURNS TRIGGER AS $$
DECLARE candidate TEXT;
BEGIN
  IF NEW.display_id IS NULL THEN
    LOOP
      candidate := generate_display_id('DSP');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM disputes WHERE display_id = candidate);
    END LOOP;
    NEW.display_id := candidate;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_disputes_display_id ON disputes;
CREATE TRIGGER trg_disputes_display_id
  BEFORE INSERT ON disputes
  FOR EACH ROW EXECUTE FUNCTION set_disputes_display_id();

UPDATE disputes SET display_id = subq.did
FROM (
  SELECT id, 'DSP' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM disputes, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE disputes.id = subq.id AND disputes.display_id IS NULL;


-- =============================================================================
-- REFUNDS
-- =============================================================================
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;

CREATE OR REPLACE FUNCTION set_refunds_display_id() RETURNS TRIGGER AS $$
DECLARE candidate TEXT;
BEGIN
  IF NEW.display_id IS NULL THEN
    LOOP
      candidate := generate_display_id('RFD');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM refunds WHERE display_id = candidate);
    END LOOP;
    NEW.display_id := candidate;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_refunds_display_id ON refunds;
CREATE TRIGGER trg_refunds_display_id
  BEFORE INSERT ON refunds
  FOR EACH ROW EXECUTE FUNCTION set_refunds_display_id();

UPDATE refunds SET display_id = subq.did
FROM (
  SELECT id, 'RFD' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM refunds, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE refunds.id = subq.id AND refunds.display_id IS NULL;


-- =============================================================================
-- COUPONS
-- =============================================================================
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;

CREATE OR REPLACE FUNCTION set_coupons_display_id() RETURNS TRIGGER AS $$
DECLARE candidate TEXT;
BEGIN
  IF NEW.display_id IS NULL THEN
    LOOP
      candidate := generate_display_id('CPN');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM coupons WHERE display_id = candidate);
    END LOOP;
    NEW.display_id := candidate;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_coupons_display_id ON coupons;
CREATE TRIGGER trg_coupons_display_id
  BEFORE INSERT ON coupons
  FOR EACH ROW EXECUTE FUNCTION set_coupons_display_id();

UPDATE coupons SET display_id = subq.did
FROM (
  SELECT id, 'CPN' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM coupons, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE coupons.id = subq.id AND coupons.display_id IS NULL;


-- =============================================================================
-- SERVICE_CATEGORIES
-- =============================================================================
ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;

CREATE OR REPLACE FUNCTION set_service_categories_display_id() RETURNS TRIGGER AS $$
DECLARE candidate TEXT;
BEGIN
  IF NEW.display_id IS NULL THEN
    LOOP
      candidate := generate_display_id('CAT');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM service_categories WHERE display_id = candidate);
    END LOOP;
    NEW.display_id := candidate;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_service_categories_display_id ON service_categories;
CREATE TRIGGER trg_service_categories_display_id
  BEFORE INSERT ON service_categories
  FOR EACH ROW EXECUTE FUNCTION set_service_categories_display_id();

UPDATE service_categories SET display_id = subq.did
FROM (
  SELECT id, 'CAT' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM service_categories, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE service_categories.id = subq.id AND service_categories.display_id IS NULL;


-- =============================================================================
-- SUBSCRIPTIONS
-- =============================================================================
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;

CREATE OR REPLACE FUNCTION set_subscriptions_display_id() RETURNS TRIGGER AS $$
DECLARE candidate TEXT;
BEGIN
  IF NEW.display_id IS NULL THEN
    LOOP
      candidate := generate_display_id('SUB');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM subscriptions WHERE display_id = candidate);
    END LOOP;
    NEW.display_id := candidate;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_subscriptions_display_id ON subscriptions;
CREATE TRIGGER trg_subscriptions_display_id
  BEFORE INSERT ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_subscriptions_display_id();

UPDATE subscriptions SET display_id = subq.did
FROM (
  SELECT id, 'SUB' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM subscriptions, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE subscriptions.id = subq.id AND subscriptions.display_id IS NULL;
```

### Step 1.3 — Indexes for Fast Lookup

```sql
-- Index on every display_id for fast lookups (lookups by display_id are as fast as by UUID)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_display_id               ON users(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_providers_display_id           ON providers(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_requests_display_id    ON service_requests(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_proposals_display_id           ON proposals(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_display_id                ON jobs(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_display_id            ON payments(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_display_id             ON reviews(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_display_id            ON messages(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_display_id       ON notifications(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_disputes_display_id            ON disputes(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_refunds_display_id             ON refunds(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_display_id             ON coupons(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_categories_display_id  ON service_categories(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_display_id       ON subscriptions(display_id);
```

### Step 1.4 — Verify Migration

```sql
-- Should return 0 for every table
SELECT 'users'             , count(*) FROM users             WHERE display_id IS NULL
UNION ALL SELECT 'providers'        , count(*) FROM providers        WHERE display_id IS NULL
UNION ALL SELECT 'service_requests' , count(*) FROM service_requests WHERE display_id IS NULL
UNION ALL SELECT 'proposals'        , count(*) FROM proposals        WHERE display_id IS NULL
UNION ALL SELECT 'jobs'             , count(*) FROM jobs             WHERE display_id IS NULL
UNION ALL SELECT 'payments'         , count(*) FROM payments         WHERE display_id IS NULL
UNION ALL SELECT 'reviews'          , count(*) FROM reviews          WHERE display_id IS NULL;

-- Sample display IDs
SELECT display_id FROM users LIMIT 5;
SELECT display_id FROM jobs  LIMIT 5;
```

---

## Part 2: Backend — Repository Changes

Each repository needs a helper to resolve either a UUID or display_id to UUID for internal use.

### Step 2.1 — Shared utility: `resolveId`

Create this helper in each service's `common/utils/` directory (same pattern applies to all services).

**`src/common/utils/resolve-id.util.ts`** — add to every service

```typescript
import { Pool } from 'pg';
import { NotFoundException } from '@nestjs/common';

/**
 * Given an id string that could be either a UUID or a display_id,
 * returns the internal UUID from the specified table.
 *
 * Usage:
 *   const uuid = await resolveId(pool, 'jobs', jobId);
 */
export async function resolveId(
  pool: Pool,
  table: string,
  idOrDisplayId: string,
): Promise<string> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    idOrDisplayId,
  );

  if (isUuid) {
    return idOrDisplayId; // Already a UUID, return as-is
  }

  // lookup by display_id
  const result = await pool.query(
    `SELECT id FROM ${table} WHERE display_id = $1`,
    [idOrDisplayId.toUpperCase()],
  );

  if (!result.rows[0]) {
    throw new NotFoundException(`${table} with id '${idOrDisplayId}' not found`);
  }

  return result.rows[0].id;
}
```

### Step 2.2 — Repository pattern (example: identity-service user.repository.ts)

```typescript
// In user.repository.ts — add display_id to SELECT and add findByDisplayId method

async findById(id: string): Promise<User | null> {
  const query = `
    SELECT id, display_id, email, name, phone, role, status,
           email_verified, profile_picture_url, timezone, language,
           created_at, updated_at, last_login_at, deleted_at
    FROM users WHERE id = $1 AND deleted_at IS NULL
  `;
  const result = await this.pool.query(query, [id]);
  return result.rows[0] || null;
}

// NEW: lookup by display_id
async findByDisplayId(displayId: string): Promise<User | null> {
  const query = `
    SELECT id, display_id, email, name, phone, role, status,
           email_verified, profile_picture_url, timezone, language,
           created_at, updated_at, last_login_at, deleted_at
    FROM users WHERE display_id = $1 AND deleted_at IS NULL
  `;
  const result = await this.pool.query(query, [displayId.toUpperCase()]);
  return result.rows[0] || null;
}

// NEW: resolve either UUID or display_id → always returns a User
async findByIdOrDisplayId(id: string): Promise<User | null> {
  const isUuid = /^[0-9a-f-]{36}$/i.test(id);
  return isUuid ? this.findById(id) : this.findByDisplayId(id);
}
```

### Step 2.3 — Add `display_id` to all SELECT queries

In every repository file, update all `SELECT` statements to include `display_id`:

```sql
-- BEFORE
SELECT id, email, name, ... FROM users WHERE id = $1

-- AFTER
SELECT id, display_id, email, name, ... FROM users WHERE id = $1
```

Do this for every table that has `display_id`.

---

## Part 3: Backend — Controller Changes

### Step 3.1 — Accept display_id in URL params

Controllers that take `:id` should accept both UUID and display_id.
Replace `ParseUUIDPipe` validation with a custom pipe.

**`src/common/pipes/flexible-id.pipe.ts`** — add to every service

```typescript
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DISPLAY_ID_REGEX = /^[A-Z]{2,4}[A-Z0-9]{8}$/;

@Injectable()
export class FlexibleIdPipe implements PipeTransform {
  transform(value: string) {
    if (!value) throw new BadRequestException('ID is required');
    const upper = value.toUpperCase();
    if (UUID_REGEX.test(value) || DISPLAY_ID_REGEX.test(upper)) {
      return upper; // normalise to uppercase for display_id lookups
    }
    throw new BadRequestException(
      `Invalid ID format: must be a UUID or a display ID (e.g. JOB4R2F9HYZ)`,
    );
  }
}
```

**Controller usage:**

```typescript
// BEFORE
@Get(':id')
async getJob(@Param('id', ParseUUIDPipe) id: string) { ... }

// AFTER
@Get(':id')
async getJob(@Param('id', FlexibleIdPipe) id: string) {
  // id is now either a UUID or display_id — pass to service which calls resolveId()
}
```

### Step 3.2 — Service layer resolves ID before DB call

```typescript
// In job.service.ts
async getJob(idOrDisplayId: string): Promise<Job> {
  const uuid = await resolveId(this.pool, 'jobs', idOrDisplayId);
  return this.jobRepository.findById(uuid);
}
```

---

## Part 4: API Response Format

Every API response that returns a resource must include `display_id`.

### Step 4.1 — Updated response shape

```json
{
  "success": true,
  "message": "Job retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "display_id": "JOBX5T7J2QR",
    "status": "in_progress",
    "customer_id": "...",
    "provider_id": "...",
    "created_at": "2026-04-05T10:00:00Z"
  }
}
```

### Step 4.2 — List responses also include display_id

```json
{
  "success": true,
  "data": [
    { "id": "uuid-1", "display_id": "JOBX5T7J2QR", "status": "in_progress" },
    { "id": "uuid-2", "display_id": "JOB4R2F9HYZ", "status": "completed" }
  ],
  "meta": { "total": 350, "page": 1, "limit": 20 }
}
```

---

## Part 5: Search, Sort, and Filter by display_id

### Step 5.1 — Search endpoint accepts display_id as a query param

```
GET /jobs?search=JOBX5T7J2QR           → returns matching job
GET /jobs?search=JOBX5T               → partial prefix match (ILIKE)
GET /requests?search=REQ4R2F9HYZ      → find request by display_id
GET /users?search=USR7K9X2MN4         → admin user lookup
```

### Step 5.2 — Repository search pattern

```typescript
// In request.repository.ts — updated search query
async searchRequests(search?: string, ...other params): Promise<ServiceRequest[]> {
  let whereClause = 'WHERE deleted_at IS NULL';
  const values: any[] = [];
  let idx = 1;

  if (search) {
    // Match display_id (exact or prefix) OR description text
    whereClause += ` AND (
      display_id ILIKE $${idx}
      OR description ILIKE $${idx}
    )`;
    values.push(`${search.toUpperCase()}%`);
    idx++;
    // Also add a second param for description with original case
    whereClause = whereClause.replace(`$${idx - 1}`, `$${idx - 1}`);
    // OR: two separate params
    // values.push(`%${search}%`);  idx++;
  }

  const query = `
    SELECT id, display_id, user_id, category_id, description,
           budget, status, urgency, created_at, updated_at
    FROM service_requests
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${idx} OFFSET $${idx + 1}
  `;
  ...
}
```

### Step 5.3 — Sorting includes display_id as a sort option

```typescript
export enum RequestSortBy {
  CREATED_AT = 'created_at',
  BUDGET     = 'budget',
  DISPLAY_ID = 'display_id',   // <-- add this
  STATUS     = 'status',
}
```

---

## Part 6: Frontend Changes

### Step 6.1 — TypeScript types

Update all entity type definitions to include `display_id`:

**`frontend/types/index.ts`** (or equivalent type files)

```typescript
export interface Job {
  id: string;
  display_id: string;       // e.g. "JOBX5T7J2QR"
  status: string;
  customer_id: string;
  provider_id: string;
  created_at: string;
  // ...existing fields
}

export interface ServiceRequest {
  id: string;
  display_id: string;       // e.g. "REQ4R2F9HYZ"
  // ...
}

export interface User {
  id: string;
  display_id: string;       // e.g. "USR7K9X2MN4"
  // ...
}

export interface Payment {
  id: string;
  display_id: string;       // e.g. "PAYH8K4N9FW"
  // ...
}

// Repeat for: Provider, Proposal, Review, Message, Notification
```

### Step 6.2 — Navigation uses display_id in URLs

URLs become human-readable. Internal lookups still use UUID internally in API calls.

```typescript
// frontend/config/constants.ts — update route helpers
export const ROUTES = {
  // Use display_id in URLs (readable, not a UUID)
  JOB_DETAIL:     (displayId: string) => `/dashboard/jobs/${displayId}`,
  REQUEST_DETAIL: (displayId: string) => `/dashboard/requests/${displayId}`,
  PROVIDER_PROFILE: (displayId: string) => `/providers/${displayId}`,
  PAYMENT_DETAIL: (displayId: string) => `/dashboard/payments/${displayId}`,
};
```

```tsx
// In job list component — link uses display_id
<Link href={ROUTES.JOB_DETAIL(job.display_id)}>
  View Job {job.display_id}
</Link>
```

### Step 6.3 — Display in UI (badges, tables, detail pages)

```tsx
// JobCard component
function JobCard({ job }: { job: Job }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3>Job Details</h3>
          {/* Human-readable ID displayed as a small badge */}
          <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {job.display_id}
          </span>
        </div>
      </CardHeader>
      ...
    </Card>
  );
}
```

### Step 6.4 — Search bar using display_id

```tsx
// SearchBar component
function SearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Backend accepts both display_id and text search
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <form onSubmit={handleSearch}>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search by ID (e.g. JOB4R2F9HYZ) or keyword..."
      />
    </form>
  );
}
```

### Step 6.5 — API service functions pass display_id or UUID

```typescript
// frontend/services/job-service.ts
export const jobService = {
  // Accepts either UUID or display_id — backend handles both
  getJob: async (idOrDisplayId: string) => {
    const response = await apiClient.get(`/jobs/${idOrDisplayId}`);
    return response.data.data;
  },

  // Search with optional display_id query
  searchJobs: async (params: { search?: string; page?: number; limit?: number }) => {
    const response = await apiClient.get('/jobs', { params });
    return response.data;
  },
};
```

### Step 6.6 — Copy-to-clipboard for display_id

Add a small copy button next to display IDs so users can easily share them.

```tsx
function DisplayIdBadge({ displayId }: { displayId: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(displayId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="text-xs font-mono bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded flex items-center gap-1"
      title="Copy ID"
    >
      {displayId}
      {copied ? <CheckIcon size={10} /> : <CopyIcon size={10} />}
    </button>
  );
}
```

---

## Part 7: Email Templates

### Step 7.1 — Use display_id in all email templates

In `comms-service/src/notification/services/email-worker.service.ts` and all email templates,
replace raw UUIDs with display_ids.

**Email subject lines:**
```
✅ Job JOBX5T7J2QR has been completed
💰 Payment PAYH8K4N9FW confirmed - ₹2,500
📋 New proposal for request REQ4R2F9HYZ
🔔 Dispute DSP7K9X2MN4 opened - Action required
```

**Email body example:**
```typescript
// In notification.service.ts
function buildEmailBody(type: string, data: Record<string, any>): string {
  switch (type) {
    case 'job_completed':
      return `
        Your job <strong>${data.job_display_id}</strong> has been completed.
        <br/>
        <a href="${process.env.APP_URL}/dashboard/jobs/${data.job_display_id}">
          View Job ${data.job_display_id}
        </a>
      `;
    case 'payment_completed':
      return `
        Payment <strong>${data.payment_display_id}</strong> of 
        ${data.amount} has been processed.
        <br/>
        Reference: ${data.payment_display_id}
      `;
    case 'proposal_received':
      return `
        You have a new proposal on request <strong>${data.request_display_id}</strong>.
        <br/>
        <a href="${process.env.APP_URL}/dashboard/requests/${data.request_display_id}">
          View Request ${data.request_display_id}
        </a>
      `;
    default:
      return data.message;
  }
}
```

### Step 7.2 — Pass display_id in notification payload

When creating notifications, always include the display_id in `metadata`:

```typescript
// In marketplace-service, when a job is completed:
await this.notificationClient.send({
  user_id: job.customer_id,
  type: 'job_completed',
  message: `Your job ${job.display_id} has been completed.`,
  metadata: {
    job_id:         job.id,          // UUID for internal linking
    job_display_id: job.display_id,  // Human-readable for emails/display
  },
});
```

---

## Part 8: Schema.sql — Permanent Integration

Also update `database/schema.sql` to include `display_id` in the initial table definitions
so any fresh database setup includes it from day one.

**For each affected table in schema.sql, add the column and trigger call:**

```sql
-- Example for users table in schema.sql
CREATE TABLE IF NOT EXISTS users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id          VARCHAR(11) UNIQUE,     -- <-- ADD THIS LINE
  email               VARCHAR(255) UNIQUE NOT NULL,
  -- ...rest of columns
);

-- After all table definitions, add:
-- 1. The generate_display_id function
-- 2. All trigger functions
-- 3. All triggers
-- (copy from Part 1 of this guide)
```

---

## Part 9: Implementation Order

Follow this order to avoid breaking changes:

1. **Database first** — Run the SQL in Part 1 against the live DB. Zero downtime (adds columns, existing data unaffected until backfill).
2. **Backfill** — Run the `UPDATE` statements to populate all existing rows.
3. **Verify** — Run the verification query in Step 1.4.
4. **Backend repositories** — Add `display_id` to all SELECT queries and add `findByDisplayId` methods.
5. **Backend controllers** — Replace `ParseUUIDPipe` with `FlexibleIdPipe`, update service layer.
6. **API test** — Confirm responses include `display_id`, and that `/jobs/JOBX5T7J2QR` works.
7. **Frontend types** — Add `display_id` to all TypeScript interfaces.
8. **Frontend display** — Show `display_id` in badges, tables, detail pages.
9. **Frontend navigation** — Use `display_id` in route URLs.
10. **Frontend search** — Pass `display_id` as search query to backend.
11. **Email templates** — Include `display_id` in subjects and body.
12. **schema.sql** — Update so future fresh installs include it from the start.
13. **Tests** — Update existing tests to expect `display_id` in responses, add tests for lookup by display_id.

---

## Part 10: Testing Checklist

After implementation, verify the following:

```bash
# 1. DB — All rows have display_id
docker exec marketplace-postgres psql -U postgres -d marketplace -c \
  "SELECT 'users', count(*) FROM users WHERE display_id IS NULL \
   UNION ALL SELECT 'jobs', count(*) FROM jobs WHERE display_id IS NULL;"

# 2. API — display_id in response
curl http://localhost:3800/jobs | jq '.data[0].display_id'
# Expected: "JOBxxxxxxxx"

# 3. Lookup by display_id
export DID=$(curl -s http://localhost:3800/jobs | jq -r '.data[0].display_id')
curl http://localhost:3800/jobs/$DID | jq '.data.display_id'
# Expected: same display_id

# 4. Lookup by UUID still works
export UUID=$(curl -s http://localhost:3800/jobs | jq -r '.data[0].id')
curl http://localhost:3800/jobs/$UUID | jq '.data.display_id'
# Expected: same display_id

# 5. Search by display_id
curl "http://localhost:3800/jobs?search=$DID" | jq '.data | length'
# Expected: 1

# 6. Invalid ID rejected
curl http://localhost:3800/jobs/NOTANID | jq '.statusCode'
# Expected: 400
```

---

## Quick Reference

| Scenario | Use |
|---|---|
| Internal FK references, DB joins | UUID |
| URL routes in browser | display_id |
| Email subject/body | display_id |
| API response to frontend | Both (send both fields) |
| Customer support ticket reference | display_id |
| Admin dashboard lookup | Either (FlexibleIdPipe handles both) |
| Logs and audit trails | Both |
| Copy-to-clipboard for sharing | display_id |

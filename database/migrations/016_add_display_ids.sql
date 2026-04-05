-- =============================================================================
-- Migration 016: Add display_id to all user-facing tables
-- Date: 2026-04-05
-- Description: Adds human-readable display IDs (e.g. JOB4R2F9HYZ) to 19 tables.
--              Existing rows are backfilled. Triggers auto-generate on every new INSERT.
--
-- Tables covered (19):
--   users, sessions, providers, service_categories, locations,
--   service_requests, proposals, jobs, payments, refunds,
--   reviews, messages, notifications, coupons, disputes,
--   events, background_jobs, admin_actions, subscriptions
--
-- Intentionally excluded (internal / token / config tables):
--   email_verification_tokens, password_reset_tokens, magic_link_tokens,
--   two_factor_secrets, login_attempts, login_history, social_accounts,
--   user_devices, rate_limits, feature_flags, system_settings, coupon_usage,
--   payment_webhooks, notification_deliveries, notification_preferences,
--   provider_availability, provider_documents, provider_review_aggregates,
--   service_request_search, saved_payment_methods, account_deletion_requests,
--   contact_messages, audit_logs, user_activity_logs, daily_metrics,
--   pricing_plans, unsubscribes, provider_portfolio, provider_services,
--   favorites, attachments
--
-- Run: docker exec -i marketplace-postgres psql -U postgres -d marketplace < database/migrations/016_add_display_ids.sql
-- =============================================================================

BEGIN;

-- =============================================================================
-- STEP 1: Shared generator function
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

-- =============================================================================
-- STEP 2: Add columns (nullable first — backfill, then enforce NOT NULL)
-- =============================================================================

ALTER TABLE users             ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;
ALTER TABLE sessions          ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;
ALTER TABLE providers         ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;
ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;
ALTER TABLE locations         ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;
ALTER TABLE service_requests  ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;
ALTER TABLE proposals         ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;
ALTER TABLE jobs              ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;
ALTER TABLE payments          ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;
ALTER TABLE refunds           ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;
ALTER TABLE reviews           ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;
ALTER TABLE messages          ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;
ALTER TABLE notifications     ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;
ALTER TABLE coupons           ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;
ALTER TABLE disputes          ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;
ALTER TABLE events            ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;
ALTER TABLE background_jobs   ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;
ALTER TABLE admin_actions     ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;
ALTER TABLE subscriptions     ADD COLUMN IF NOT EXISTS display_id VARCHAR(11) UNIQUE;

-- =============================================================================
-- STEP 3: Trigger functions (BEFORE INSERT — with collision-retry loop)
-- =============================================================================

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

CREATE OR REPLACE FUNCTION set_sessions_display_id() RETURNS TRIGGER AS $$
DECLARE candidate TEXT;
BEGIN
  IF NEW.display_id IS NULL THEN
    LOOP
      candidate := generate_display_id('SES');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM sessions WHERE display_id = candidate);
    END LOOP;
    NEW.display_id := candidate;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

CREATE OR REPLACE FUNCTION set_locations_display_id() RETURNS TRIGGER AS $$
DECLARE candidate TEXT;
BEGIN
  IF NEW.display_id IS NULL THEN
    LOOP
      candidate := generate_display_id('LOC');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM locations WHERE display_id = candidate);
    END LOOP;
    NEW.display_id := candidate;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

CREATE OR REPLACE FUNCTION set_events_display_id() RETURNS TRIGGER AS $$
DECLARE candidate TEXT;
BEGIN
  IF NEW.display_id IS NULL THEN
    LOOP
      candidate := generate_display_id('EVT');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM events WHERE display_id = candidate);
    END LOOP;
    NEW.display_id := candidate;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_background_jobs_display_id() RETURNS TRIGGER AS $$
DECLARE candidate TEXT;
BEGIN
  IF NEW.display_id IS NULL THEN
    LOOP
      candidate := generate_display_id('BGJ');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM background_jobs WHERE display_id = candidate);
    END LOOP;
    NEW.display_id := candidate;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_admin_actions_display_id() RETURNS TRIGGER AS $$
DECLARE candidate TEXT;
BEGIN
  IF NEW.display_id IS NULL THEN
    LOOP
      candidate := generate_display_id('ADM');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM admin_actions WHERE display_id = candidate);
    END LOOP;
    NEW.display_id := candidate;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- =============================================================================
-- STEP 4: Attach triggers
-- =============================================================================

DROP TRIGGER IF EXISTS trg_users_display_id             ON users;
DROP TRIGGER IF EXISTS trg_sessions_display_id          ON sessions;
DROP TRIGGER IF EXISTS trg_providers_display_id         ON providers;
DROP TRIGGER IF EXISTS trg_service_categories_display_id ON service_categories;
DROP TRIGGER IF EXISTS trg_locations_display_id         ON locations;
DROP TRIGGER IF EXISTS trg_service_requests_display_id  ON service_requests;
DROP TRIGGER IF EXISTS trg_proposals_display_id         ON proposals;
DROP TRIGGER IF EXISTS trg_jobs_display_id              ON jobs;
DROP TRIGGER IF EXISTS trg_payments_display_id          ON payments;
DROP TRIGGER IF EXISTS trg_refunds_display_id           ON refunds;
DROP TRIGGER IF EXISTS trg_reviews_display_id           ON reviews;
DROP TRIGGER IF EXISTS trg_messages_display_id          ON messages;
DROP TRIGGER IF EXISTS trg_notifications_display_id     ON notifications;
DROP TRIGGER IF EXISTS trg_coupons_display_id           ON coupons;
DROP TRIGGER IF EXISTS trg_disputes_display_id          ON disputes;
DROP TRIGGER IF EXISTS trg_events_display_id            ON events;
DROP TRIGGER IF EXISTS trg_background_jobs_display_id   ON background_jobs;
DROP TRIGGER IF EXISTS trg_admin_actions_display_id     ON admin_actions;
DROP TRIGGER IF EXISTS trg_subscriptions_display_id     ON subscriptions;

CREATE TRIGGER trg_users_display_id
  BEFORE INSERT ON users FOR EACH ROW EXECUTE FUNCTION set_users_display_id();

CREATE TRIGGER trg_sessions_display_id
  BEFORE INSERT ON sessions FOR EACH ROW EXECUTE FUNCTION set_sessions_display_id();

CREATE TRIGGER trg_providers_display_id
  BEFORE INSERT ON providers FOR EACH ROW EXECUTE FUNCTION set_providers_display_id();

CREATE TRIGGER trg_service_categories_display_id
  BEFORE INSERT ON service_categories FOR EACH ROW EXECUTE FUNCTION set_service_categories_display_id();

CREATE TRIGGER trg_locations_display_id
  BEFORE INSERT ON locations FOR EACH ROW EXECUTE FUNCTION set_locations_display_id();

CREATE TRIGGER trg_service_requests_display_id
  BEFORE INSERT ON service_requests FOR EACH ROW EXECUTE FUNCTION set_service_requests_display_id();

CREATE TRIGGER trg_proposals_display_id
  BEFORE INSERT ON proposals FOR EACH ROW EXECUTE FUNCTION set_proposals_display_id();

CREATE TRIGGER trg_jobs_display_id
  BEFORE INSERT ON jobs FOR EACH ROW EXECUTE FUNCTION set_jobs_display_id();

CREATE TRIGGER trg_payments_display_id
  BEFORE INSERT ON payments FOR EACH ROW EXECUTE FUNCTION set_payments_display_id();

CREATE TRIGGER trg_refunds_display_id
  BEFORE INSERT ON refunds FOR EACH ROW EXECUTE FUNCTION set_refunds_display_id();

CREATE TRIGGER trg_reviews_display_id
  BEFORE INSERT ON reviews FOR EACH ROW EXECUTE FUNCTION set_reviews_display_id();

CREATE TRIGGER trg_messages_display_id
  BEFORE INSERT ON messages FOR EACH ROW EXECUTE FUNCTION set_messages_display_id();

CREATE TRIGGER trg_notifications_display_id
  BEFORE INSERT ON notifications FOR EACH ROW EXECUTE FUNCTION set_notifications_display_id();

CREATE TRIGGER trg_coupons_display_id
  BEFORE INSERT ON coupons FOR EACH ROW EXECUTE FUNCTION set_coupons_display_id();

CREATE TRIGGER trg_disputes_display_id
  BEFORE INSERT ON disputes FOR EACH ROW EXECUTE FUNCTION set_disputes_display_id();

CREATE TRIGGER trg_events_display_id
  BEFORE INSERT ON events FOR EACH ROW EXECUTE FUNCTION set_events_display_id();

CREATE TRIGGER trg_background_jobs_display_id
  BEFORE INSERT ON background_jobs FOR EACH ROW EXECUTE FUNCTION set_background_jobs_display_id();

CREATE TRIGGER trg_admin_actions_display_id
  BEFORE INSERT ON admin_actions FOR EACH ROW EXECUTE FUNCTION set_admin_actions_display_id();

CREATE TRIGGER trg_subscriptions_display_id
  BEFORE INSERT ON subscriptions FOR EACH ROW EXECUTE FUNCTION set_subscriptions_display_id();

-- =============================================================================
-- STEP 5: Backfill existing rows
-- NOTE: Uses a cross-join with generate_series to produce 8 random characters.
--       Each table uses its own prefix.
-- =============================================================================

UPDATE users SET display_id = subq.did
FROM (
  SELECT id, 'USR' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM users, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE users.id = subq.id AND users.display_id IS NULL;

UPDATE sessions SET display_id = subq.did
FROM (
  SELECT id, 'SES' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM sessions, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE sessions.id = subq.id AND sessions.display_id IS NULL;

UPDATE providers SET display_id = subq.did
FROM (
  SELECT id, 'PRV' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM providers, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE providers.id = subq.id AND providers.display_id IS NULL;

UPDATE service_categories SET display_id = subq.did
FROM (
  SELECT id, 'CAT' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM service_categories, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE service_categories.id = subq.id AND service_categories.display_id IS NULL;

UPDATE locations SET display_id = subq.did
FROM (
  SELECT id, 'LOC' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM locations, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE locations.id = subq.id AND locations.display_id IS NULL;

UPDATE service_requests SET display_id = subq.did
FROM (
  SELECT id, 'REQ' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM service_requests, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE service_requests.id = subq.id AND service_requests.display_id IS NULL;

UPDATE proposals SET display_id = subq.did
FROM (
  SELECT id, 'PRP' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM proposals, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE proposals.id = subq.id AND proposals.display_id IS NULL;

UPDATE jobs SET display_id = subq.did
FROM (
  SELECT id, 'JOB' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM jobs, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE jobs.id = subq.id AND jobs.display_id IS NULL;

UPDATE payments SET display_id = subq.did
FROM (
  SELECT id, 'PAY' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM payments, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE payments.id = subq.id AND payments.display_id IS NULL;

UPDATE refunds SET display_id = subq.did
FROM (
  SELECT id, 'RFD' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM refunds, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE refunds.id = subq.id AND refunds.display_id IS NULL;

UPDATE reviews SET display_id = subq.did
FROM (
  SELECT id, 'REV' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM reviews, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE reviews.id = subq.id AND reviews.display_id IS NULL;

UPDATE messages SET display_id = subq.did
FROM (
  SELECT id, 'MSG' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM messages, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE messages.id = subq.id AND messages.display_id IS NULL;

UPDATE notifications SET display_id = subq.did
FROM (
  SELECT id, 'NTF' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM notifications, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE notifications.id = subq.id AND notifications.display_id IS NULL;

UPDATE coupons SET display_id = subq.did
FROM (
  SELECT id, 'CPN' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM coupons, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE coupons.id = subq.id AND coupons.display_id IS NULL;

UPDATE disputes SET display_id = subq.did
FROM (
  SELECT id, 'DSP' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM disputes, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE disputes.id = subq.id AND disputes.display_id IS NULL;

UPDATE events SET display_id = subq.did
FROM (
  SELECT id, 'EVT' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM events, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE events.id = subq.id AND events.display_id IS NULL;

UPDATE background_jobs SET display_id = subq.did
FROM (
  SELECT id, 'BGJ' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM background_jobs, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE background_jobs.id = subq.id AND background_jobs.display_id IS NULL;

UPDATE admin_actions SET display_id = subq.did
FROM (
  SELECT id, 'ADM' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM admin_actions, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE admin_actions.id = subq.id AND admin_actions.display_id IS NULL;

UPDATE subscriptions SET display_id = subq.did
FROM (
  SELECT id, 'SUB' || string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', floor(random()*36+1)::INT, 1), '') AS did
  FROM subscriptions, generate_series(1,8) WHERE display_id IS NULL GROUP BY id
) subq WHERE subscriptions.id = subq.id AND subscriptions.display_id IS NULL;

-- =============================================================================
-- STEP 6: Unique indexes for fast lookups
-- =============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_display_id              ON users(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_display_id           ON sessions(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_providers_display_id          ON providers(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_categories_display_id ON service_categories(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_locations_display_id          ON locations(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_requests_display_id   ON service_requests(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_proposals_display_id          ON proposals(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_display_id               ON jobs(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_display_id           ON payments(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_refunds_display_id            ON refunds(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_display_id            ON reviews(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_display_id           ON messages(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_display_id      ON notifications(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_display_id            ON coupons(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_disputes_display_id           ON disputes(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_display_id             ON events(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_background_jobs_display_id    ON background_jobs(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_actions_display_id      ON admin_actions(display_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_display_id      ON subscriptions(display_id);

-- =============================================================================
-- STEP 7: Enforce NOT NULL now that all rows are filled
-- =============================================================================

ALTER TABLE users             ALTER COLUMN display_id SET NOT NULL;
ALTER TABLE sessions          ALTER COLUMN display_id SET NOT NULL;
ALTER TABLE providers         ALTER COLUMN display_id SET NOT NULL;
ALTER TABLE service_categories ALTER COLUMN display_id SET NOT NULL;
ALTER TABLE locations         ALTER COLUMN display_id SET NOT NULL;
ALTER TABLE service_requests  ALTER COLUMN display_id SET NOT NULL;
ALTER TABLE proposals         ALTER COLUMN display_id SET NOT NULL;
ALTER TABLE jobs              ALTER COLUMN display_id SET NOT NULL;
ALTER TABLE payments          ALTER COLUMN display_id SET NOT NULL;
ALTER TABLE refunds           ALTER COLUMN display_id SET NOT NULL;
ALTER TABLE reviews           ALTER COLUMN display_id SET NOT NULL;
ALTER TABLE messages          ALTER COLUMN display_id SET NOT NULL;
ALTER TABLE notifications     ALTER COLUMN display_id SET NOT NULL;
ALTER TABLE coupons           ALTER COLUMN display_id SET NOT NULL;
ALTER TABLE disputes          ALTER COLUMN display_id SET NOT NULL;
ALTER TABLE events            ALTER COLUMN display_id SET NOT NULL;
ALTER TABLE background_jobs   ALTER COLUMN display_id SET NOT NULL;
ALTER TABLE admin_actions     ALTER COLUMN display_id SET NOT NULL;
ALTER TABLE subscriptions     ALTER COLUMN display_id SET NOT NULL;

-- =============================================================================
-- STEP 8: Verify — every count must be 0
-- =============================================================================

DO $$
DECLARE
  null_count INT;
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'users','sessions','providers','service_categories','locations',
    'service_requests','proposals','jobs','payments','refunds',
    'reviews','messages','notifications','coupons','disputes',
    'events','background_jobs','admin_actions','subscriptions'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('SELECT count(*) FROM %I WHERE display_id IS NULL', tbl) INTO null_count;
    IF null_count > 0 THEN
      RAISE EXCEPTION 'display_id backfill failed: % rows in % have NULL display_id', null_count, tbl;
    END IF;
  END LOOP;
  RAISE NOTICE 'Migration 016: All display_id columns verified OK.';
END;
$$;

COMMIT;

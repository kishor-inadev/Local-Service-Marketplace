-- Migration: Schema integrity fixes
-- Description: Fix FK ON DELETE behaviors, CHECK constraints, UNIQUE constraint on provider_availability,
--              missing index on review_helpful_votes, pricing_plans price >= 0 check,
--              and duplicate index guards.

-- 1. jobs.cancelled_by → ON DELETE SET NULL
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_cancelled_by_fkey;
ALTER TABLE jobs ADD CONSTRAINT jobs_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL;

-- 2. jobs.completed_at → stricter CHECK (started_at must be non-null when completed_at is set)
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_completed_at_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_completed_at_check
  CHECK (completed_at IS NULL OR (started_at IS NOT NULL AND completed_at >= started_at));

-- 3. disputes.resolved_by → ON DELETE SET NULL
ALTER TABLE disputes DROP CONSTRAINT IF EXISTS disputes_resolved_by_fkey;
ALTER TABLE disputes ADD CONSTRAINT disputes_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL;

-- 4. messages.sender_id → nullable + ON DELETE SET NULL
ALTER TABLE messages ALTER COLUMN sender_id DROP NOT NULL;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL;

-- 5. admin_actions.admin_id → nullable + ON DELETE SET NULL
ALTER TABLE admin_actions ALTER COLUMN admin_id DROP NOT NULL;
ALTER TABLE admin_actions DROP CONSTRAINT IF EXISTS admin_actions_admin_id_fkey;
ALTER TABLE admin_actions ADD CONSTRAINT admin_actions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL;

-- 6. provider_availability → UNIQUE constraint on (provider_id, day_of_week)
--    Remove existing duplicates first (keep oldest per pair)
DELETE FROM provider_availability a
USING provider_availability b
WHERE a.id > b.id
  AND a.provider_id = b.provider_id
  AND a.day_of_week = b.day_of_week;

CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_availability_unique
  ON provider_availability(provider_id, day_of_week);

-- 7. review_helpful_votes → user-side index
CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_user ON review_helpful_votes(user_id);

-- 8. pricing_plans.price >= 0 CHECK
ALTER TABLE pricing_plans DROP CONSTRAINT IF EXISTS pricing_plans_price_check;
ALTER TABLE pricing_plans ADD CONSTRAINT pricing_plans_price_check CHECK (price >= 0);

-- 9. Idempotent background_jobs indexes (already IF NOT EXISTS in newer schema, guard here too)
CREATE INDEX IF NOT EXISTS idx_background_jobs_type_status ON background_jobs(job_type, status);
CREATE INDEX IF NOT EXISTS idx_background_jobs_attempts ON background_jobs(attempts) WHERE status != 'completed';
CREATE INDEX IF NOT EXISTS idx_background_jobs_scheduled_pending ON background_jobs(scheduled_for ASC) WHERE status = 'pending';

-- 10. Missing FK indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_provider_documents_verified_by ON provider_documents(verified_by) WHERE verified_by IS NOT NULL;

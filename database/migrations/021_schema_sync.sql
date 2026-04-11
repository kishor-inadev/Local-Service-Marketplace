-- =====================================================
-- Migration 021: Schema sync with implementation
-- Date: 2026-04-11
-- =====================================================
-- Adds columns and tables that are referenced in service code
-- but were missing from the database schema.

-- 1. daily_metrics: add total_proposals column
--    Referenced in: oversight-service/analytics/repositories/metrics.repository.ts
--    aggregateYesterdayMetrics() inserts/upserts this column.
ALTER TABLE daily_metrics
  ADD COLUMN IF NOT EXISTS total_proposals INT NOT NULL DEFAULT 0;

-- 2. payment_webhooks: add error_message column
--    Referenced in: payment-service/payment/repositories/webhook.repository.ts
--    markFailed() stores the error reason for failed webhook processing.
ALTER TABLE payment_webhooks
  ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 3. failed_jobs: create DLQ table if migration 005 was not run
--    Referenced in: infrastructure-service/src/common/dlq/dead-letter-queue.service.ts
--    captureFailedJob() inserts failed BullMQ jobs for review/replay.
CREATE TABLE IF NOT EXISTS failed_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name VARCHAR(100) NOT NULL,
  job_id VARCHAR(255) NOT NULL,
  job_name VARCHAR(100) NOT NULL,
  job_data JSONB NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  failed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  replayed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'failed' CHECK (status IN ('failed', 'replayed', 'discarded')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (queue_name, job_id)
);

CREATE INDEX IF NOT EXISTS idx_failed_jobs_queue_name ON failed_jobs(queue_name);
CREATE INDEX IF NOT EXISTS idx_failed_jobs_status ON failed_jobs(status);
CREATE INDEX IF NOT EXISTS idx_failed_jobs_failed_at ON failed_jobs(failed_at DESC);
CREATE INDEX IF NOT EXISTS idx_failed_jobs_queue_status ON failed_jobs(queue_name, status);

CREATE OR REPLACE FUNCTION update_failed_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_update_failed_jobs_updated_at
  BEFORE UPDATE ON failed_jobs
  FOR EACH ROW EXECUTE FUNCTION update_failed_jobs_updated_at();

-- 4. reviews: add updated_at column
--    Referenced in: marketplace-service/modules/review/repositories/review.repository.ts
--    updateReview() sets updated_at = NOW() on every review edit.
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

CREATE OR REPLACE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. Performance index additions
-- =====================================================

-- Drop redundant indexes (their leading columns are covered by composite indexes)
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_user_devices_user_id;
DROP INDEX IF EXISTS idx_proposals_request_id;
DROP INDEX IF EXISTS idx_proposals_provider_id;
DROP INDEX IF EXISTS idx_reviews_provider_id;

-- Upgrade audit_logs_entity to include created_at for ordered entity lookups
DROP INDEX IF EXISTS idx_audit_logs_entity;
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON audit_logs(entity, entity_id, created_at DESC);

-- New missing indexes
CREATE INDEX IF NOT EXISTS idx_service_requests_location_id
  ON service_requests(location_id) WHERE location_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_service_requests_preferred_date
  ON service_requests(preferred_date DESC)
  WHERE deleted_at IS NULL AND preferred_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_cancelled_by
  ON jobs(cancelled_by) WHERE cancelled_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_customer_status
  ON jobs(customer_id, status);

CREATE INDEX IF NOT EXISTS idx_payments_user_created
  ON payments(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_status_created
  ON payments(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_job_created_desc
  ON messages(job_id ASC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_provider_responded
  ON reviews(provider_id, response_at DESC) WHERE response IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_disputes_resolved_by
  ON disputes(resolved_by) WHERE resolved_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_disputes_created_at
  ON disputes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_failed_jobs_queue_status_failed_at
  ON failed_jobs(queue_name, status, failed_at DESC);

CREATE INDEX IF NOT EXISTS idx_failed_jobs_status_failed_at
  ON failed_jobs(status, failed_at DESC);

CREATE INDEX IF NOT EXISTS idx_background_jobs_status_attempts
  ON background_jobs(status, attempts ASC);

CREATE INDEX IF NOT EXISTS idx_events_event_type_created
  ON events(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_service_request_search_category
  ON service_request_search(category);

CREATE INDEX IF NOT EXISTS idx_service_request_search_location
  ON service_request_search(location);

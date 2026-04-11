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

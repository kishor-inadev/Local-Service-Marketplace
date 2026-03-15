-- Migration: Add paid_at field to payments table
-- Date: March 15, 2026
-- Description: Adds paid_at timestamp to track when payments were completed and optimizes provider earnings queries

BEGIN;

-- Add paid_at column to payments table
ALTER TABLE payments
ADD COLUMN paid_at TIMESTAMP;

-- Set paid_at for existing completed payments (use created_at as fallback)
UPDATE payments
SET paid_at = created_at
WHERE status = 'completed' AND paid_at IS NULL;

-- Add optimized indexes for provider earnings queries
CREATE INDEX IF NOT EXISTS idx_payments_provider_created 
ON payments(provider_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_provider_status 
ON payments(provider_id, status);

-- Analyze table for better query planning
ANALYZE payments;

COMMIT;

-- Rollback instructions:
-- BEGIN;
-- DROP INDEX IF EXISTS idx_payments_provider_created;
-- DROP INDEX IF EXISTS idx_payments_provider_status;
-- ALTER TABLE payments DROP COLUMN paid_at;
-- COMMIT;

-- Migration 015: Add gateway column to payments table
-- Tracks which payment gateway processed each transaction
-- (stripe | razorpay | paypal | mock)

ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway TEXT NOT NULL DEFAULT 'stripe';

-- Backfill existing rows (assumed to be Stripe since that was the only gateway before)
UPDATE payments SET gateway = 'stripe' WHERE gateway IS NULL OR gateway = '';

-- Index for analytics / filtering by gateway
CREATE INDEX IF NOT EXISTS idx_payments_gateway ON payments(gateway);

-- Comment
COMMENT ON COLUMN payments.gateway IS 'Payment gateway used: stripe | razorpay | paypal | mock';

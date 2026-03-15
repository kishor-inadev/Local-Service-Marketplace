-- Migration: Add created_at column to favorites table
-- Date: March 15, 2026
-- Description: Adds created_at timestamp to favorites table for audit trail consistency

BEGIN;

-- Add created_at column to favorites table
ALTER TABLE favorites
ADD COLUMN created_at TIMESTAMP DEFAULT now() NOT NULL;

-- Backfill existing records with current timestamp
UPDATE favorites
SET created_at = now()
WHERE created_at IS NULL;

COMMIT;

-- Verification query (run after migration)
-- SELECT id, user_id, provider_id, created_at FROM favorites LIMIT 5;

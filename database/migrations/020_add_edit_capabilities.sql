-- =============================================================================
-- Migration 020: Add edit capabilities for messages and category management
-- Date: 2026-04-11
-- Description: Adds columns for message editing and category soft-delete,
--              supporting Session 5 API enhancements (review/message/category
--              management, token revocation).
--
-- Changes:
--   • messages.edited                   BOOLEAN (tracks if message was edited)
--   • messages.edited_at                TIMESTAMP (when message was last edited)
--   • service_categories.active         BOOLEAN (soft delete flag)
--   • idx_service_categories_active     Index for active categories
--
-- Notes:
--   • All columns use IF NOT EXISTS (idempotent)
--   • Token blacklist uses Redis (no SQL schema required)
--   • Review/proposal/job delete operations use existing columns
-- =============================================================================

BEGIN;

-- =============================================================================
-- MESSAGES: Add edit tracking
-- =============================================================================

-- Add edited flag (default false)
ALTER TABLE messages 
  ADD COLUMN IF NOT EXISTS edited BOOLEAN DEFAULT false;

-- Add edited timestamp
ALTER TABLE messages 
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP;

COMMENT ON COLUMN messages.edited 
  IS 'Indicates if message has been edited (15-minute edit window enforced by API)';

COMMENT ON COLUMN messages.edited_at 
  IS 'Timestamp of last edit';

-- =============================================================================
-- SERVICE_CATEGORIES: Add soft delete support
-- =============================================================================

-- Add active flag for soft delete
ALTER TABLE service_categories 
  ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true NOT NULL;

-- Index for filtering active categories
CREATE INDEX IF NOT EXISTS idx_service_categories_active 
  ON service_categories(active) 
  WHERE active = true;

-- Index for filtering by name (already may exist, IF NOT EXISTS makes it safe)
CREATE INDEX IF NOT EXISTS idx_service_categories_name 
  ON service_categories(name);

COMMENT ON COLUMN service_categories.active 
  IS 'Soft delete flag - false means category is deactivated (admin only)';

COMMENT ON INDEX idx_service_categories_active 
  IS 'Filters active categories for customer/provider views';

-- =============================================================================
-- ROLLBACK (for down migration)
-- =============================================================================

-- To rollback this migration, run:
-- ALTER TABLE messages DROP COLUMN IF EXISTS edited;
-- ALTER TABLE messages DROP COLUMN IF EXISTS edited_at;
-- ALTER TABLE service_categories DROP COLUMN IF EXISTS active;
-- DROP INDEX IF EXISTS idx_service_categories_active;

COMMIT;

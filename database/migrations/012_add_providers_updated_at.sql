-- =====================================================
-- Migration 012: Add updated_at to providers table
-- and fix unsubscribes table name inconsistency
-- =====================================================

BEGIN;

-- Add updated_at column to providers (idempotent)
ALTER TABLE providers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

-- Set updated_at to created_at for existing rows
UPDATE providers SET updated_at = created_at WHERE updated_at IS NULL;

-- Create trigger for auto-update
DROP TRIGGER IF EXISTS update_providers_updated_at ON providers;
CREATE TRIGGER update_providers_updated_at
  BEFORE UPDATE ON providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add unsubscribed column to notifications if not exists
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS unsubscribed BOOLEAN DEFAULT FALSE;

-- Create trigger for notification_preferences.updated_at (idempotent)
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Rename unsubscribe table to unsubscribes if old name still exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'unsubscribe')
    AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'unsubscribes') THEN
    ALTER TABLE unsubscribe RENAME TO unsubscribes;
    -- Recreate indexes with correct names
    ALTER INDEX IF EXISTS idx_unsubscribe_user_id RENAME TO idx_unsubscribes_user_id;
    ALTER INDEX IF EXISTS idx_unsubscribe_email RENAME TO idx_unsubscribes_email;
  END IF;
END $$;

-- Ensure unique index on unsubscribes.email
CREATE UNIQUE INDEX IF NOT EXISTS idx_unsubscribes_email_unique ON unsubscribes(email);

COMMIT;

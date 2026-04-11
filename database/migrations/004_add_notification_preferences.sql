-- =============================================================================
-- Migration 004: Add notification preferences table
-- Date: 2026-01-01
-- Description: Creates notification_preferences table for per-user control
--              over which notification channels and event types they receive.
--
-- Note: Content of this migration was absorbed into migration 017
--       (add_missing_tables) which uses CREATE TABLE IF NOT EXISTS,
--       making this file a safe no-op on any database state.
-- =============================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  new_request_alerts BOOLEAN DEFAULT true,
  proposal_alerts BOOLEAN DEFAULT true,
  job_updates BOOLEAN DEFAULT true,
  payment_alerts BOOLEAN DEFAULT true,
  review_alerts BOOLEAN DEFAULT true,
  message_alerts BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at_fn()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_notification_preferences_updated_at'
      AND tgrelid = 'notification_preferences'::regclass
  ) THEN
    CREATE TRIGGER update_notification_preferences_updated_at
      BEFORE UPDATE ON notification_preferences
      FOR EACH ROW EXECUTE FUNCTION update_notification_preferences_updated_at_fn();
  END IF;
END;
$$;

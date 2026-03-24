-- Unsubscribe table for email preferences
-- NOTE: Table is named 'unsubscribes' (plural) to match schema.sql
CREATE TABLE IF NOT EXISTS unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  reason TEXT,
  unsubscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_unsubscribes_user_id ON unsubscribes(user_id);
CREATE INDEX IF NOT EXISTS idx_unsubscribes_email ON unsubscribes(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unsubscribes_email_unique ON unsubscribes(email);

-- Rename old table if it exists (handles existing deployments)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'unsubscribe')
    AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'unsubscribes') THEN
    ALTER TABLE unsubscribe RENAME TO unsubscribes;
  END IF;
END $$;

-- Add column to notifications table to track if user has unsubscribed
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS unsubscribed BOOLEAN DEFAULT FALSE;

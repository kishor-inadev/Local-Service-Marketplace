-- Migration 025: Add conversations table (owned by comms-service)
-- Removes the need for cross-service JOIN on jobs table in getUserConversations.
-- Conversations are automatically created/updated when messages are sent.

BEGIN;

-- =====================================================
-- CONVERSATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL UNIQUE,
  customer_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  last_message TEXT,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX idx_conversations_provider_id ON conversations(provider_id);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- Backfill from existing messages + jobs data
INSERT INTO conversations (job_id, customer_id, provider_id, last_message, last_message_at, created_at)
SELECT DISTINCT ON (m.job_id)
  m.job_id,
  j.customer_id,
  j.provider_id,
  m.message AS last_message,
  m.created_at AS last_message_at,
  MIN(m.created_at) OVER (PARTITION BY m.job_id) AS created_at
FROM messages m
JOIN jobs j ON j.id = m.job_id
ORDER BY m.job_id, m.created_at DESC
ON CONFLICT (job_id) DO NOTHING;

-- Trigger to auto-upsert conversation on new message
CREATE OR REPLACE FUNCTION upsert_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to update existing conversation first
  UPDATE conversations
  SET last_message = NEW.message,
      last_message_at = NEW.created_at,
      updated_at = now()
  WHERE job_id = NEW.job_id;

  -- If no conversation exists yet, create one from jobs table
  IF NOT FOUND THEN
    INSERT INTO conversations (job_id, customer_id, provider_id, last_message, last_message_at)
    SELECT NEW.job_id, j.customer_id, j.provider_id, NEW.message, NEW.created_at
    FROM jobs j WHERE j.id = NEW.job_id
    ON CONFLICT (job_id) DO UPDATE
    SET last_message = EXCLUDED.last_message,
        last_message_at = EXCLUDED.last_message_at,
        updated_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_upsert_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION upsert_conversation_on_message();

COMMIT;

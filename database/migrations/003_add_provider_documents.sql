-- =============================================================================
-- Migration 003: Add provider documents table
-- Date: 2026-01-01
-- Description: Creates provider_documents table for storing uploaded
--              verification documents (government ID, business license, etc.)
--              and provider_portfolio table for portfolio images.
--
-- Note: Content of this migration was absorbed into migration 017
--       (add_missing_tables) which uses CREATE TABLE IF NOT EXISTS,
--       making this file a safe no-op on any database state.
-- =============================================================================

-- provider_documents is created idempotently in 017_add_missing_tables.sql
-- provider_portfolio is created idempotently in 017_add_missing_tables.sql

CREATE TABLE IF NOT EXISTS provider_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'government_id', 'business_license', 'insurance_certificate',
    'certification', 'tax_document'
  )),
  document_url TEXT NOT NULL,
  document_name TEXT NOT NULL,
  document_number TEXT,
  verified BOOLEAN DEFAULT false,
  rejected BOOLEAN DEFAULT false,
  rejection_reason TEXT,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_provider_documents_provider_id ON provider_documents(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_documents_type       ON provider_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_provider_documents_verified   ON provider_documents(verified);

CREATE TABLE IF NOT EXISTS provider_portfolio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_provider_portfolio_provider_id ON provider_portfolio(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_portfolio_order       ON provider_portfolio(provider_id, display_order);

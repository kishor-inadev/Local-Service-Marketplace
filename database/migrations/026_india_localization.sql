-- Migration 026: India Localization
-- Adds India-specific fields across locations, providers, payments, pricing_plans, and users.
-- Safe to run multiple times (all use IF NOT EXISTS / SET DEFAULT).

-- ─── Locations ────────────────────────────────────────────────────────────────
-- Change default country from 'US' to 'IN'
ALTER TABLE locations ALTER COLUMN country SET DEFAULT 'IN';

-- Indian 6-digit pincode
ALTER TABLE locations ADD COLUMN IF NOT EXISTS pincode CHAR(6)
  CHECK (pincode IS NULL OR pincode ~ '^\d{6}$');

-- District (taluka/tehsil level)
ALTER TABLE locations ADD COLUMN IF NOT EXISTS district VARCHAR(100);

-- 2-letter Indian state/UT code (e.g. MH, DL, KA, TN)
ALTER TABLE locations ADD COLUMN IF NOT EXISTS state_code CHAR(2);

-- ─── Providers ────────────────────────────────────────────────────────────────
-- GSTIN — Goods & Services Tax Identification Number (15-char alphanumeric)
ALTER TABLE providers ADD COLUMN IF NOT EXISTS gstin VARCHAR(15)
  CHECK (gstin IS NULL OR gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$');

-- PAN — Permanent Account Number (10-char: 5 alpha, 4 digit, 1 alpha)
ALTER TABLE providers ADD COLUMN IF NOT EXISTS pan VARCHAR(10)
  CHECK (pan IS NULL OR pan ~ '^[A-Z]{5}[0-9]{4}[A-Z]$');

-- Aadhaar verification flag (set by KYC flow, not stored raw)
ALTER TABLE providers ADD COLUMN IF NOT EXISTS aadhar_verified BOOLEAN DEFAULT FALSE;

-- ─── Payments ─────────────────────────────────────────────────────────────────
-- GST amount (18% on platform_fee by default)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gst_amount NUMERIC(12,2) DEFAULT 0;

-- GST rate stored at time of transaction for audit trail
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5,2) DEFAULT 18.00;

-- ─── Pricing Plans ────────────────────────────────────────────────────────────
-- Currency code for the plan price (INR for India)
ALTER TABLE pricing_plans ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR';

-- ─── Users ────────────────────────────────────────────────────────────────────
-- Default timezone to IST for new users
ALTER TABLE users ALTER COLUMN timezone SET DEFAULT 'Asia/Kolkata';

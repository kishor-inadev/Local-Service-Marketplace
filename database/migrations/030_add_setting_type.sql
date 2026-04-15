-- Migration 030: Add 'type' column to system_settings
-- type controls which UI input the admin panel renders:
--   boolean  → toggle switch
--   number   → number input
--   textarea → multi-line text area
--   text     → single-line text input

ALTER TABLE system_settings
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'text'
  CHECK (type IN ('boolean', 'number', 'textarea', 'text'));

-- ── Boolean settings ────────────────────────────────────────────────────────
UPDATE system_settings SET type = 'boolean' WHERE key IN (
  'maintenance_mode',
  'registration_enabled',
  'provider_registration_enabled',
  'guest_requests_enabled',
  'provider_verification_required'
);

-- ── Number settings ─────────────────────────────────────────────────────────
UPDATE system_settings SET type = 'number' WHERE key IN (
  'platform_fee_percentage',
  'gst_rate',
  'min_payout_amount',
  'max_proposal_count',
  'request_expiry_days',
  'max_login_attempts',
  'session_timeout_minutes',
  'otp_expiry_minutes',
  'max_providers_per_category',
  'max_services_per_provider',
  'review_auto_approve_days',
  'min_review_length',
  'max_file_upload_size_mb',
  'max_active_requests_per_customer',
  'refund_window_days',
  'dispute_window_days',
  'proposal_withdrawal_window_hours',
  'max_coupon_discount_percentage',
  'job_auto_complete_days',
  'email_verification_expiry_hours',
  'password_reset_expiry_hours',
  'magic_link_expiry_hours',
  'session_ttl_days',
  'auto_generated_password_length',
  'notification_retention_days',
  'failed_delivery_retention_days',
  'provider_cache_ttl_seconds',
  'request_cache_ttl_seconds',
  'job_cache_ttl_seconds',
  'default_page_limit',
  'rate_limit_max_requests',
  'auth_rate_limit_max_requests'
);

-- ── Textarea settings ────────────────────────────────────────────────────────
UPDATE system_settings SET type = 'textarea' WHERE key IN (
  'maintenance_message',
  'contact_address',
  'allowed_file_types'
);

-- ── Text settings remain at DEFAULT 'text' ───────────────────────────────────
-- support_email, default_currency, default_timezone,
-- contact_phone, terms_version, privacy_version

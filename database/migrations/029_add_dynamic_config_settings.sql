-- Migration 029: Add dynamic configuration settings
-- All inserts use ON CONFLICT DO NOTHING so existing values are preserved.

-- Security / Auth token lifetimes
INSERT INTO system_settings (key, value, description) VALUES
  ('otp_expiry_minutes', '10', 'OTP (one-time-password) verification code validity in minutes')
  ON CONFLICT (key) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO system_settings (key, value, description) VALUES
  ('email_verification_expiry_hours', '24', 'Hours before an email verification link expires')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('password_reset_expiry_hours', '1', 'Hours before a password reset link expires')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('magic_link_expiry_hours', '1', 'Hours before a magic-link (passwordless login) token expires')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('session_ttl_days', '90', 'Days before a refresh token / user session expires and requires re-login')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('auto_generated_password_length', '8', 'Character length of system-generated temporary passwords sent to admin-created users')
  ON CONFLICT (key) DO NOTHING;

-- Data retention
INSERT INTO system_settings (key, value, description) VALUES
  ('notification_retention_days', '90', 'Days before old notification records are purged from the database')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('failed_delivery_retention_days', '30', 'Days before failed notification delivery records are purged from the database')
  ON CONFLICT (key) DO NOTHING;

-- Cache TTLs (seconds)
INSERT INTO system_settings (key, value, description) VALUES
  ('provider_cache_ttl_seconds', '300', 'Redis cache TTL in seconds for provider profile data')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('request_cache_ttl_seconds', '300', 'Redis cache TTL in seconds for service request list data')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('job_cache_ttl_seconds', '180', 'Redis cache TTL in seconds for job records (shorter because jobs change status frequently)')
  ON CONFLICT (key) DO NOTHING;

-- Pagination
INSERT INTO system_settings (key, value, description) VALUES
  ('default_page_limit', '20', 'Default number of items returned per page for all paginated endpoints')
  ON CONFLICT (key) DO NOTHING;

-- API Gateway rate limits
INSERT INTO system_settings (key, value, description) VALUES
  ('rate_limit_max_requests', '500', 'Maximum requests per rate-limit window (general API endpoints)')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('auth_rate_limit_max_requests', '10', 'Maximum requests per 15-minute window for authentication endpoints per IP')
  ON CONFLICT (key) DO NOTHING;

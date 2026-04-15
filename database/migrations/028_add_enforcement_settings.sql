-- Migration 028: Add enforcement-linked system settings
-- All inserts use ON CONFLICT DO NOTHING so existing values are preserved.

INSERT INTO system_settings (key, value, description) VALUES
  ('gst_rate', '18', 'GST rate percentage applied to platform fee (e.g. 18 means 18%)')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('registration_enabled', 'true', 'Set to false to disable new customer/user registrations platform-wide')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('provider_registration_enabled', 'true', 'Set to false to disable new provider profile creation platform-wide')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('guest_requests_enabled', 'true', 'Allow unauthenticated (guest) users to submit service requests')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('max_active_requests_per_customer', '10', 'Maximum number of open service requests a single customer can have at one time')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('refund_window_days', '30', 'Number of days after payment completion within which a refund can be requested')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('dispute_window_days', '30', 'Number of days after job completion within which a dispute can be filed')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('proposal_withdrawal_window_hours', '24', 'Hours after submission within which a provider can withdraw a proposal without restriction')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('max_coupon_discount_percentage', '80', 'Maximum allowed discount percentage when creating a new coupon')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('job_auto_complete_days', '7', 'Days after a job enters in_progress status before it is automatically marked completed (requires background job)')
  ON CONFLICT (key) DO NOTHING;

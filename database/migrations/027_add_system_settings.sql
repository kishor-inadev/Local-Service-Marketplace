-- Migration 026: Add additional system settings
-- These are inserted with ON CONFLICT DO NOTHING so existing values are preserved.

INSERT INTO system_settings (key, value, description) VALUES
  ('maintenance_mode',               'false',               'Set to true to put the platform in maintenance mode (read-only banner shown to users)')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('maintenance_message',            'We are performing scheduled maintenance. Please check back shortly.',  'Message displayed to users during maintenance mode')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('provider_verification_required', 'true',                'Require providers to be verified before accepting job proposals')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('max_providers_per_category',     '50',                  'Maximum number of providers allowed per service category')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('max_services_per_provider',      '20',                  'Maximum number of service categories a single provider can list')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('review_auto_approve_days',       '7',                   'Days after job completion before a review is auto-approved if provider does not respond')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('min_review_length',              '10',                  'Minimum character length for a review comment')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('default_currency',               'INR',                 'Default currency code for pricing and payments (ISO 4217)')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('default_timezone',               'Asia/Kolkata',        'Default timezone for date/time display across the platform')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('max_file_upload_size_mb',        '10',                  'Maximum file upload size in megabytes')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('allowed_file_types',             'jpg,jpeg,png,pdf,doc,docx', 'Comma-separated list of allowed file upload extensions')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('contact_phone',                  '+91 80456 78900',     'Platform support phone number displayed on contact page')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('contact_address',                'Local Service Marketplace Pvt. Ltd., 4th Floor, Tech Park, BKC, Mumbai - 400 051', 'Platform registered address displayed on contact page')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('terms_version',                  '1.0',                 'Current version of the Terms of Service document')
  ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description) VALUES
  ('privacy_version',                '1.0',                 'Current version of the Privacy Policy document')
  ON CONFLICT (key) DO NOTHING;

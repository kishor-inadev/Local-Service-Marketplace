-- =====================================================
-- EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- USERS & AUTHENTICATION
-- =====================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  name VARCHAR(255),
  phone VARCHAR(20) CHECK (phone IS NULL OR phone ~ '^\+?[0-9]{10,15}$'),
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'provider', 'admin')),
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  profile_picture_url TEXT,
  timezone VARCHAR(100) DEFAULT 'UTC',
  language VARCHAR(10) DEFAULT 'en',
  last_login_at TIMESTAMP,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_last_login ON users(last_login_at DESC);
CREATE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL;

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token TEXT,
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT,
  location TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX idx_email_verification_tokens_expires ON email_verification_tokens(expires_at);

CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  location TEXT,
  success BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_ip_address ON login_attempts(ip_address);
CREATE INDEX idx_login_attempts_created_at ON login_attempts(created_at DESC);
CREATE INDEX idx_login_attempts_email_created ON login_attempts(email, created_at DESC);
CREATE INDEX idx_login_attempts_failed ON login_attempts(email, created_at DESC) WHERE success = false;
CREATE INDEX idx_login_attempts_ip_failed ON login_attempts(ip_address, created_at DESC) WHERE success = false;

-- =====================================================
-- SOCIAL AUTH
-- =====================================================

CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX idx_social_accounts_user_id ON social_accounts(user_id);
CREATE UNIQUE INDEX idx_social_accounts_provider_unique ON social_accounts(provider, provider_user_id);

-- =====================================================
-- DEVICE TRACKING
-- =====================================================

CREATE TABLE user_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_type TEXT,
  os TEXT,
  last_seen TIMESTAMP
);

CREATE INDEX idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX idx_user_devices_device_id ON user_devices(device_id);
CREATE UNIQUE INDEX idx_user_devices_unique ON user_devices(user_id, device_id);

-- =====================================================
-- PROVIDERS
-- =====================================================

CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  description TEXT,
  profile_picture_url TEXT,
  rating DECIMAL,
  total_jobs_completed INT DEFAULT 0 CHECK (total_jobs_completed >= 0),
  years_of_experience INT,
  service_area_radius DECIMAL(10, 2),
  response_time_avg DECIMAL(10, 2),
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  certifications JSONB,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_providers_user_id ON providers(user_id);
CREATE INDEX idx_providers_rating ON providers(rating DESC);
CREATE INDEX idx_providers_deleted_at ON providers(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_providers_verification_status ON providers(verification_status);
CREATE INDEX idx_providers_total_jobs ON providers(total_jobs_completed DESC);

-- =====================================================
-- SERVICE CATEGORIES
-- =====================================================

CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX idx_service_categories_active ON service_categories(active) WHERE active = true;
CREATE INDEX idx_service_categories_name ON service_categories(name);

CREATE TABLE provider_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE RESTRICT
);

CREATE INDEX idx_provider_services_provider_id ON provider_services(provider_id);
CREATE INDEX idx_provider_services_category_id ON provider_services(category_id);
CREATE UNIQUE INDEX idx_provider_services_unique ON provider_services(provider_id, category_id);

CREATE TABLE provider_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL CHECK (end_time > start_time)
);

CREATE INDEX idx_provider_availability_provider_id ON provider_availability(provider_id);
CREATE INDEX idx_provider_availability_day ON provider_availability(day_of_week);
CREATE INDEX idx_provider_availability_composite ON provider_availability(provider_id, day_of_week, start_time);

-- =====================================================
-- LOCATIONS
-- =====================================================

CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Nullable for anonymous requests
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'US',
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX idx_locations_coordinates ON locations(latitude, longitude);
CREATE INDEX idx_locations_user_id ON locations(user_id) WHERE user_id IS NOT NULL;

-- =====================================================
-- SERVICE REQUESTS
-- =====================================================

CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Nullable to allow anonymous requests
  category_id UUID NOT NULL REFERENCES service_categories(id),
  location_id UUID REFERENCES locations(id),
  description TEXT NOT NULL,
  budget BIGINT NOT NULL CHECK (budget > 0),
  images JSONB,
  preferred_date DATE,
  urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'urgent')),
  expiry_date TIMESTAMP,
  view_count INT DEFAULT 0 CHECK (view_count >= 0),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'completed', 'cancelled')),
  -- Guest information for anonymous requests (when user_id is NULL)
  guest_name VARCHAR(255),
  guest_email VARCHAR(255) CHECK (guest_email IS NULL OR guest_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  guest_phone VARCHAR(20) CHECK (guest_phone IS NULL OR guest_phone ~ '^\+?[0-9]{10,15}$'),
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP,
  -- Ensure either user_id OR guest contact info is provided
  CONSTRAINT check_user_or_guest CHECK (
    (user_id IS NOT NULL) OR 
    (guest_name IS NOT NULL AND guest_email IS NOT NULL AND guest_phone IS NOT NULL)
  )
);

CREATE INDEX idx_service_requests_user_id ON service_requests(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_service_requests_category_id ON service_requests(category_id);
CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_service_requests_created_at ON service_requests(created_at DESC);
CREATE INDEX idx_service_requests_user_status ON service_requests(user_id, status) WHERE user_id IS NOT NULL;
CREATE INDEX idx_service_requests_deleted_at ON service_requests(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_service_requests_urgency ON service_requests(urgency);
CREATE INDEX idx_service_requests_expiry ON service_requests(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_service_requests_guest_email ON service_requests(guest_email) WHERE guest_email IS NOT NULL;
CREATE INDEX idx_service_requests_status_created_at ON service_requests(status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_service_requests_category_status_created_at ON service_requests(category_id, status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_service_requests_urgency_created_at ON service_requests(urgency, created_at DESC) WHERE deleted_at IS NULL;

-- =====================================================
-- PROPOSALS
-- =====================================================

CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  price BIGINT NOT NULL CHECK (price > 0),
  message TEXT,
  estimated_hours DECIMAL(10, 2),
  start_date DATE,
  completion_date DATE,
  rejected_reason TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP
);

CREATE INDEX idx_proposals_request_id ON proposals(request_id);
CREATE INDEX idx_proposals_provider_id ON proposals(provider_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_created_at ON proposals(created_at DESC);
CREATE INDEX idx_proposals_request_status ON proposals(request_id, status);
CREATE UNIQUE INDEX idx_proposals_provider_request_unique ON proposals(provider_id, request_id) WHERE status NOT IN ('withdrawn', 'rejected');
CREATE INDEX idx_proposals_request_created_at ON proposals(request_id, created_at DESC);
CREATE INDEX idx_proposals_provider_status_created_at ON proposals(provider_id, status, created_at DESC);
CREATE INDEX idx_proposals_status_created_at ON proposals(status, created_at DESC);

-- =====================================================
-- JOBS
-- =====================================================

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES service_requests(id),
  provider_id UUID NOT NULL REFERENCES providers(id),
  customer_id UUID NOT NULL REFERENCES users(id),
  proposal_id UUID REFERENCES proposals(id),
  actual_amount BIGINT,
  cancelled_by UUID REFERENCES users(id),
  cancellation_reason TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'disputed')),
  started_at TIMESTAMP,
  completed_at TIMESTAMP CHECK (completed_at IS NULL OR completed_at >= started_at),
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP
);

CREATE INDEX idx_jobs_request_id ON jobs(request_id);
CREATE INDEX idx_jobs_provider_id ON jobs(provider_id);
CREATE INDEX idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX idx_jobs_proposal_id ON jobs(proposal_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_provider_status ON jobs(provider_id, status);
CREATE UNIQUE INDEX idx_jobs_request_unique ON jobs(request_id) WHERE status NOT IN ('cancelled', 'disputed');
CREATE INDEX idx_jobs_provider_started_at ON jobs(provider_id, started_at DESC);
CREATE INDEX idx_jobs_customer_started_at ON jobs(customer_id, started_at DESC);
CREATE INDEX idx_jobs_status_started_at ON jobs(status, started_at DESC);
CREATE INDEX idx_jobs_completed_at ON jobs(completed_at DESC) WHERE completed_at IS NOT NULL;

-- =====================================================
-- PAYMENTS
-- =====================================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id),
  user_id UUID NOT NULL REFERENCES users(id),
  provider_id UUID NOT NULL REFERENCES providers(id),
  amount BIGINT NOT NULL CHECK (amount > 0),
  platform_fee BIGINT DEFAULT 0,
  provider_amount BIGINT,
  currency TEXT NOT NULL,
  payment_method TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id TEXT,
  failed_reason TEXT,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  paid_at TIMESTAMP
);

CREATE INDEX idx_payments_job_id ON payments(job_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_provider_id ON payments(provider_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_provider_created ON payments(provider_id, created_at DESC);
CREATE INDEX idx_payments_provider_status ON payments(provider_id, status);
CREATE INDEX idx_payments_paid_at ON payments(paid_at DESC) WHERE paid_at IS NOT NULL;
CREATE UNIQUE INDEX idx_payments_job_unique ON payments(job_id) WHERE status = 'completed';

CREATE TABLE payment_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gateway TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false NOT NULL,
  event_type TEXT,
  external_id TEXT,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  processed_at TIMESTAMP
);

CREATE INDEX idx_payment_webhooks_unprocessed ON payment_webhooks(processed) WHERE processed = false;
CREATE INDEX idx_payment_webhooks_gateway ON payment_webhooks(gateway);
CREATE INDEX idx_payment_webhooks_external_id ON payment_webhooks(external_id);

CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  reason TEXT,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX idx_refunds_status ON refunds(status);

-- =====================================================
-- REVIEWS
-- =====================================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id),
  user_id UUID NOT NULL REFERENCES users(id),
  provider_id UUID NOT NULL REFERENCES providers(id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  response TEXT,
  response_at TIMESTAMP,
  helpful_count INT DEFAULT 0 CHECK (helpful_count >= 0),
  verified_purchase BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX idx_reviews_job_id ON reviews(job_id);
CREATE INDEX idx_reviews_provider_id ON reviews(provider_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX idx_reviews_provider_rating ON reviews(provider_id, rating DESC);
CREATE UNIQUE INDEX idx_reviews_job_user_unique ON reviews(job_id, user_id);

-- =====================================================
-- MESSAGES
-- =====================================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX idx_messages_job_id ON messages(job_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at ASC);
CREATE INDEX idx_messages_job_created ON messages(job_id, created_at ASC);
CREATE INDEX idx_messages_job_read_created ON messages(job_id, read, created_at ASC) WHERE read = false;

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false NOT NULL,
  unsubscribed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(read) WHERE read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read, created_at DESC);

CREATE TABLE notification_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  status TEXT NOT NULL,
  delivered_at TIMESTAMP,
  error_message TEXT
);

CREATE INDEX idx_notification_deliveries_notification_id ON notification_deliveries(notification_id);
CREATE INDEX idx_notification_deliveries_status ON notification_deliveries(status);

-- =====================================================
-- FAVORITES
-- =====================================================

CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_provider_id ON favorites(provider_id);
CREATE UNIQUE INDEX idx_favorites_unique ON favorites(user_id, provider_id);

-- =====================================================
-- ATTACHMENTS
-- =====================================================

CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX idx_attachments_message_id ON attachments(message_id);

-- =====================================================
-- COUPONS
-- =====================================================

CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_percent INT NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  max_uses INT,
  max_uses_per_user INT DEFAULT 1,
  min_purchase_amount BIGINT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(active) WHERE active = true;
CREATE INDEX idx_coupons_expires ON coupons(expires_at) WHERE expires_at IS NOT NULL;

CREATE TABLE coupon_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  used_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX idx_coupon_usage_user_id ON coupon_usage(user_id);
CREATE INDEX idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);

-- =====================================================
-- DISPUTES
-- =====================================================

CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id),
  opened_by UUID NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  resolution TEXT,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP
);

CREATE INDEX idx_disputes_job_id ON disputes(job_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_opened_by ON disputes(opened_by);

-- =====================================================
-- AUDIT LOGS
-- =====================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =====================================================
-- USER ACTIVITY
-- =====================================================

CREATE TABLE user_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX idx_user_activity_user_id ON user_activity_logs(user_id);
CREATE INDEX idx_user_activity_created_at ON user_activity_logs(created_at DESC);

-- =====================================================
-- EVENTS
-- =====================================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_created_at ON events(created_at DESC);

-- =====================================================
-- BACKGROUND JOBS
-- =====================================================

CREATE TABLE background_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INT DEFAULT 0 NOT NULL,
  last_error TEXT,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP,
  scheduled_for TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_background_jobs_pending ON background_jobs(status) WHERE status != 'completed';
CREATE INDEX idx_background_jobs_status_scheduled ON background_jobs(status, scheduled_for) WHERE status IN ('pending', 'processing');
CREATE INDEX idx_background_jobs_type_status ON background_jobs(job_type, status);
CREATE INDEX idx_background_jobs_attempts ON background_jobs(attempts) WHERE status != 'completed';

-- =====================================================
-- RATE LIMITING
-- =====================================================

CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL,
  request_count INT NOT NULL,
  window_start TIMESTAMP NOT NULL
);

CREATE INDEX idx_rate_limits_key ON rate_limits(key);
CREATE INDEX idx_rate_limits_window_start ON rate_limits(window_start);
CREATE INDEX idx_rate_limits_key_window ON rate_limits(key, window_start DESC);

-- =====================================================
-- FEATURE FLAGS
-- =====================================================

CREATE TABLE feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL,
  rollout_percentage INT DEFAULT 100 NOT NULL CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100)
);

-- =====================================================
-- DAILY METRICS
-- =====================================================

CREATE TABLE daily_metrics (
  date DATE PRIMARY KEY,
  total_users INT NOT NULL DEFAULT 0,
  total_requests INT NOT NULL DEFAULT 0,
  total_jobs INT NOT NULL DEFAULT 0,
  total_payments INT NOT NULL DEFAULT 0
);

-- =====================================================
-- SEARCH INDEX
-- =====================================================

CREATE TABLE service_request_search (
  request_id UUID PRIMARY KEY REFERENCES service_requests(id) ON DELETE CASCADE,
  category TEXT,
  location TEXT,
  description TEXT
);

-- =====================================================
-- SYSTEM SETTINGS
-- =====================================================

CREATE TABLE system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT now(),
  updated_by UUID REFERENCES users(id)
);

-- =====================================================
-- ADMIN ACTIONS
-- =====================================================

CREATE TABLE admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_created_at ON admin_actions(created_at DESC);

-- =====================================================
-- CONTACT MESSAGES
-- =====================================================

CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  subject VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_notes TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP,
  resolved_at TIMESTAMP
);

CREATE INDEX idx_contact_messages_status ON contact_messages(status);
CREATE INDEX idx_contact_messages_email ON contact_messages(email);
CREATE INDEX idx_contact_messages_user_id ON contact_messages(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_contact_messages_assigned_to ON contact_messages(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_providers_updated_at 
  BEFORE UPDATE ON providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_requests_updated_at 
  BEFORE UPDATE ON service_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at 
  BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at 
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at 
  BEFORE UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at 
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_messages_updated_at 
  BEFORE UPDATE ON contact_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at 
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to cleanup expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM email_verification_tokens WHERE expires_at < NOW()
    RETURNING *
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  DELETE FROM password_reset_tokens WHERE expires_at < NOW();
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update provider rating
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE providers
  SET rating = (
    SELECT COALESCE(AVG(rating)::DECIMAL(3,2), 0)
    FROM reviews
    WHERE provider_id = NEW.provider_id
  )
  WHERE id = NEW.provider_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_provider_rating_trigger
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_provider_rating();

-- Function to auto-update review aggregates
CREATE OR REPLACE FUNCTION update_review_aggregates()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO provider_review_aggregates (provider_id, total_reviews, average_rating, 
    rating_1_count, rating_2_count, rating_3_count, rating_4_count, rating_5_count, last_review_at)
  SELECT 
    NEW.provider_id,
    COUNT(*),
    AVG(rating)::DECIMAL(3,2),
    SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END),
    SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END),
    SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END),
    SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END),
    SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END),
    MAX(created_at)
  FROM reviews
  WHERE provider_id = NEW.provider_id
  ON CONFLICT (provider_id) DO UPDATE SET
    total_reviews = EXCLUDED.total_reviews,
    average_rating = EXCLUDED.average_rating,
    rating_1_count = EXCLUDED.rating_1_count,
    rating_2_count = EXCLUDED.rating_2_count,
    rating_3_count = EXCLUDED.rating_3_count,
    rating_4_count = EXCLUDED.rating_4_count,
    rating_5_count = EXCLUDED.rating_5_count,
    last_review_at = EXCLUDED.last_review_at,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_review_aggregates_trigger
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_review_aggregates();

-- Function to update job counts
CREATE OR REPLACE FUNCTION update_provider_job_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    UPDATE providers
    SET total_jobs_completed = total_jobs_completed + 1
    WHERE id = NEW.provider_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_provider_job_count_trigger
  AFTER INSERT OR UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_provider_job_count();

-- Function to auto-update last_login_at
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET last_login_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_last_login_trigger
  AFTER INSERT ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_last_login();

-- Function to cleanup old sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM sessions WHERE expires_at < NOW()
    RETURNING *
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MATERIALIZED VIEWS
-- =====================================================

-- Provider performance statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS provider_stats AS
SELECT 
  p.id AS provider_id,
  p.business_name,
  COUNT(DISTINCT j.id) AS total_jobs,
  COUNT(DISTINCT CASE WHEN j.status = 'completed' THEN j.id END) AS completed_jobs,
  COALESCE(AVG(r.rating), 0) AS average_rating,
  COUNT(DISTINCT r.id) AS total_reviews,
  SUM(pay.amount) AS total_earnings
FROM providers p
LEFT JOIN jobs j ON j.provider_id = p.id
LEFT JOIN reviews r ON r.provider_id = p.id
LEFT JOIN payments pay ON pay.job_id = j.id AND pay.status = 'completed'
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.business_name;

CREATE UNIQUE INDEX idx_provider_stats_provider_id ON provider_stats(provider_id);

-- Service request statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS service_request_stats AS
SELECT 
  DATE_TRUNC('day', created_at) AS date,
  category_id,
  COUNT(*) AS request_count,
  COUNT(DISTINCT user_id) AS unique_users,
  AVG(budget) AS avg_budget
FROM service_requests
WHERE deleted_at IS NULL
GROUP BY DATE_TRUNC('day', created_at), category_id;

CREATE INDEX idx_service_request_stats_date ON service_request_stats(date DESC);
CREATE INDEX idx_service_request_stats_category ON service_request_stats(category_id);

-- =====================================================
-- FULL-TEXT SEARCH SETUP
-- =====================================================

-- Add tsvector columns for full-text search
ALTER TABLE service_request_search 
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create index for full-text search
CREATE INDEX IF NOT EXISTS idx_service_request_search_vector 
  ON service_request_search USING GIN(search_vector);

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_service_request_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.location, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_search_vector_trigger
  BEFORE INSERT OR UPDATE ON service_request_search
  FOR EACH ROW EXECUTE FUNCTION update_service_request_search_vector();

-- =====================================================
-- BACKGROUND JOB INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_background_jobs_type_status 
  ON background_jobs(job_type, status);

CREATE INDEX IF NOT EXISTS idx_background_jobs_attempts 
  ON background_jobs(attempts) WHERE status != 'completed';

-- =====================================================
-- SECURITY & AUDIT
-- =====================================================

-- Index for security monitoring
CREATE INDEX idx_login_attempts_failed 
  ON login_attempts(email, created_at DESC) 
  WHERE success = false;

-- Index for suspicious activity detection
CREATE INDEX idx_login_attempts_ip_failed 
  ON login_attempts(ip_address, created_at DESC) 
  WHERE success = false;

-- =====================================================
-- DATABASE COMMENTS (DOCUMENTATION)
-- =====================================================

COMMENT ON TABLE users IS 'Core user accounts for customers, providers, and admins';
COMMENT ON TABLE providers IS 'Extended profile information for service providers';
COMMENT ON TABLE service_requests IS 'Customer service requests posted to the marketplace';
COMMENT ON TABLE proposals IS 'Provider proposals/bids for service requests';
COMMENT ON TABLE jobs IS 'Active or completed jobs between customers and providers';
COMMENT ON TABLE payments IS 'Payment transactions for completed jobs';
COMMENT ON TABLE reviews IS 'Customer reviews and ratings for providers';
COMMENT ON TABLE messages IS 'In-job messaging between customers and providers';
COMMENT ON TABLE notifications IS 'User notification queue (push, email, SMS)';

COMMENT ON COLUMN users.email_verified IS 'True if email has been verified via token';
COMMENT ON COLUMN users.phone_verified IS 'True if phone has been verified via OTP';
COMMENT ON COLUMN users.last_login_at IS 'Last login timestamp - auto-updated on session creation';
COMMENT ON COLUMN users.deleted_at IS 'Soft delete timestamp for GDPR compliance';
COMMENT ON COLUMN service_requests.budget IS 'Customer budget in cents to avoid decimal precision issues';
COMMENT ON COLUMN service_requests.images IS 'JSONB array of image URLs attached to request';
COMMENT ON COLUMN payments.amount IS 'Payment amount in cents to avoid decimal precision issues';
COMMENT ON COLUMN payments.platform_fee IS 'Marketplace commission in cents';
COMMENT ON COLUMN payments.provider_amount IS 'Amount provider receives after fees in cents';
COMMENT ON COLUMN providers.rating IS 'Automatically calculated average from reviews';
COMMENT ON COLUMN providers.total_jobs_completed IS 'Auto-incremented counter updated by trigger';
COMMENT ON COLUMN providers.certifications IS 'JSONB array of certification objects';
COMMENT ON COLUMN reviews.helpful_count IS 'Number of users who found this review helpful';
COMMENT ON COLUMN reviews.verified_purchase IS 'True if review is from actual completed job';

-- =====================================================
-- UNSUBSCRIBE TABLE
-- =====================================================

CREATE TABLE unsubscribes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  reason TEXT,
  unsubscribed_at TIMESTAMP DEFAULT now() NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX idx_unsubscribes_email ON unsubscribes(email);
CREATE INDEX idx_unsubscribes_user_id ON unsubscribes(user_id);
CREATE UNIQUE INDEX idx_unsubscribes_email_unique ON unsubscribes(email);

COMMENT ON TABLE unsubscribes IS 'Users who have unsubscribed from email notifications';

-- =====================================================
-- PROVIDER DOCUMENTS & CERTIFICATIONS
-- =====================================================

CREATE TABLE provider_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('government_id', 'business_license', 'insurance_certificate', 'certification', 'tax_document')),
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

CREATE INDEX idx_provider_documents_provider_id ON provider_documents(provider_id);
CREATE INDEX idx_provider_documents_type ON provider_documents(document_type);
CREATE INDEX idx_provider_documents_verified ON provider_documents(verified);

-- =====================================================
-- PROVIDER PORTFOLIO
-- =====================================================

CREATE TABLE provider_portfolio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX idx_provider_portfolio_provider_id ON provider_portfolio(provider_id);
CREATE INDEX idx_provider_portfolio_order ON provider_portfolio(provider_id, display_order);

-- =====================================================
-- NOTIFICATION PREFERENCES
-- =====================================================

CREATE TABLE notification_preferences (
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

CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- =====================================================
-- SAVED PAYMENT METHODS
-- =====================================================

CREATE TABLE saved_payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('card', 'bank_account', 'paypal', 'other')),
  card_brand TEXT,
  last_four VARCHAR(4),
  expiry_month INT,
  expiry_year INT,
  is_default BOOLEAN DEFAULT false,
  billing_email TEXT,
  gateway_customer_id TEXT,
  gateway_payment_method_id TEXT,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX idx_saved_payment_methods_user_id ON saved_payment_methods(user_id);
CREATE INDEX idx_saved_payment_methods_default ON saved_payment_methods(user_id, is_default);
CREATE UNIQUE INDEX idx_saved_payment_methods_one_default 
  ON saved_payment_methods(user_id) 
  WHERE is_default = true;

-- =====================================================
-- PROVIDER SUBSCRIPTIONS
-- =====================================================

CREATE TABLE pricing_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price BIGINT NOT NULL,
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
  features JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES pricing_plans(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  started_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX idx_subscriptions_provider_id ON subscriptions(provider_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_expires_at ON subscriptions(expires_at) WHERE status = 'active';

-- =====================================================
-- REVIEW AGGREGATES (CACHED STATISTICS)
-- =====================================================

CREATE TABLE provider_review_aggregates (
  provider_id UUID PRIMARY KEY REFERENCES providers(id) ON DELETE CASCADE,
  total_reviews INT DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  rating_1_count INT DEFAULT 0,
  rating_2_count INT DEFAULT 0,
  rating_3_count INT DEFAULT 0,
  rating_4_count INT DEFAULT 0,
  rating_5_count INT DEFAULT 0,
  last_review_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_provider_review_aggregates_rating ON provider_review_aggregates(average_rating DESC);
CREATE INDEX idx_provider_review_aggregates_total ON provider_review_aggregates(total_reviews DESC);

-- =====================================================
-- MAINTENANCE RECOMMENDATIONS
-- =====================================================

-- Run these commands periodically for optimal performance:
-- 1. Refresh materialized views:
--    REFRESH MATERIALIZED VIEW CONCURRENTLY provider_stats;
--    REFRESH MATERIALIZED VIEW CONCURRENTLY service_request_stats;
--
-- 2. Cleanup expired data:
--    SELECT cleanup_expired_tokens();
--    SELECT cleanup_expired_sessions();
--
-- 3. Analyze tables after large data changes:
--    ANALYZE users;
--    ANALYZE service_requests;
--    ANALYZE jobs;
--
-- 4. Vacuum regularly (automatic with autovacuum, but can be manual):
--    VACUUM ANALYZE;
--
-- 5. Monitor slow queries:
--    SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
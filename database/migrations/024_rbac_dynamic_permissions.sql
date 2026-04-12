-- =====================================================
-- Migration 024: Dynamic RBAC — Roles & Permissions
-- =====================================================
-- Adds roles, permissions, and role_permissions tables
-- to support fully dynamic, database-driven RBAC.
-- The users.role TEXT column is kept for backward compatibility
-- and synced from the new roles table via role_id FK.
-- =====================================================

-- 1. Roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  updated_at TIMESTAMP
);

CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_roles_is_active ON roles(is_active) WHERE is_active = true;

-- 2. Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(150) NOT NULL,
  description TEXT,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);

CREATE INDEX idx_permissions_name ON permissions(name);
CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE UNIQUE INDEX idx_permissions_resource_action ON permissions(resource, action);

-- 3. Role-Permission junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now() NOT NULL,
  PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- 4. Seed system roles
INSERT INTO roles (id, name, display_name, description, is_system, is_active)
VALUES
  (uuid_generate_v4(), 'customer', 'Customer', 'End users who request services', true, true),
  (uuid_generate_v4(), 'provider', 'Provider', 'Service providers who offer services', true, true),
  (uuid_generate_v4(), 'admin', 'Administrator', 'Platform administrators with full access', true, true)
ON CONFLICT (name) DO NOTHING;

-- 5. Seed permissions (resource.action naming convention)
INSERT INTO permissions (id, name, display_name, description, resource, action) VALUES
  -- Dashboard
  (uuid_generate_v4(), 'dashboard.view', 'View Dashboard', 'Access the dashboard', 'dashboard', 'view'),

  -- Users
  (uuid_generate_v4(), 'users.list', 'List Users', 'View user list', 'users', 'list'),
  (uuid_generate_v4(), 'users.read', 'Read User', 'View user details', 'users', 'read'),
  (uuid_generate_v4(), 'users.create', 'Create User', 'Create new users', 'users', 'create'),
  (uuid_generate_v4(), 'users.update', 'Update User', 'Update user details', 'users', 'update'),
  (uuid_generate_v4(), 'users.delete', 'Delete User', 'Delete users', 'users', 'delete'),
  (uuid_generate_v4(), 'users.manage', 'Manage All Users', 'Full user management access', 'users', 'manage'),

  -- Profile (own)
  (uuid_generate_v4(), 'profile.view', 'View Own Profile', 'View own profile', 'profile', 'view'),
  (uuid_generate_v4(), 'profile.update', 'Update Own Profile', 'Update own profile', 'profile', 'update'),

  -- Providers
  (uuid_generate_v4(), 'providers.list', 'List Providers', 'View provider list', 'providers', 'list'),
  (uuid_generate_v4(), 'providers.read', 'Read Provider', 'View provider details', 'providers', 'read'),
  (uuid_generate_v4(), 'providers.verify', 'Verify Provider', 'Approve or verify providers', 'providers', 'verify'),
  (uuid_generate_v4(), 'providers.manage', 'Manage Providers', 'Full provider management', 'providers', 'manage'),

  -- Provider Profile (own)
  (uuid_generate_v4(), 'provider_profile.view', 'View Provider Profile', 'View own provider profile', 'provider_profile', 'view'),
  (uuid_generate_v4(), 'provider_profile.update', 'Update Provider Profile', 'Update own provider profile', 'provider_profile', 'update'),

  -- Provider Services (own)
  (uuid_generate_v4(), 'provider_services.manage', 'Manage Provider Services', 'Manage own services offered', 'provider_services', 'manage'),

  -- Provider Availability
  (uuid_generate_v4(), 'provider_availability.manage', 'Manage Availability', 'Manage own availability schedule', 'provider_availability', 'manage'),

  -- Provider Portfolio
  (uuid_generate_v4(), 'provider_portfolio.manage', 'Manage Portfolio', 'Manage portfolio items', 'provider_portfolio', 'manage'),

  -- Provider Documents
  (uuid_generate_v4(), 'provider_documents.manage', 'Manage Documents', 'Manage provider documents', 'provider_documents', 'manage'),

  -- Service Requests
  (uuid_generate_v4(), 'requests.create', 'Create Request', 'Create service requests', 'requests', 'create'),
  (uuid_generate_v4(), 'requests.read', 'Read Requests', 'View service requests', 'requests', 'read'),
  (uuid_generate_v4(), 'requests.update', 'Update Request', 'Update own service requests', 'requests', 'update'),
  (uuid_generate_v4(), 'requests.delete', 'Delete Request', 'Delete own service requests', 'requests', 'delete'),
  (uuid_generate_v4(), 'requests.browse', 'Browse Requests', 'Browse available requests', 'requests', 'browse'),
  (uuid_generate_v4(), 'requests.manage', 'Manage All Requests', 'Manage any service request', 'requests', 'manage'),
  (uuid_generate_v4(), 'requests.view_stats', 'View Request Stats', 'View request statistics', 'requests', 'view_stats'),

  -- Categories
  (uuid_generate_v4(), 'categories.read', 'Read Categories', 'View service categories', 'categories', 'read'),
  (uuid_generate_v4(), 'categories.manage', 'Manage Categories', 'Create/update/delete categories', 'categories', 'manage'),

  -- Proposals
  (uuid_generate_v4(), 'proposals.create', 'Create Proposal', 'Submit proposals', 'proposals', 'create'),
  (uuid_generate_v4(), 'proposals.read', 'Read Proposals', 'View proposals', 'proposals', 'read'),
  (uuid_generate_v4(), 'proposals.update', 'Update Proposal', 'Update own proposals', 'proposals', 'update'),
  (uuid_generate_v4(), 'proposals.accept', 'Accept Proposal', 'Accept proposals on own requests', 'proposals', 'accept'),
  (uuid_generate_v4(), 'proposals.manage', 'Manage All Proposals', 'Manage any proposal', 'proposals', 'manage'),

  -- Jobs
  (uuid_generate_v4(), 'jobs.create', 'Create Job', 'Create jobs from accepted proposals', 'jobs', 'create'),
  (uuid_generate_v4(), 'jobs.read', 'Read Jobs', 'View job details', 'jobs', 'read'),
  (uuid_generate_v4(), 'jobs.update_status', 'Update Job Status', 'Start/complete jobs', 'jobs', 'update_status'),
  (uuid_generate_v4(), 'jobs.manage', 'Manage All Jobs', 'Manage any job', 'jobs', 'manage'),
  (uuid_generate_v4(), 'jobs.view_stats', 'View Job Stats', 'View job statistics', 'jobs', 'view_stats'),

  -- Reviews
  (uuid_generate_v4(), 'reviews.create', 'Create Review', 'Submit reviews', 'reviews', 'create'),
  (uuid_generate_v4(), 'reviews.read', 'Read Reviews', 'View reviews', 'reviews', 'read'),
  (uuid_generate_v4(), 'reviews.update', 'Update Review', 'Update own reviews', 'reviews', 'update'),
  (uuid_generate_v4(), 'reviews.delete', 'Delete Review', 'Delete reviews', 'reviews', 'delete'),
  (uuid_generate_v4(), 'reviews.manage', 'Manage All Reviews', 'Manage any review', 'reviews', 'manage'),

  -- Favorites
  (uuid_generate_v4(), 'favorites.manage', 'Manage Favorites', 'Add/remove favorites', 'favorites', 'manage'),

  -- Payments
  (uuid_generate_v4(), 'payments.create', 'Create Payment', 'Make payments', 'payments', 'create'),
  (uuid_generate_v4(), 'payments.read', 'Read Own Payments', 'View own payment history', 'payments', 'read'),
  (uuid_generate_v4(), 'payments.manage', 'Manage All Payments', 'View and manage all payments', 'payments', 'manage'),
  (uuid_generate_v4(), 'payments.view_stats', 'View Payment Stats', 'View payment statistics', 'payments', 'view_stats'),

  -- Refunds
  (uuid_generate_v4(), 'refunds.create', 'Request Refund', 'Request refunds', 'refunds', 'create'),
  (uuid_generate_v4(), 'refunds.manage', 'Manage Refunds', 'Manage all refunds', 'refunds', 'manage'),

  -- Subscriptions
  (uuid_generate_v4(), 'subscriptions.manage', 'Manage Subscriptions', 'Manage own subscriptions', 'subscriptions', 'manage'),

  -- Earnings
  (uuid_generate_v4(), 'earnings.view', 'View Earnings', 'View own earning reports', 'earnings', 'view'),
  (uuid_generate_v4(), 'earnings.manage', 'Manage All Earnings', 'View and manage all earnings', 'earnings', 'manage'),

  -- Coupons
  (uuid_generate_v4(), 'coupons.manage', 'Manage Coupons', 'Create/update/delete coupons', 'coupons', 'manage'),

  -- Notifications
  (uuid_generate_v4(), 'notifications.view', 'View Notifications', 'View own notifications', 'notifications', 'view'),
  (uuid_generate_v4(), 'notifications.manage', 'Manage Notifications', 'Manage all notifications', 'notifications', 'manage'),

  -- Messages
  (uuid_generate_v4(), 'messages.send', 'Send Messages', 'Send messages in conversations', 'messages', 'send'),
  (uuid_generate_v4(), 'messages.read', 'Read Messages', 'Read own messages', 'messages', 'read'),
  (uuid_generate_v4(), 'messages.manage', 'Manage All Messages', 'Manage any message', 'messages', 'manage'),

  -- Disputes
  (uuid_generate_v4(), 'disputes.file', 'File Dispute', 'File a dispute', 'disputes', 'file'),
  (uuid_generate_v4(), 'disputes.read', 'Read Disputes', 'View own disputes', 'disputes', 'read'),
  (uuid_generate_v4(), 'disputes.manage', 'Manage All Disputes', 'Manage and resolve disputes', 'disputes', 'manage'),
  (uuid_generate_v4(), 'disputes.view_stats', 'View Dispute Stats', 'View dispute statistics', 'disputes', 'view_stats'),

  -- Analytics
  (uuid_generate_v4(), 'analytics.view', 'View Analytics', 'View platform analytics', 'analytics', 'view'),
  (uuid_generate_v4(), 'analytics.manage', 'Manage Analytics', 'Full analytics access and export', 'analytics', 'manage'),

  -- Audit Logs
  (uuid_generate_v4(), 'audit.view', 'View Audit Logs', 'View audit logs', 'audit', 'view'),
  (uuid_generate_v4(), 'audit.manage', 'Manage Audit Logs', 'Full audit log management', 'audit', 'manage'),

  -- Admin (general access)
  (uuid_generate_v4(), 'admin.access', 'Admin Panel Access', 'Access the admin panel', 'admin', 'access'),
  (uuid_generate_v4(), 'admin.contact_view', 'View Contact Submissions', 'View contact form submissions', 'admin', 'contact_view'),

  -- Settings
  (uuid_generate_v4(), 'settings.manage', 'Manage System Settings', 'Manage platform settings', 'settings', 'manage'),

  -- Roles & Permissions (meta)
  (uuid_generate_v4(), 'roles.read', 'Read Roles', 'View roles and permissions', 'roles', 'read'),
  (uuid_generate_v4(), 'roles.manage', 'Manage Roles', 'Create/update/delete roles and assign permissions', 'roles', 'manage'),

  -- Infrastructure
  (uuid_generate_v4(), 'infrastructure.events', 'Manage Events', 'View and manage system events', 'infrastructure', 'events'),
  (uuid_generate_v4(), 'infrastructure.jobs', 'Manage Background Jobs', 'View and manage background jobs', 'infrastructure', 'jobs'),
  (uuid_generate_v4(), 'infrastructure.rate_limits', 'Manage Rate Limits', 'Configure rate limits', 'infrastructure', 'rate_limits'),
  (uuid_generate_v4(), 'infrastructure.feature_flags', 'Manage Feature Flags', 'Toggle feature flags', 'infrastructure', 'feature_flags')

ON CONFLICT (name) DO NOTHING;

-- 6. Assign permissions to system roles

-- Helper: assign all permissions matching a list of names to a role
-- Admin gets ALL permissions
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, now()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Customer permissions
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, now()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'customer'
  AND p.name IN (
    'dashboard.view',
    'profile.view',
    'profile.update',
    'providers.list',
    'providers.read',
    'categories.read',
    'requests.create',
    'requests.read',
    'requests.update',
    'requests.delete',
    'proposals.read',
    'proposals.accept',
    'jobs.create',
    'jobs.read',
    'reviews.create',
    'reviews.read',
    'reviews.update',
    'favorites.manage',
    'payments.create',
    'payments.read',
    'refunds.create',
    'notifications.view',
    'messages.send',
    'messages.read',
    'disputes.file',
    'disputes.read'
  )
ON CONFLICT DO NOTHING;

-- Provider permissions
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT r.id, p.id, now()
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'provider'
  AND p.name IN (
    'dashboard.view',
    'profile.view',
    'profile.update',
    'providers.read',
    'categories.read',
    'provider_profile.view',
    'provider_profile.update',
    'provider_services.manage',
    'provider_availability.manage',
    'provider_portfolio.manage',
    'provider_documents.manage',
    'requests.read',
    'requests.browse',
    'proposals.create',
    'proposals.read',
    'proposals.update',
    'jobs.read',
    'jobs.update_status',
    'reviews.read',
    'earnings.view',
    'subscriptions.manage',
    'notifications.view',
    'messages.send',
    'messages.read',
    'disputes.file',
    'disputes.read',
    'payments.read'
  )
ON CONFLICT DO NOTHING;

-- 7. Add role_id FK column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id);

-- 8. Populate role_id from existing users.role column
UPDATE users u
SET role_id = r.id
FROM roles r
WHERE u.role = r.name AND u.role_id IS NULL;

-- 9. Drop the old CHECK constraint on users.role
-- (The constraint name may vary; attempt common names)
DO $$
BEGIN
  -- Try dropping by constraint name patterns
  BEGIN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_role;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- Also remove any CHECK constraint containing 'role' on users table dynamically
DO $$
DECLARE
  _conname TEXT;
BEGIN
  FOR _conname IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE rel.relname = 'users'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', _conname);
  END LOOP;
END $$;

-- 10. Create a trigger to keep users.role synced with roles.name for backward compatibility
CREATE OR REPLACE FUNCTION sync_user_role_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role_id IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.role_id IS DISTINCT FROM OLD.role_id) THEN
    SELECT name INTO NEW.role FROM roles WHERE id = NEW.role_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_user_role_name ON users;
CREATE TRIGGER trg_sync_user_role_name
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_role_name();

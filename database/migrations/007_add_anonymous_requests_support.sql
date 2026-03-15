-- Migration 007: Add support for anonymous service requests
-- Date: 2026-03-15
-- Description: Allows users to create service requests without authentication by providing guest contact information

-- Step 1: Make user_id nullable in locations table (for anonymous request locations)
ALTER TABLE locations 
  ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: Make user_id nullable in service_requests (allow anonymous requests)
ALTER TABLE service_requests 
  ALTER COLUMN user_id DROP NOT NULL;

-- Step 3: Add guest information columns
ALTER TABLE service_requests 
  ADD COLUMN IF NOT EXISTS guest_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS guest_email VARCHAR(255) CHECK (guest_email IS NULL OR guest_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  ADD COLUMN IF NOT EXISTS guest_phone VARCHAR(20) CHECK (guest_phone IS NULL OR guest_phone ~ '^\+?[0-9]{10,15}$');

-- Step 4: Add constraint to ensure either user_id OR guest info is provided
ALTER TABLE service_requests
  ADD CONSTRAINT check_user_or_guest CHECK (
    (user_id IS NOT NULL) OR 
    (guest_name IS NOT NULL AND guest_email IS NOT NULL AND guest_phone IS NOT NULL)
  );

-- Step 5: Update indexes to handle nullable user_id
DROP INDEX IF EXISTS idx_service_requests_user_id;
DROP INDEX IF EXISTS idx_service_requests_user_status;
DROP INDEX IF EXISTS idx_locations_user_id;

CREATE INDEX idx_service_requests_user_id ON service_requests(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_service_requests_user_status ON service_requests(user_id, status) WHERE user_id IS NOT NULL;
CREATE INDEX idx_service_requests_guest_email ON service_requests(guest_email) WHERE guest_email IS NOT NULL;
CREATE INDEX idx_locations_user_id ON locations(user_id) WHERE user_id IS NOT NULL;

-- Step 6: Add comments for documentation
COMMENT ON COLUMN locations.user_id IS 'User ID for authenticated users. NULL for anonymous request locations.';
COMMENT ON COLUMN service_requests.user_id IS 'User ID for authenticated requests. NULL for anonymous requests.';
COMMENT ON COLUMN service_requests.guest_name IS 'Guest name for anonymous requests (required when user_id is NULL)';
COMMENT ON COLUMN service_requests.guest_email IS 'Guest email for anonymous requests (required when user_id is NULL)';
COMMENT ON COLUMN service_requests.guest_phone IS 'Guest phone for anonymous requests (required when user_id is NULL)';
COMMENT ON CONSTRAINT check_user_or_guest ON service_requests IS 'Ensures either authenticated (user_id) or anonymous (guest info) request';

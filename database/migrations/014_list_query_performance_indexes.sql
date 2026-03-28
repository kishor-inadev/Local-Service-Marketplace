-- =====================================================
-- LIST QUERY PERFORMANCE INDEXES
-- Date: March 28, 2026
-- Purpose: Optimize new list filtering, sorting, and pagination paths
-- =====================================================

BEGIN;

-- =====================================================
-- SERVICE REQUESTS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_service_requests_status_created_at
ON service_requests(status, created_at DESC)
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_service_requests_status_created_at IS 'Optimizes request list queries filtering by status and sorting by newest first';

CREATE INDEX IF NOT EXISTS idx_service_requests_category_status_created_at
ON service_requests(category_id, status, created_at DESC)
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_service_requests_category_status_created_at IS 'Optimizes request list queries filtering by category and status with newest-first sorting';

CREATE INDEX IF NOT EXISTS idx_service_requests_urgency_created_at
ON service_requests(urgency, created_at DESC)
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_service_requests_urgency_created_at IS 'Optimizes request list queries filtering by urgency with newest-first sorting';

-- =====================================================
-- PROPOSALS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_proposals_request_created_at
ON proposals(request_id, created_at DESC);

COMMENT ON INDEX idx_proposals_request_created_at IS 'Optimizes request-scoped proposal lists sorted by newest first';

CREATE INDEX IF NOT EXISTS idx_proposals_provider_status_created_at
ON proposals(provider_id, status, created_at DESC);

COMMENT ON INDEX idx_proposals_provider_status_created_at IS 'Optimizes provider proposal lists filtered by status and sorted by newest first';

CREATE INDEX IF NOT EXISTS idx_proposals_status_created_at
ON proposals(status, created_at DESC);

COMMENT ON INDEX idx_proposals_status_created_at IS 'Optimizes proposal lists filtered by status and sorted by newest first';

-- =====================================================
-- JOBS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_jobs_provider_started_at
ON jobs(provider_id, started_at DESC);

COMMENT ON INDEX idx_jobs_provider_started_at IS 'Optimizes provider job lists sorted by started time';

CREATE INDEX IF NOT EXISTS idx_jobs_customer_started_at
ON jobs(customer_id, started_at DESC);

COMMENT ON INDEX idx_jobs_customer_started_at IS 'Optimizes customer job lists sorted by started time';

CREATE INDEX IF NOT EXISTS idx_jobs_status_started_at
ON jobs(status, started_at DESC);

COMMENT ON INDEX idx_jobs_status_started_at IS 'Optimizes job status lists sorted by started time';

CREATE INDEX IF NOT EXISTS idx_jobs_completed_at
ON jobs(completed_at DESC)
WHERE completed_at IS NOT NULL;

COMMENT ON INDEX idx_jobs_completed_at IS 'Optimizes completed job date-range queries and completed-at sorting';

ANALYZE service_requests;
ANALYZE proposals;
ANALYZE jobs;

COMMIT;
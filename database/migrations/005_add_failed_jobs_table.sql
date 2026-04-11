-- Dead Letter Queue (DLQ) table for storing failed jobs
-- This prevents job loss and allows admin review/replay of failed operations

CREATE TABLE IF NOT EXISTS failed_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name VARCHAR(100) NOT NULL,
  job_id VARCHAR(255) NOT NULL,
  job_name VARCHAR(100) NOT NULL,
  job_data JSONB NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  failed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  replayed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'failed' CHECK (status IN ('failed', 'replayed', 'discarded')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (queue_name, job_id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_failed_jobs_queue_name ON failed_jobs(queue_name);
CREATE INDEX IF NOT EXISTS idx_failed_jobs_status ON failed_jobs(status);
CREATE INDEX IF NOT EXISTS idx_failed_jobs_failed_at ON failed_jobs(failed_at DESC);
CREATE INDEX IF NOT EXISTS idx_failed_jobs_queue_status ON failed_jobs(queue_name, status);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_failed_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_failed_jobs_updated_at
BEFORE UPDATE ON failed_jobs
FOR EACH ROW
EXECUTE FUNCTION update_failed_jobs_updated_at();

-- Add comment
COMMENT ON TABLE failed_jobs IS 'Dead Letter Queue for storing failed BullMQ jobs after max retries exceeded';
COMMENT ON COLUMN failed_jobs.queue_name IS 'Name of the BullMQ queue (e.g., payment.refund, comms.email)';
COMMENT ON COLUMN failed_jobs.job_id IS 'Original BullMQ job ID';
COMMENT ON COLUMN failed_jobs.job_name IS 'Job name/type (e.g., process-refund, send-email)';
COMMENT ON COLUMN failed_jobs.job_data IS 'Original job data payload';
COMMENT ON COLUMN failed_jobs.error_message IS 'Error message from the failed job';
COMMENT ON COLUMN failed_jobs.error_stack IS 'Error stack trace for debugging';
COMMENT ON COLUMN failed_jobs.attempts IS 'Number of attempts made before failure';
COMMENT ON COLUMN failed_jobs.status IS 'Current status: failed (awaiting review), replayed (re-queued), discarded (ignored)';

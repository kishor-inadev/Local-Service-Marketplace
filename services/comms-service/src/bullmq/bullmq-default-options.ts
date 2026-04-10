import { JobsOptions } from 'bullmq';

/**
 * Default job options applied to every queue in this service.
 *
 * - attempts: 3 retries with exponential back-off (5 s → 10 s → 20 s)
 * - removeOnComplete: keep last 100 completed jobs or jobs younger than 24 h
 * - removeOnFail:     keep last 500 failed  jobs or jobs younger than  7 d
 *
 * Individual enqueue calls may override these per-job.
 */
export const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5_000 },
  removeOnComplete: { count: 100, age: 86_400 },
  removeOnFail: { count: 500, age: 604_800 },
};

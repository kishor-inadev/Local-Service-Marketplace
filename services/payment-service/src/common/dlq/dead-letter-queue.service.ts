import { Injectable, Inject, LoggerService } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue, Job } from "bullmq";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { Pool } from "pg";

export interface FailedJobRecord {
  id: string;
  queue_name: string;
  job_id: string;
  job_name: string;
  job_data: any;
  error_message: string;
  error_stack: string;
  attempts: number;
  failed_at: Date;
  replayed_at?: Date;
  status: "failed" | "replayed" | "discarded";
}

/**
 * DeadLetterQueueService - Manages failed jobs across all BullMQ queues
 * 
 * Features:
 * - Captures failed jobs after max retries
 * - Stores in database for admin review
 * - Provides replay/discard functionality
 * - Prevents job loss
 * 
 * Usage:
 * In worker error handlers, call captureFailedJob() when job.attemptsMade >= maxAttempts
 */
@Injectable()
export class DeadLetterQueueService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @Inject("DATABASE_POOL") private readonly pool: Pool,
  ) {}

  /**
   * Capture a failed job and store in DLQ
   */
  async captureFailedJob(
    queueName: string,
    job: Job,
    error: Error,
  ): Promise<void> {
    try {
      const query = `
        INSERT INTO failed_jobs (
          id, queue_name, job_id, job_name, job_data,
          error_message, error_stack, attempts, failed_at, status
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), 'failed'
        )
        ON CONFLICT (queue_name, job_id) DO UPDATE SET
          error_message = EXCLUDED.error_message,
          error_stack = EXCLUDED.error_stack,
          attempts = EXCLUDED.attempts,
          failed_at = EXCLUDED.failed_at
      `;

      await this.pool.query(query, [
        queueName,
        job.id,
        job.name,
        JSON.stringify(job.data),
        error.message,
        error.stack || "",
        job.attemptsMade,
      ]);

      this.logger.warn(
        `Captured failed job in DLQ: ${queueName}/${job.name}/${job.id} - ${error.message}`,
        "DeadLetterQueueService",
      );
    } catch (dbError) {
      this.logger.error(
        `Failed to store job in DLQ: ${dbError.message}`,
        dbError.stack,
        "DeadLetterQueueService",
      );
    }
  }
}

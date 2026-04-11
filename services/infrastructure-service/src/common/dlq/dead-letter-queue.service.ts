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

  /**
   * Get all failed jobs with pagination and filtering
   */
  async getFailedJobs(options: {
    queueName?: string;
    status?: "failed" | "replayed" | "discarded";
    limit?: number;
    offset?: number;
  }): Promise<{ jobs: FailedJobRecord[]; total: number }> {
    const { queueName, status, limit = 50, offset = 0 } = options;

    let whereClause = "WHERE 1=1";
    const params: any[] = [];

    if (queueName) {
      params.push(queueName);
      whereClause += ` AND queue_name = $${params.length}`;
    }

    if (status) {
      params.push(status);
      whereClause += ` AND status = $${params.length}`;
    }

    const countQuery = `SELECT COUNT(*) FROM failed_jobs ${whereClause}`;
    const countResult = await this.pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(limit, offset);
    const dataQuery = `
      SELECT * FROM failed_jobs
      ${whereClause}
      ORDER BY failed_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const result = await this.pool.query(dataQuery, params);

    return {
      jobs: result.rows.map((row) => ({
        ...row,
        job_data: JSON.parse(row.job_data),
      })),
      total,
    };
  }

  /**
   * Get a single failed job by ID
   */
  async getFailedJobById(id: string): Promise<FailedJobRecord | null> {
    const query = "SELECT * FROM failed_jobs WHERE id = $1";
    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return {
      ...result.rows[0],
      job_data: JSON.parse(result.rows[0].job_data),
    };
  }

  /**
   * Replay a failed job by re-queuing it
   * 
   * @param failedJobId - ID of the failed job record
   * @param queue - BullMQ queue instance to replay to
   */
  async replayFailedJob(failedJobId: string, queue: Queue): Promise<void> {
    const failedJob = await this.getFailedJobById(failedJobId);

    if (!failedJob) {
      throw new Error(`Failed job ${failedJobId} not found`);
    }

    if (failedJob.status === "replayed") {
      throw new Error(`Job ${failedJobId} has already been replayed`);
    }

    try {
      // Re-queue the job
      await queue.add(failedJob.job_name, failedJob.job_data, {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
      });

      // Mark as replayed
      await this.pool.query(
        "UPDATE failed_jobs SET status = 'replayed', replayed_at = NOW() WHERE id = $1",
        [failedJobId],
      );

      this.logger.log(
        `Replayed failed job ${failedJobId} to queue ${failedJob.queue_name}`,
        "DeadLetterQueueService",
      );
    } catch (error) {
      this.logger.error(
        `Failed to replay job ${failedJobId}: ${error.message}`,
        error.stack,
        "DeadLetterQueueService",
      );
      throw error;
    }
  }

  /**
   * Discard a failed job (mark as resolved without replaying)
   */
  async discardFailedJob(failedJobId: string): Promise<void> {
    await this.pool.query(
      "UPDATE failed_jobs SET status = 'discarded' WHERE id = $1",
      [failedJobId],
    );

    this.logger.log(
      `Discarded failed job ${failedJobId}`,
      "DeadLetterQueueService",
    );
  }

  /**
   * Cleanup old failed jobs (e.g., > 30 days and status = 'replayed')
   */
  async cleanupOldJobs(daysOld: number = 30): Promise<number> {
    const query = `
      DELETE FROM failed_jobs
      WHERE status IN ('replayed', 'discarded')
      AND failed_at < NOW() - INTERVAL '${daysOld} days'
    `;

    const result = await this.pool.query(query);

    this.logger.log(
      `Cleaned up ${result.rowCount} old failed jobs`,
      "DeadLetterQueueService",
    );

    return result.rowCount || 0;
  }

  /**
   * Get statistics about failed jobs by queue
   */
  async getFailedJobStats(): Promise<{
    total: number;
    byQueue: { queue_name: string; count: number }[];
    byStatus: { status: string; count: number }[];
  }> {
    const totalQuery = "SELECT COUNT(*) FROM failed_jobs WHERE status = 'failed'";
    const totalResult = await this.pool.query(totalQuery);

    const byQueueQuery = `
      SELECT queue_name, COUNT(*) as count
      FROM failed_jobs
      WHERE status = 'failed'
      GROUP BY queue_name
      ORDER BY count DESC
    `;
    const byQueueResult = await this.pool.query(byQueueQuery);

    const byStatusQuery = `
      SELECT status, COUNT(*) as count
      FROM failed_jobs
      GROUP BY status
    `;
    const byStatusResult = await this.pool.query(byStatusQuery);

    return {
      total: parseInt(totalResult.rows[0].count, 10),
      byQueue: byQueueResult.rows.map((row) => ({
        queue_name: row.queue_name,
        count: parseInt(row.count, 10),
      })),
      byStatus: byStatusResult.rows.map((row) => ({
        status: row.status,
        count: parseInt(row.count, 10),
      })),
    };
  }
}

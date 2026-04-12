import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { StrictUuidPipe } from "@/common/pipes/strict-uuid.pipe";
import { DeadLetterQueueService } from "../common/dlq/dead-letter-queue.service";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { PermissionsGuard as RolesGuard, Roles, RequirePermissions } from '@/common/rbac';

/**
 * DeadLetterQueueController - Admin interface for managing failed jobs
 * 
 * All endpoints require admin role
 * 
 * Endpoints:
 * - GET /dlq/jobs - List all failed jobs
 * - GET /dlq/jobs/:id - Get failed job details
 * - GET /dlq/stats - Get DLQ statistics
 * - POST /dlq/jobs/:id/replay - Replay a failed job
 * - DELETE /dlq/jobs/:id - Discard a failed job
 * - DELETE /dlq/cleanup - Cleanup old jobs
 */
@Controller("dlq")
@UseGuards(JwtAuthGuard, RolesGuard)
@RequirePermissions('admin.access')
export class DeadLetterQueueController {
  constructor(
    private readonly dlqService: DeadLetterQueueService,
    // Inject queues for replay functionality
    // Add more queues as needed
    @InjectQueue("payment.refund") private readonly paymentRefundQueue: Queue,
    @InjectQueue("payment.webhook") private readonly paymentWebhookQueue: Queue,
    @InjectQueue("comms.email") private readonly commsEmailQueue: Queue,
    @InjectQueue("comms.sms") private readonly commsSmsQueue: Queue,
    @InjectQueue("comms.push") private readonly commsPushQueue: Queue,
  ) {}

  /**
   * Get all failed jobs with filtering and pagination
   * GET /dlq/jobs?queueName=payment.refund&status=failed&limit=50&offset=0
   */
  @Get("jobs")
  @HttpCode(HttpStatus.OK)
  async getFailedJobs(
    @Query("queueName") queueName?: string,
    @Query("status") status?: "failed" | "replayed" | "discarded",
    @Query("limit") limit?: number,
    @Query("offset") offset?: number,
  ) {
    const result = await this.dlqService.getFailedJobs({
      queueName,
      status,
      limit: limit ? parseInt(String(limit), 10) : 50,
      offset: offset ? parseInt(String(offset), 10) : 0,
    });

    return {
      success: true,
      data: result.jobs,
      total: result.total,
      limit: limit || 50,
      offset: offset || 0,
    };
  }

  /**
   * Get a single failed job by ID
   * GET /dlq/jobs/:id
   */
  @Get("jobs/:id")
  @HttpCode(HttpStatus.OK)
  async getFailedJobById(@Param("id", StrictUuidPipe) id: string) {
    const job = await this.dlqService.getFailedJobById(id);

    if (!job) {
      return {
        success: false,
        message: "Failed job not found",
      };
    }

    return {
      success: true,
      data: job,
    };
  }

  /**
   * Get DLQ statistics
   * GET /dlq/stats
   */
  @Get("stats")
  @HttpCode(HttpStatus.OK)
  async getStats() {
    const stats = await this.dlqService.getFailedJobStats();

    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Replay a failed job (re-queue it)
   * POST /dlq/jobs/:id/replay
   */
  @Post("jobs/:id/replay")
  @HttpCode(HttpStatus.OK)
  async replayFailedJob(@Param("id", StrictUuidPipe) id: string) {
    const job = await this.dlqService.getFailedJobById(id);

    if (!job) {
      return {
        success: false,
        message: "Failed job not found",
      };
    }

    // Get the appropriate queue for replay
    const queue = this.getQueueByName(job.queue_name);

    if (!queue) {
      return {
        success: false,
        message: `Queue ${job.queue_name} not available for replay`,
      };
    }

    await this.dlqService.replayFailedJob(id, queue);

    return {
      success: true,
      message: `Job replayed to queue ${job.queue_name}`,
    };
  }

  /**
   * Discard a failed job (mark as resolved without replaying)
   * DELETE /dlq/jobs/:id
   */
  @Delete("jobs/:id")
  @HttpCode(HttpStatus.OK)
  async discardFailedJob(@Param("id", StrictUuidPipe) id: string) {
    await this.dlqService.discardFailedJob(id);

    return {
      success: true,
      message: "Failed job discarded",
    };
  }

  /**
   * Cleanup old replayed/discarded jobs
   * DELETE /dlq/cleanup?daysOld=30
   */
  @Delete("cleanup")
  @HttpCode(HttpStatus.OK)
  async cleanupOldJobs(@Query("daysOld") daysOld?: number) {
    const days = daysOld ? parseInt(String(daysOld), 10) : 30;
    const deletedCount = await this.dlqService.cleanupOldJobs(days);

    return {
      success: true,
      message: `Cleaned up ${deletedCount} old failed jobs (older than ${days} days)`,
      deletedCount,
    };
  }

  /**
   * Helper method to get queue instance by name
   */
  private getQueueByName(queueName: string): Queue | null {
    const queueMap: Record<string, Queue> = {
      "payment.refund": this.paymentRefundQueue,
      "payment.webhook": this.paymentWebhookQueue,
      "comms.email": this.commsEmailQueue,
      "comms.sms": this.commsSmsQueue,
      "comms.push": this.commsPushQueue,
      // Add more queues as needed
    };

    return queueMap[queueName] || null;
  }
}

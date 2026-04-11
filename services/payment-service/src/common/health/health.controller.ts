import { Controller, Get, Inject } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { Pool } from "pg";

@Controller("health")
export class HealthController {
  constructor(
    @Inject("DATABASE_POOL") private readonly pool: Pool,
    @InjectQueue("payment.notification") private readonly notificationQueue: Queue,
    @InjectQueue("payment.analytics") private readonly analyticsQueue: Queue,
    @InjectQueue("payment.refund") private readonly refundQueue: Queue,
    @InjectQueue("payment.webhook") private readonly webhookQueue: Queue,
  ) { }

  @Get()
  async check() {
    const health: any = {
      status: "ok",
      service: "payment-service",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };

    try {
      const start = Date.now();
      await this.pool.query("SELECT 1");
      health.database = {
        status: "ok",
        responseTime: `${Date.now() - start}ms`,
      };
    } catch (error: any) {
      health.status = "degraded";
      health.database = { status: "error", message: error.message };
    }

    return health;
  }

  @Get("queues")
  async checkQueues() {
    try {
      const [notificationCounts, analyticsCounts, refundCounts, webhookCounts] = await Promise.all([
        this.notificationQueue.getJobCounts(),
        this.analyticsQueue.getJobCounts(),
        this.refundQueue.getJobCounts(),
        this.webhookQueue.getJobCounts(),
      ]);

      const queues = {
        "payment.notification": {
          waiting: notificationCounts.waiting || 0,
          active: notificationCounts.active || 0,
          completed: notificationCounts.completed || 0,
          failed: notificationCounts.failed || 0,
          delayed: notificationCounts.delayed || 0,
        },
        "payment.analytics": {
          waiting: analyticsCounts.waiting || 0,
          active: analyticsCounts.active || 0,
          completed: analyticsCounts.completed || 0,
          failed: analyticsCounts.failed || 0,
          delayed: analyticsCounts.delayed || 0,
        },
        "payment.refund": {
          waiting: refundCounts.waiting || 0,
          active: refundCounts.active || 0,
          completed: refundCounts.completed || 0,
          failed: refundCounts.failed || 0,
          delayed: refundCounts.delayed || 0,
        },
        "payment.webhook": {
          waiting: webhookCounts.waiting || 0,
          active: webhookCounts.active || 0,
          completed: webhookCounts.completed || 0,
          failed: webhookCounts.failed || 0,
          delayed: webhookCounts.delayed || 0,
        },
      };

      // Calculate health status based on queue metrics
      let status = "ok";
      let warnings = [];

      Object.entries(queues).forEach(([queueName, counts]) => {
        if (counts.failed > 100) {
          warnings.push(`${queueName}: High failed job count (${counts.failed})`);
          status = "degraded";
        }
        if (counts.waiting > 1000) {
          warnings.push(`${queueName}: High waiting job count (${counts.waiting})`);
          status = "degraded";
        }
      });

      return {
        status,
        timestamp: new Date().toISOString(),
        queues,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error: any) {
      return {
        status: "error",
        message: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

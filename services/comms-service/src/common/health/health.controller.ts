import { Controller, Get, Inject } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { Pool } from "pg";

@Controller("health")
export class HealthController {
  constructor(
    @Inject("DATABASE_POOL") private readonly pool: Pool,
    @InjectQueue("comms.email") private readonly emailQueue: Queue,
    @InjectQueue("comms.sms") private readonly smsQueue: Queue,
    @InjectQueue("comms.push") private readonly pushQueue: Queue,
  ) { }

  @Get()
  async check() {
    const health: any = {
      status: "ok",
      service: "comms-service",
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
      health.database = {
        status: "error",
        message: error instanceof Error ? error.message : String(error)
      };
    }

    return health;
  }

  @Get("queues")
  async checkQueues() {
    try {
      const [emailCounts, smsCounts, pushCounts] = await Promise.all([
        this.emailQueue.getJobCounts(),
        this.smsQueue.getJobCounts(),
        this.pushQueue.getJobCounts(),
      ]);

      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        queues: {
          "comms.email": {
            waiting: emailCounts.waiting || 0,
            active: emailCounts.active || 0,
            completed: emailCounts.completed || 0,
            failed: emailCounts.failed || 0,
            delayed: emailCounts.delayed || 0,
          },
          "comms.sms": {
            waiting: smsCounts.waiting || 0,
            active: smsCounts.active || 0,
            completed: smsCounts.completed || 0,
            failed: smsCounts.failed || 0,
            delayed: smsCounts.delayed || 0,
          },
          "comms.push": {
            waiting: pushCounts.waiting || 0,
            active: pushCounts.active || 0,
            completed: pushCounts.completed || 0,
            failed: pushCounts.failed || 0,
            delayed: pushCounts.delayed || 0,
          },
        },
      };
    } catch (error: any) {
      return {
        status: "error",
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      };
    }
  }
}

import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { DeadLetterQueueController } from "./dlq.controller";
import { DeadLetterQueueService } from "../common/dlq/dead-letter-queue.service";
import { getQueueRegistrationOptions } from "../config/queue-config";

/**
 * Dead Letter Queue Module
 * 
 * Registers queues that have DLQ protection enabled.
 * Uses centralized queue configurations for timeouts and priorities.
 */
@Module({
  imports: [
    BullModule.registerQueue(
      getQueueRegistrationOptions("payment.refund"),
      getQueueRegistrationOptions("payment.webhook"),
      getQueueRegistrationOptions("comms.email"),
      getQueueRegistrationOptions("comms.sms"),
      getQueueRegistrationOptions("comms.push"),
    ),
  ],
  controllers: [DeadLetterQueueController],
  providers: [DeadLetterQueueService],
  exports: [DeadLetterQueueService],
})
export class DlqModule {}

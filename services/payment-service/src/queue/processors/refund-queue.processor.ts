import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { Inject, LoggerService } from "@nestjs/common";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { PaymentRepository } from "../../payment/repositories/payment.repository";
import { RefundRepository } from "../../payment/repositories/refund.repository";
import { PaymentGatewayService } from "../../payment/gateway/payment-gateway.service";

export interface RefundJobData {
  refundId: string;
  paymentId: string;
  amount: number;
  reason: string;
}

/**
 * RefundQueueProcessor
 *
 * Processes jobs from the "refund-queue" that are enqueued by RefundService.
 * Uses the real PaymentGatewayService so refunds are dispatched to the same
 * gateway that processed the original payment (stored in payments.gateway).
 *
 * Failures are caught, the refund row is marked "failed", and the error is
 * re-thrown so Bull's exponential-backoff retry logic kicks in.
 */
@Processor("refund-queue")
export class RefundQueueProcessor {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly paymentRepository: PaymentRepository,
    private readonly refundRepository: RefundRepository,
    private readonly paymentGateway: PaymentGatewayService,
  ) {}

  @Process({ name: "process-refund", concurrency: 5 })
  async handleRefund(job: Job<RefundJobData>): Promise<void> {
    const { refundId, paymentId, amount, reason } = job.data;

    this.logger.log(
      `Processing refund ${refundId} for payment ${paymentId}`,
      "RefundQueueProcessor",
    );

    try {
      // Load the payment to get the gateway + original transaction ID
      const payment = await this.paymentRepository.getPaymentById(paymentId);
      if (!payment) {
        throw new Error(
          `Payment ${paymentId} not found for refund ${refundId}`,
        );
      }

      const gateway = payment.gateway ?? "mock";
      const transactionId = payment.transaction_id;

      if (!transactionId) {
        throw new Error(
          `Payment ${paymentId} has no transaction_id — cannot issue refund via ${gateway}`,
        );
      }

      // Call the real gateway adapter to issue the refund
      const refundResult = await this.paymentGateway.refundWith(gateway, {
        transactionId,
        amount,
        reason,
      });

      await this.refundRepository.updateRefundStatus(refundId, "completed");

      this.logger.log(
        `Refund ${refundId} completed via ${gateway} — gateway refundId: ${refundResult.refundId}`,
        "RefundQueueProcessor",
      );
    } catch (error) {
      this.logger.error(
        `Refund processing failed for ${refundId}: ${error.message}`,
        error.stack,
        "RefundQueueProcessor",
      );

      // Mark refund as failed; Bull will retry based on RefundService job options
      await this.refundRepository.updateRefundStatus(refundId, "failed");

      // Re-throw so Bull increments the attempt counter and applies backoff
      throw error;
    }
  }
}

import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { PaymentRepository } from '../../payment/repositories/payment.repository';
import { RefundRepository } from '../../payment/repositories/refund.repository';

export interface PaymentRetryJobData {
  paymentId: string;
  jobId: string;
  amount: number;
  currency: string;
}

export interface RefundJobData {
  refundId: string;
  paymentId: string;
  amount: number;
  reason: string;
}

@Processor('payment-queue')
export class PaymentQueueProcessor {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
    private readonly paymentRepository: PaymentRepository,
    private readonly refundRepository: RefundRepository,
  ) {}

  @Process('retry-payment')
  async handleRetryPayment(job: Job<PaymentRetryJobData>): Promise<void> {
    const { paymentId, jobId, amount, currency } = job.data;

    this.logger.log(
      `Processing payment retry for payment ${paymentId}`,
      'PaymentQueueProcessor',
    );

    try {
      // Simulate payment gateway retry
      const transactionId = `txn_retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Update payment status
      await this.paymentRepository.updatePaymentStatus(
        paymentId,
        'completed',
        transactionId,
      );

      this.logger.log(
        `Payment retry successful for ${paymentId}`,
        'PaymentQueueProcessor',
      );
    } catch (error) {
      this.logger.error(
        `Payment retry failed for ${paymentId}: ${error.message}`,
        error.stack,
        'PaymentQueueProcessor',
      );

      // Update status to failed
      await this.paymentRepository.updatePaymentStatus(paymentId, 'failed', null);

      // Rethrow to trigger Bull's retry mechanism
      throw error;
    }
  }

  @Process({ name: 'process-refund', concurrency: 5 })
  async handleRefund(job: Job<RefundJobData>): Promise<void> {
    const { refundId, paymentId, amount, reason } = job.data;

    this.logger.log(
      `Processing refund ${refundId} for payment ${paymentId}`,
      'PaymentQueueProcessor',
    );

    try {
      // Simulate refund processing with payment gateway
      await new Promise((resolve) => setTimeout(resolve, 200));

      const transactionId = `rfnd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Update refund status
      await this.refundRepository.updateRefundStatus(refundId, 'completed');

      this.logger.log(
        `Refund processed successfully: ${refundId}`,
        'PaymentQueueProcessor',
      );
    } catch (error) {
      this.logger.error(
        `Refund processing failed for ${refundId}: ${error.message}`,
        error.stack,
        'PaymentQueueProcessor',
      );

      // Update refund status to failed
      await this.refundRepository.updateRefundStatus(refundId, 'failed');

      // Rethrow to trigger retry
      throw error;
    }
  }
}

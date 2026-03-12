import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { RefundRepository } from '../repositories/refund.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { Refund } from '../entities/refund.entity';
import { NotFoundException, BadRequestException } from '../../common/exceptions/http.exceptions';

@Injectable()
export class RefundService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
    @InjectQueue('refund-queue') private readonly refundQueue: Queue,
    private readonly refundRepository: RefundRepository,
    private readonly paymentRepository: PaymentRepository,
  ) {}

  async createRefund(paymentId: string, amount?: number): Promise<Refund> {
    this.logger.log(`Creating refund for payment ${paymentId}`, 'RefundService');

    // Verify payment exists
    const payment = await this.paymentRepository.getPaymentById(paymentId);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Check payment status
    if (payment.status !== 'completed') {
      throw new BadRequestException('Can only refund completed payments');
    }

    // Calculate refund amount
    const refundAmount = amount || payment.amount;

    // Validate refund amount
    if (refundAmount > payment.amount) {
      throw new BadRequestException('Refund amount cannot exceed payment amount');
    }

    // Check if payment is already refunded
    const existingRefunds = await this.refundRepository.getRefundsByPaymentId(paymentId);
    const totalRefunded = existingRefunds
      .filter((r) => r.status === 'completed')
      .reduce((sum, r) => sum + r.amount, 0);

    if (totalRefunded + refundAmount > payment.amount) {
      throw new BadRequestException('Total refund amount exceeds payment amount');
    }

    // Create refund
    const refund = await this.refundRepository.createRefund(paymentId, refundAmount);

    // Queue refund processing job for background processing
    await this.refundQueue.add(
      'process-refund',
      {
        refundId: refund.id,
        paymentId,
        amount: refundAmount,
        reason: 'Customer requested refund',
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    this.logger.log(
      `Refund created and queued for processing: ${refund.id}`,
      'RefundService',
    );
    return refund;
  }

  async getRefundById(id: string): Promise<Refund> {
    this.logger.log(`Fetching refund ${id}`, 'RefundService');
    const refund = await this.refundRepository.getRefundById(id);
    if (!refund) {
      throw new NotFoundException('Refund not found');
    }
    return refund;
  }

  async getRefundsByPaymentId(paymentId: string): Promise<Refund[]> {
    this.logger.log(`Fetching refunds for payment ${paymentId}`, 'RefundService');
    return this.refundRepository.getRefundsByPaymentId(paymentId);
  }
}

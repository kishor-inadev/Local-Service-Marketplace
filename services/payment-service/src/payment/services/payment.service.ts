import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { PaymentRepository } from '../repositories/payment.repository';
import { CouponService } from './coupon.service';
import { Payment } from '../entities/payment.entity';
import { NotFoundException, BadRequestException } from '../../common/exceptions/http.exceptions';
import { KafkaService } from '../../kafka/kafka.service';

@Injectable()
export class PaymentService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
    private readonly paymentRepository: PaymentRepository,
    private readonly couponService: CouponService,
    private readonly kafkaService: KafkaService,
  ) {}

  async createPayment(
    jobId: string,
    amount: number,
    currency: string,
    userId: string,
    couponCode?: string,
  ): Promise<Payment> {
    this.logger.log(`Creating payment for job ${jobId}`, 'PaymentService');

    let finalAmount = amount;

    // Apply coupon if provided
    if (couponCode) {
      const discount = await this.couponService.validateAndUseCoupon(couponCode, userId);
      finalAmount = amount * (1 - discount / 100);
      this.logger.log(
        `Coupon ${couponCode} applied. Original: ${amount}, Final: ${finalAmount}`,
        'PaymentService',
      );
    }

    // In production, this would integrate with a payment gateway (Stripe, PayPal, etc.)
    // For now, we simulate payment processing
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const payment = await this.paymentRepository.createPayment(
      jobId,
      finalAmount,
      currency,
      transactionId,
    );

    // Simulate payment processing - in real scenario, this would be async
    // and status would be updated via webhook
    await this.paymentRepository.updatePaymentStatus(payment.id, 'completed', transactionId);

    this.logger.log(`Payment created successfully: ${payment.id}`, 'PaymentService');
    
    // Publish event to Kafka if enabled
    await this.kafkaService.publishEvent('payment-events', {
      eventType: 'payment_completed',
      eventId: `${payment.id}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        paymentId: payment.id,
        jobId: payment.jobId,
        amount: payment.amount,
        currency: payment.currency,
        status: 'completed',
        transactionId: payment.transactionId,
      },
    });
    
    return payment;
  }

  async getPaymentById(id: string): Promise<Payment> {
    this.logger.log(`Fetching payment ${id}`, 'PaymentService');
    const payment = await this.paymentRepository.getPaymentById(id);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  async getPaymentsByJobId(jobId: string): Promise<Payment[]> {
    this.logger.log(`Fetching payments for job ${jobId}`, 'PaymentService');
    return this.paymentRepository.getPaymentsByJobId(jobId);
  }

  async updatePaymentStatus(
    id: string,
    status: 'pending' | 'completed' | 'failed' | 'refunded',
    transactionId?: string,
  ): Promise<Payment> {
    this.logger.log(`Updating payment ${id} status to ${status}`, 'PaymentService');
    const payment = await this.getPaymentById(id);
    
    if (payment.status === 'refunded' && status !== 'refunded') {
      throw new BadRequestException('Cannot change status of refunded payment');
    }

    return this.paymentRepository.updatePaymentStatus(id, status, transactionId);
  }
}

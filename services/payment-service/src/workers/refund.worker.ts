import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Inject, LoggerService, OnModuleInit, Optional } from '@nestjs/common';
import { Job } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { RefundRepository } from '../payment/repositories/refund.repository';
import { PaymentRepository } from '../payment/repositories/payment.repository';
import { DeadLetterQueueService } from '../common/dlq/dead-letter-queue.service';

export interface ProcessRefundJobData {
  refundId: string;
  paymentId: string;
  amount: number;
  reason: string;
}

@Processor('payment.refund', {
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
})
export class RefundWorker extends WorkerHost implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly refundRepository: RefundRepository,
    private readonly paymentRepository: PaymentRepository,
    @Optional() private readonly dlqService?: DeadLetterQueueService,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    // No repeatable jobs — refunds are triggered per request
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'process-refund':
        return this.handleProcessRefund(job as Job<ProcessRefundJobData>);
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }

  private async handleProcessRefund(job: Job<ProcessRefundJobData>): Promise<void> {
    const { refundId, paymentId, amount } = job.data;
    this.logger.log(`Processing refund ${refundId} for payment ${paymentId}`, 'RefundWorker');

    try {
      // Simulate gateway refund — replace with actual gateway call
      await this.refundRepository.updateRefundStatus(refundId, 'completed');
      await this.paymentRepository.updatePaymentStatus(paymentId, 'refunded', null);

      this.logger.log(`Refund ${refundId} completed successfully`, 'RefundWorker');
    } catch (error: any) {
      const err = error as Error;
      this.logger.error(`Refund ${refundId} failed: ${err.message}`, err.stack, 'RefundWorker');
      await this.refundRepository.updateRefundStatus(refundId, 'failed');

      // Capture in DLQ if max attempts reached
      if (this.dlqService && job.attemptsMade >= 3) {
        await this.dlqService.captureFailedJob('payment.refund', job, err);
      }

      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Worker lifecycle hooks
  // ─────────────────────────────────────────────────────────────────

  @OnWorkerEvent('active')
  onActive(job: Job): void {
    this.logger.log(`Job "${job.name}/${job.id}" started (attempt ${job.attemptsMade + 1})`, 'RefundWorker');
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Job "${job.name}/${job.id}" completed`, 'RefundWorker');
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    this.logger.error(
      `Job "${job?.name ?? 'unknown'}/${job?.id ?? '?'}" failed (attempt ${job?.attemptsMade ?? 0}): ${error.message}`,
      error.stack,
      'RefundWorker',
    );
  }

  @OnWorkerEvent('error')
  onError(error: Error): void {
    this.logger.error(`Worker error: ${error.message}`, error.stack, 'RefundWorker');
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string): void {
    this.logger.warn(`Job ${jobId} stalled and will be requeued`, 'RefundWorker');
  }
}

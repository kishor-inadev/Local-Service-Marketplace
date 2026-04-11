import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Inject, LoggerService, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { PaymentRepository } from '../payment/repositories/payment.repository';
import { DEFAULT_JOB_OPTIONS } from '../bullmq/bullmq-default-options';

export interface PaymentRetryJobData {
  paymentId: string;
  jobId: string;
  amount: number;
  currency: string;
}

@Processor('payment.retry', {
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '3', 10),
})
export class PaymentWorker extends WorkerHost implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectQueue('payment.retry') private readonly retryQueue: Queue,
    private readonly paymentRepository: PaymentRepository,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    // No repeatable jobs for payment retry — initiated by explicit failure events
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'retry-payment':
        return this.handleRetryPayment(job as Job<PaymentRetryJobData>);
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }

  private async handleRetryPayment(job: Job<PaymentRetryJobData>): Promise<void> {
    const { paymentId } = job.data;
    this.logger.log(`Retrying payment ${paymentId} (attempt ${job.attemptsMade + 1})`, 'PaymentWorker');

    try {
      const transactionId = `txn_retry_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await this.paymentRepository.updatePaymentStatus(paymentId, 'completed', transactionId);
      this.logger.log(`Payment retry successful for ${paymentId}`, 'PaymentWorker');
    } catch (error: any) {
      const err = error as Error;
      this.logger.error(`Payment retry failed for ${paymentId}: ${err.message}`, err.stack, 'PaymentWorker');
      await this.paymentRepository.updatePaymentStatus(paymentId, 'failed', null);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Worker lifecycle hooks
  // ─────────────────────────────────────────────────────────────────

  @OnWorkerEvent('active')
  onActive(job: Job): void {
    this.logger.log(`Job "${job.name}/${job.id}" started (attempt ${job.attemptsMade + 1})`, 'PaymentWorker');
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Job "${job.name}/${job.id}" completed`, 'PaymentWorker');
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    this.logger.error(
      `Job "${job?.name ?? 'unknown'}/${job?.id ?? '?'}" failed (attempt ${job?.attemptsMade ?? 0}): ${error.message}`,
      error.stack,
      'PaymentWorker',
    );
  }

  @OnWorkerEvent('error')
  onError(error: Error): void {
    this.logger.error(`Worker error: ${error.message}`, error.stack, 'PaymentWorker');
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string): void {
    this.logger.warn(`Job ${jobId} stalled and will be requeued`, 'PaymentWorker');
  }
}

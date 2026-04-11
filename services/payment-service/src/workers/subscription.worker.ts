import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Inject, LoggerService, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { SubscriptionRepository } from '../payment/repositories/subscription.repository';
import { NotificationClient } from '../common/notification/notification.client';
import { UserClient } from '../common/user/user.client';
import { PaymentGatewayService } from '../payment/gateway/payment-gateway.service';
import { DEFAULT_JOB_OPTIONS } from '../bullmq/bullmq-default-options';

@Processor('payment.subscription', {
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '3', 10),
})
export class SubscriptionWorker extends WorkerHost implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectQueue('payment.subscription') private readonly subscriptionQueue: Queue,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly notificationClient: NotificationClient,
    private readonly userClient: UserClient,
    private readonly paymentGateway: PaymentGatewayService,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    // Replace @Cron(EVERY_DAY_AT_10AM)
    await this.subscriptionQueue.add(
      'check-expiring-subscriptions',
      {},
      { ...DEFAULT_JOB_OPTIONS, repeat: { pattern: '0 10 * * *' } },
    );

    // Replace @Cron(EVERY_DAY_AT_2AM)
    await this.subscriptionQueue.add(
      'expire-old-subscriptions',
      {},
      { ...DEFAULT_JOB_OPTIONS, repeat: { pattern: '0 2 * * *' } },
    );

    // Replace @Cron(CronExpression.EVERY_6_HOURS)
    await this.subscriptionQueue.add(
      'renew-subscriptions',
      {},
      { ...DEFAULT_JOB_OPTIONS, repeat: { pattern: '0 */6 * * *' } },
    );

    this.logger.log('Subscription repeatable jobs registered', 'SubscriptionWorker');
  }

  async process(job: Job<any, any, string>): Promise<any> {
    try {
      switch (job.name) {
        case 'check-expiring-subscriptions':
          return this.handleCheckExpiringSubscriptions();
        case 'expire-old-subscriptions':
          return this.handleExpireOldSubscriptions();
        case 'renew-subscriptions':
          return this.handleRenewSubscriptions();
        case 'notify-subscription-expiring':
          return this.handleNotifySubscriptionExpiring(job.data);
        case 'notify-subscription-cancelled':
          return this.handleNotifySubscriptionCancelled(job.data);
        case 'notify-subscription-activated':
          return this.handleNotifySubscriptionActivated(job.data);
        default:
          throw new Error(`Unknown job name: ${job.name}`);
      }
    } catch (error: any) {
      const err = error as Error;
      this.logger.error(`Job "${job.name}/${job.id}" threw: ${err.message}`, err.stack, 'SubscriptionWorker');
      throw error;
    }
  }

  private async handleCheckExpiringSubscriptions(): Promise<void> {
    this.logger.log('Checking for expiring subscriptions', 'SubscriptionWorker');
    const expiring = await this.subscriptionRepository.getExpiringSubscriptions(7);
    this.logger.log(`Found ${expiring.length} expiring subscriptions`, 'SubscriptionWorker');

    for (const subscription of expiring) {
      const daysUntilExpiry = Math.ceil(
        (new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );

      // Resolve provider UUID to actual email address
      const email = await this.userClient.getUserEmail(subscription.provider_id).catch(() => null);
      if (!email) {
        this.logger.warn(`Cannot resolve email for provider ${subscription.provider_id} — skipping expiry notification`, 'SubscriptionWorker');
        continue;
      }

      await this.notificationClient.sendEmail({
        to: email,
        template: 'subscriptionExpiring',
        variables: {
          daysUntilExpiry: daysUntilExpiry.toString(),
          subscription_id: subscription.id,
          plan_id: subscription.plan_id,
          expires_at: subscription.expires_at,
        },
      });
    }
  }

  private async handleExpireOldSubscriptions(): Promise<void> {
    this.logger.log('Expiring old subscriptions', 'SubscriptionWorker');
    const count = await this.subscriptionRepository.expireOldSubscriptions();
    this.logger.log(`Expired ${count} subscriptions`, 'SubscriptionWorker');
  }

  private async handleRenewSubscriptions(): Promise<void> {
    this.logger.log('Processing subscription renewals', 'SubscriptionWorker');

    // Get subscriptions expiring in the next 24 hours
    const renewals = await this.subscriptionRepository.getSubscriptionsForRenewal(24);
    this.logger.log(`Found ${renewals.length} subscriptions due for renewal`, 'SubscriptionWorker');

    for (const subscription of renewals) {
      try {
        const amount = Number(subscription.price);
        if (!amount || amount <= 0) {
          this.logger.warn(`Subscription ${subscription.id} has invalid plan price — skipping`, 'SubscriptionWorker');
          continue;
        }

        // Charge via default gateway
        const chargeResult = await this.paymentGateway.charge({
          amount,
          currency: 'INR',
          description: `Subscription renewal for plan ${subscription.plan_id}`,
          metadata: { subscription_id: subscription.id, provider_id: subscription.provider_id },
        });

        if (chargeResult.status !== 'succeeded') {
          this.logger.warn(`Renewal charge did not succeed for subscription ${subscription.id} (status: ${chargeResult.status})`, 'SubscriptionWorker');
          continue;
        }

        // Compute new expires_at based on billing period
        const newExpiresAt = new Date(subscription.expires_at);
        const period = (subscription.billing_period || 'monthly').toLowerCase();
        if (period === 'yearly') {
          newExpiresAt.setFullYear(newExpiresAt.getFullYear() + 1);
        } else if (period === 'quarterly') {
          newExpiresAt.setMonth(newExpiresAt.getMonth() + 3);
        } else {
          // Default: monthly
          newExpiresAt.setMonth(newExpiresAt.getMonth() + 1);
        }

        await this.subscriptionRepository.renewSubscription(subscription.id, newExpiresAt);
        this.logger.log(`Renewed subscription ${subscription.id} until ${newExpiresAt.toISOString()}`, 'SubscriptionWorker');

        // Notify provider of successful renewal
        const email = await this.userClient.getUserEmail(subscription.provider_id).catch(() => null);
        if (email) {
          await this.notificationClient.sendEmail({
            to: email,
            template: 'subscriptionRenewed',
            variables: { subscription_id: subscription.id, expires_at: newExpiresAt.toISOString() },
          }).catch(() => {/* non-critical: log already done by notificationClient */});
        }
      } catch (error: any) {
        this.logger.error(`Failed to renew subscription ${subscription.id}: ${error.message}`, error.stack, 'SubscriptionWorker');
        // Individual failure should not abort the entire batch — continue to next subscription
      }
    }
  }

  private async handleNotifySubscriptionExpiring(data: any): Promise<void> {
    const { providerId, subscriptionId, daysLeft } = data;
    const email = await this.userClient.getUserEmail(providerId).catch(() => null);
    if (!email) {
      this.logger.warn(`Cannot resolve email for provider ${providerId} — skipping expiry notification`, 'SubscriptionWorker');
      return;
    }
    await this.notificationClient.sendEmail({
      to: email,
      template: 'subscriptionExpiring',
      variables: { daysUntilExpiry: String(daysLeft), subscription_id: subscriptionId },
    });
  }

  private async handleNotifySubscriptionCancelled(data: any): Promise<void> {
    const { providerId, subscriptionId } = data;
    const email = await this.userClient.getUserEmail(providerId).catch(() => null);
    if (!email) {
      this.logger.warn(`Cannot resolve email for provider ${providerId} — skipping cancellation notification`, 'SubscriptionWorker');
      return;
    }
    await this.notificationClient.sendEmail({
      to: email,
      template: 'subscriptionCancelled',
      variables: { subscription_id: subscriptionId },
    });
  }

  private async handleNotifySubscriptionActivated(data: any): Promise<void> {
    const { providerId, subscriptionId } = data;
    const email = await this.userClient.getUserEmail(providerId).catch(() => null);
    if (!email) {
      this.logger.warn(`Cannot resolve email for provider ${providerId} — skipping activation notification`, 'SubscriptionWorker');
      return;
    }
    await this.notificationClient.sendEmail({
      to: email,
      template: 'subscriptionActivated',
      variables: { subscription_id: subscriptionId },
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // Worker lifecycle hooks
  // ─────────────────────────────────────────────────────────────────

  @OnWorkerEvent('active')
  onActive(job: Job): void {
    this.logger.log(`Job "${job.name}/${job.id}" started (attempt ${job.attemptsMade + 1})`, 'SubscriptionWorker');
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Job "${job.name}/${job.id}" completed`, 'SubscriptionWorker');
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    this.logger.error(
      `Job "${job?.name ?? 'unknown'}/${job?.id ?? '?'}" failed (attempt ${job?.attemptsMade ?? 0}): ${error.message}`,
      error.stack,
      'SubscriptionWorker',
    );
  }

  @OnWorkerEvent('error')
  onError(error: Error): void {
    this.logger.error(`Worker error: ${error.message}`, error.stack, 'SubscriptionWorker');
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string): void {
    this.logger.warn(`Job ${jobId} stalled and will be requeued`, 'SubscriptionWorker');
  }
}

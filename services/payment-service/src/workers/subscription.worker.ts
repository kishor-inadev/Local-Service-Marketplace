import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, LoggerService, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { SubscriptionRepository } from '../payment/repositories/subscription.repository';
import { NotificationClient } from '../common/notification/notification.client';
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
  }

  private async handleCheckExpiringSubscriptions(): Promise<void> {
    this.logger.log('Checking for expiring subscriptions', 'SubscriptionWorker');
    const expiring = await this.subscriptionRepository.getExpiringSubscriptions(7);
    this.logger.log(`Found ${expiring.length} expiring subscriptions`, 'SubscriptionWorker');

    for (const subscription of expiring) {
      const daysUntilExpiry = Math.ceil(
        (new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      await this.notificationClient.sendEmail({
        to: subscription.provider_id,
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
    // Auto-renewal logic — queried by near-expiry date and active status
    // Implementations should charge gateway and update status
  }

  private async handleNotifySubscriptionExpiring(data: any): Promise<void> {
    const { providerId, subscriptionId, daysLeft } = data;
    await this.notificationClient.sendEmail({
      to: providerId,
      template: 'subscriptionExpiring',
      variables: { daysUntilExpiry: String(daysLeft), subscription_id: subscriptionId },
    });
  }

  private async handleNotifySubscriptionCancelled(data: any): Promise<void> {
    const { providerId, subscriptionId } = data;
    await this.notificationClient.sendEmail({
      to: providerId,
      template: 'subscriptionCancelled',
      variables: { subscription_id: subscriptionId },
    });
  }

  private async handleNotifySubscriptionActivated(data: any): Promise<void> {
    const { providerId, subscriptionId } = data;
    await this.notificationClient.sendEmail({
      to: providerId,
      template: 'subscriptionActivated',
      variables: { subscription_id: subscriptionId },
    });
  }
}

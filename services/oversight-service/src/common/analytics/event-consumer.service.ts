import { Injectable, Inject, LoggerService, OnModuleInit } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { KafkaService } from '../../kafka/kafka.service';
import { UserActivityRepository } from '../../analytics/repositories/user-activity.repository';

@Injectable()
export class EventConsumerService implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
    private readonly kafkaService: KafkaService,
    private readonly userActivityRepository: UserActivityRepository,
  ) { }

  async onModuleInit() {
    if (this.kafkaService.isKafkaEnabled()) {
      this.logger.log('Starting Kafka event consumer for analytics', 'EventConsumerService');
      await this.kafkaService.startConsuming(this.handleEvent.bind(this));
    }
  }

  private async handleEvent(event: any): Promise<void> {
    this.logger.log(`Processing analytics event: ${event.eventType}`, 'EventConsumerService');

    try {
      // Log all events as user activity
      await this.logUserActivity(event);

      // Process specific metrics
      switch (event.eventType) {
        case 'request_created':
          await this.trackRequestMetrics(event);
          break;
        case 'proposal_submitted':
        case 'proposal_accepted':
        case 'proposal_rejected':
          await this.trackProposalMetrics(event);
          break;
        case 'job_created':
        case 'job_started':
        case 'job_completed':
          await this.trackJobMetrics(event);
          break;
        case 'payment_completed':
          await this.trackPaymentMetrics(event);
          break;
      }
    } catch (error: any) {
      this.logger.error(
        `Error processing analytics event ${event.eventType}: ${error.message}`,
        error.stack,
        'EventConsumerService',
      );
    }
  }

  private async logUserActivity(event: any): Promise<void> {
    // Extract user ID from event data
    const userId = event.data.userId || event.data.providerId;

    if (userId) {
      await this.userActivityRepository.trackActivity({
        user_id: userId,
        action: event.eventType,
        metadata: event.data,
      });
    }
  }

  private async trackRequestMetrics(event: any): Promise<void> {
    this.logger.log(`Tracking request metrics for: ${event.data.requestId}`, 'EventConsumerService');
    // Additional request-specific metrics tracking
  }

  private async trackProposalMetrics(event: any): Promise<void> {
    this.logger.log(`Tracking proposal metrics for: ${event.data.proposalId}`, 'EventConsumerService');
    // Additional proposal-specific metrics tracking
  }

  private async trackJobMetrics(event: any): Promise<void> {
    this.logger.log(`Tracking job metrics for: ${event.data.jobId}`, 'EventConsumerService');
    // Additional job-specific metrics tracking
  }

  private async trackPaymentMetrics(event: any): Promise<void> {
    this.logger.log(`Tracking payment metrics: ${event.data.amount} ${event.data.currency}`, 'EventConsumerService');
    // Additional payment-specific metrics tracking
  }
}

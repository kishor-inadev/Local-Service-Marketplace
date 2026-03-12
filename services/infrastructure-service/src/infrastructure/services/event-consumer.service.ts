import { Injectable, Inject, LoggerService, OnModuleInit } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { KafkaService } from '../../kafka/kafka.service';
import { EventService } from './event.service';

@Injectable()
export class EventConsumerService implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
    private readonly kafkaService: KafkaService,
    private readonly eventService: EventService,
  ) {}

  async onModuleInit() {
    if (this.kafkaService.isKafkaEnabled()) {
      this.logger.log('Starting Kafka event consumer for event storage', 'EventConsumerService');
      await this.kafkaService.startConsuming(this.handleEvent.bind(this));
    }
  }

  private async handleEvent(event: any): Promise<void> {
    this.logger.log(`Storing event: ${event.eventType}`, 'EventConsumerService');

    try {
      // Store all events in the events table
      await this.eventService.createEvent({
        eventType: event.eventType,
        payload: event.data,
      });

      this.logger.log(`Event stored successfully: ${event.eventType}`, 'EventConsumerService');
    } catch (error) {
      this.logger.error(
        `Error storing event ${event.eventType}: ${error.message}`,
        error.stack,
        'EventConsumerService',
      );
    }
  }
}

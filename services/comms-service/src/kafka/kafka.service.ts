import { Injectable, Inject, LoggerService, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Kafka, Consumer, Producer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private isEnabled: boolean;
  private isConnected: boolean = false;

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {
    this.isEnabled = process.env.EVENT_BUS_ENABLED === 'true';
    
    if (this.isEnabled) {
      const brokers = process.env.KAFKA_BROKERS?.split(',') || ['kafka:29092'];
      const clientId = process.env.KAFKA_CLIENT_ID || 'notification-service';

      this.kafka = new Kafka({
        clientId,
        brokers,
        retry: {
          retries: 5,
          initialRetryTime: 300,
        },
      });

      this.producer = this.kafka.producer();
      this.consumer = this.kafka.consumer({ groupId: 'notification-service-group' });
    }
  }

  async onModuleInit() {
    if (this.isEnabled) {
      try {
        await this.producer.connect();
        await this.consumer.connect();
        
        // Subscribe to all event topics
        await this.consumer.subscribe({ topics: ['request-events', 'proposal-events', 'job-events', 'payment-events'], fromBeginning: false });
        
        this.isConnected = true;
        this.logger.log('Kafka producer and consumer connected successfully', 'KafkaService');
      } catch (error) {
        this.logger.error(
          `Failed to connect to Kafka: ${error.message}. Events will not be published/consumed.`,
          error.stack,
          'KafkaService',
        );
        this.isEnabled = false;
      }
    } else {
      this.logger.log('Kafka event bus is disabled', 'KafkaService');
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.consumer.disconnect();
      await this.producer.disconnect();
      this.logger.log('Kafka producer and consumer disconnected', 'KafkaService');
    }
  }

  async publishEvent(topic: string, event: any): Promise<void> {
    if (!this.isEnabled || !this.isConnected) {
      this.logger.debug(
        `Kafka disabled - event not published: ${topic}`,
        'KafkaService',
      );
      return;
    }

    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: event.id || event.eventId,
            value: JSON.stringify(event),
            timestamp: Date.now().toString(),
          },
        ],
      });

      this.logger.log(
        `Event published to topic ${topic}: ${event.eventType || topic}`,
        'KafkaService',
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish event to ${topic}: ${error.message}`,
        error.stack,
        'KafkaService',
      );
    }
  }

  async startConsuming(callback: (event: any) => Promise<void>): Promise<void> {
    if (!this.isEnabled || !this.isConnected) {
      this.logger.log('Kafka consumer not started - event bus disabled', 'KafkaService');
      return;
    }

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          this.logger.log(
            `Received event from ${topic}: ${event.eventType}`,
            'KafkaService',
          );
          await callback(event);
        } catch (error) {
          this.logger.error(
            `Failed to process event: ${error.message}`,
            error.stack,
            'KafkaService',
          );
        }
      },
    });
  }

  isKafkaEnabled(): boolean {
    return this.isEnabled && this.isConnected;
  }
}

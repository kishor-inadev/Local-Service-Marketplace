import {
  Injectable,
  Inject,
  LoggerService,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { Kafka, Producer } from "kafkajs";

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private isEnabled: boolean;
  private isConnected: boolean = false;

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    // Check if Kafka is enabled via environment variable
    this.isEnabled = process.env.EVENT_BUS_ENABLED === "true";

    if (this.isEnabled) {
      const brokers = process.env.KAFKA_BROKERS?.split(",") || ["kafka:29092"];
      const clientId = process.env.KAFKA_CLIENT_ID || "marketplace-service";

      this.kafka = new Kafka({
        clientId,
        brokers,
        retry: {
          retries: 5,
          initialRetryTime: 300,
        },
      });

      this.producer = this.kafka.producer();
    }
  }

  async onModuleInit() {
    if (this.isEnabled) {
      try {
        await this.producer.connect();
        this.isConnected = true;
        this.logger.log(
          "Kafka producer connected successfully",
          "KafkaService",
        );
      } catch (error) {
        this.logger.error(
          `Failed to connect to Kafka: ${error.message}. Events will not be published.`,
          error.stack,
          "KafkaService",
        );
        this.isEnabled = false; // Disable if connection fails
      }
    } else {
      this.logger.log("Kafka event bus is disabled", "KafkaService");
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.producer.disconnect();
      this.logger.log("Kafka producer disconnected", "KafkaService");
    }
  }

  async publishEvent(topic: string, event: any): Promise<void> {
    if (!this.isEnabled || !this.isConnected) {
      this.logger.debug(
        `Kafka disabled - event not published: ${topic}`,
        "KafkaService",
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
        "KafkaService",
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish event to ${topic}: ${error.message}`,
        error.stack,
        "KafkaService",
      );
    }
  }

  isKafkaEnabled(): boolean {
    return this.isEnabled && this.isConnected;
  }
}

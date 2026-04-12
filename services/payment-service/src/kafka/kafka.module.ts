import { Module, Global, DynamicModule } from "@nestjs/common";
import { KafkaService } from "./kafka.service";

/**
 * Kafka event-bus module — follows the same conditional-loading pattern as BullMQ.
 *
 * BullMQCoreModule  → always loaded (queue infrastructure for producers)
 * WorkersModule     → conditional on WORKERS_ENABLED
 *
 * KafkaModule.register() → always loaded
 *   EVENT_BUS_ENABLED=true  → real KafkaService (connects to brokers)
 *   EVENT_BUS_ENABLED!=true → no-op KafkaService (zero Kafka overhead)
 */
@Global()
@Module({})
export class KafkaModule {
  static register(): DynamicModule {
    const isEnabled = process.env.EVENT_BUS_ENABLED === 'true';

    return {
      module: KafkaModule,
      global: true,
      providers: isEnabled
        ? [KafkaService]
        : [
            {
              provide: KafkaService,
              useValue: {
                publishEvent: async () => {},
                startConsuming: async () => {},
                emit: async () => {},
                isKafkaEnabled: () => false,
              },
            },
          ],
      exports: [KafkaService],
    };
  }
}

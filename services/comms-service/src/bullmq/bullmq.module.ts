import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

/**
 * Registers the BullMQ Redis connection once for the entire comms-service.
 * All queue registrations and workers share this connection.
 *
 * Always imported — producers work regardless of WORKERS_ENABLED.
 */
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'redis',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),
  ],
  exports: [BullModule],
})
export class BullMQCoreModule {}

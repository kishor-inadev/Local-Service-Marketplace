import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from '../common/database/database.module';
import { RedisModule } from '../redis/redis.module';

// Controllers
import { EventController } from './controllers/event.controller';
import { BackgroundJobController } from './controllers/background-job.controller';
import { RateLimitController } from './controllers/rate-limit.controller';
import { FeatureFlagController } from './controllers/feature-flag.controller';

// Services
import { EventService } from './services/event.service';
import { BackgroundJobService } from './services/background-job.service';
import { RateLimitService } from './services/rate-limit.service';
import { FeatureFlagService } from './services/feature-flag.service';
import { EventConsumerService } from './services/event-consumer.service';

// Repositories
import { EventRepository } from './repositories/event.repository';
import { BackgroundJobRepository } from './repositories/background-job.repository';
import { RateLimitRepository } from './repositories/rate-limit.repository';
import { FeatureFlagRepository } from './repositories/feature-flag.repository';

// Guards
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard as RolesGuard } from '@/common/rbac';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'infra.background-jobs' }),
    DatabaseModule,
    RedisModule,
  ],
  controllers: [
    EventController,
    BackgroundJobController,
    RateLimitController,
    FeatureFlagController,
  ],
  providers: [
    // Guards
    JwtAuthGuard,
    RolesGuard,
    // Services
    EventService,
    BackgroundJobService,
    RateLimitService,
    FeatureFlagService,
    EventConsumerService,
    // Repositories
    EventRepository,
    BackgroundJobRepository,
    RateLimitRepository,
    FeatureFlagRepository,
  ],
  exports: [
    EventService,
    BackgroundJobService,
    RateLimitService,
    FeatureFlagService,
  ],
})
export class InfrastructureModule {}

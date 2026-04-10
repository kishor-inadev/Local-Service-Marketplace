# Background Job Processing — BullMQ Guide

## Overview

The platform uses **BullMQ** (Redis-based queue) for asynchronous task execution across all 6 backend services. This decouples heavy operations from HTTP request/response cycles, improving API response times and reliability.

> **Migration note**: The platform was previously using the legacy `bull` / `@nestjs/bull` package. All services have been migrated to `bullmq` / `@nestjs/bullmq`.

## Architecture

```
HTTP Request → Service → Enqueue Job → Return Response (fast!)
                              ↓
                    BullMQ Worker (separate process or same container)
                              ↓
                    Processes job with retries + backoff
                              ↓
                    Updates Database / calls downstream services
```

Workers run **in the same container** as the API service but are conditionally activated via the `WORKERS_ENABLED` environment variable.  In production you can split a service into two container types: an **API pod** (no workers) and a **worker pod** (workers only, no HTTP traffic).

---

## Enabling Workers

### Environment Variable

| Variable | Default | Description |
|---|---|---|
| `WORKERS_ENABLED` | `false` | Set to `true` to activate all BullMQ worker processors |
| `WORKER_CONCURRENCY` | `5` | Jobs processed simultaneously per worker processor |
| `REDIS_HOST` | `redis` | Redis host (Docker: `redis`, local: `localhost`) |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_PASSWORD` | _(empty)_ | Redis password (optional) |

### Local Development

```env
# In any service's .env file
WORKERS_ENABLED=true
WORKER_CONCURRENCY=3
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Docker Compose (single container, workers enabled)

```env
# In root .env or docker.env
WORKERS_ENABLED=true
WORKER_CONCURRENCY=5
```

All services in `docker-compose.yml` pass `WORKERS_ENABLED=${WORKERS_ENABLED:-false}` to their containers.

### Production Split — API pod vs Worker pod

Run two containers from the **same image**:

```yaml
# docker-compose.prod.yml (excerpt)

# API pod — handles HTTP, no workers
identity-service-api:
  image: lsmp-identity-service:latest
  environment:
    - WORKERS_ENABLED=false
  deploy:
    replicas: 3

# Worker pod — no HTTP traffic, runs workers only
identity-service-worker:
  image: lsmp-identity-service:latest
  environment:
    - WORKERS_ENABLED=true
    - WORKER_CONCURRENCY=10
  deploy:
    replicas: 2
```

This pattern is already implemented in `docker-compose.prod.yml`.

---

## Services and Their Queues

### comms-service (port 3007)

| Queue | Job name(s) | Trigger |
|---|---|---|
| `comms.email` | `deliver-email` | Notification send |
| `comms.email` | `retry-email-worker` _(repeatable, */15 min)_ | Auto-retry stuck deliveries |
| `comms.sms` | `deliver-sms`, `deliver-otp` | SMS/OTP send |
| `comms.push` | `deliver-push` | Push notification send |
| `comms.push` | `retry-push-worker` _(repeatable, */15 min)_ | Auto-retry stuck push |
| `comms.digest` | `send-digest` _(repeatable, 8AM daily)_ | Daily unread digest email |
| `comms.cleanup` | `cleanup-old-notifications` _(repeatable, Sun 3AM)_ | Purge 90d+ notifications |
| `comms.cleanup` | `cleanup-old-deliveries` _(repeatable, Sun 4AM)_ | Purge 90d+ deliveries |

### payment-service (port 3006)

| Queue | Job name(s) | Trigger |
|---|---|---|
| `payment.retry` | `retry-payment` | Failed payment |
| `payment.refund` | `process-refund` | Refund creation |
| `payment.webhook` | `process-webhook` | Incoming webhook |
| `payment.notification` | `notify-payment-*` | Payment lifecycle events |
| `payment.subscription` | `check-expiring-subscriptions` _(repeatable, 10AM)_ | Subscription expiry |
| `payment.subscription` | `process-expired-subscriptions` _(repeatable, 2AM)_ | Deactivate expired |
| `payment.subscription` | `retry-failed-subscription-payments` _(repeatable, every 6h)_ | Retry failed billing |
| `payment.method-expiry` | `check-expiring-payment-methods` _(repeatable, 11AM)_ | Card expiry warnings |
| `payment.cleanup` | `cleanup-old-webhooks` _(repeatable, Sun 2AM)_ | Purge old webhooks |
| `payment.cleanup` | `cleanup-expired-coupons` _(repeatable, Sun 3AM)_ | Remove expired coupons |

### marketplace-service (port 3003)

| Queue | Job name(s) | Trigger |
|---|---|---|
| `marketplace.notification` | `notify-request-created`, `notify-proposal-*`, `notify-job-*`, `notify-review-created` | CRUD operations |
| `marketplace.analytics` | `track-event` | Job/request analytics |
| `marketplace.rating` | `recalculate-provider-rating` | Review submission |
| `marketplace.rating` | `refresh-all-provider-ratings` _(repeatable, 3AM)_ | Full nightly refresh |
| `marketplace.rating` | `refresh-recent-provider-ratings` _(repeatable, every 4h)_ | Quick partial refresh |
| `marketplace.cleanup` | `expire-stale-requests` _(repeatable, 2AM)_ | Auto-expire old requests |

### identity-service (port 3001)

| Queue | Job name(s) | Trigger |
|---|---|---|
| `identity.notification` | `send-welcome-email`, `send-email-verification`, `send-password-reset`, `send-account-deactivated`, etc. | Auth events (register, reset password, deactivate) |
| `identity.cleanup` | `expire-verification-tokens` _(repeatable, 1AM)_ | Purge expired tokens |
| `identity.cleanup` | `purge-expired-sessions` _(repeatable, 2AM)_ | Remove old sessions |
| `identity.cleanup` | `purge-old-login-attempts` _(repeatable, 3AM Sun)_ | Purge old login logs |
| `identity.document-expiry` | `check-expiring-documents` _(repeatable, 9AM)_ | Document expiry warnings |
| `identity.document-expiry` | `expire-documents` _(repeatable, 1AM)_ | Mark expired documents |

### oversight-service (port 3010)

| Queue | Job name(s) | Trigger |
|---|---|---|
| `oversight.audit` | `write-audit-log` | Admin/sensitive actions |
| `oversight.cleanup` | `purge-old-audit-logs` _(repeatable, Sun 1AM)_ | Remove 1yr+ audit logs |
| `oversight.cleanup` | `purge-old-activity-logs` _(repeatable, Sun 2AM)_ | Remove 90d+ activity logs |
| `oversight.cleanup` | `aggregate-daily-metrics` _(repeatable, 4AM)_ | Compute yesterday metrics |

### infrastructure-service (port 3012)

| Queue | Job name(s) | Trigger |
|---|---|---|
| `infra.background-jobs` | `execute-background-job` | Registered background jobs |
| `infra.cleanup` | `purge-old-events` _(repeatable, Sun 2AM)_ | Remove 90d+ events |
| `infra.cleanup` | `purge-old-background-jobs` _(repeatable, Sun 3AM)_ | Remove completed jobs |

---

## Code Patterns

### BullMQ Core Module (always imported)

Every service has `src/bullmq/bullmq.module.ts`:

```typescript
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
```

### Default Job Options

Every service has `src/bullmq/bullmq-default-options.ts`:

```typescript
import { JobsOptions } from 'bullmq';

export const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5_000 },   // 5s → 10s → 20s
  removeOnComplete: { count: 100, age: 86_400 },     // keep 24h or last 100
  removeOnFail:     { count: 500, age: 604_800 },    // keep 7d  or last 500
};
```

### Producer — Enqueuing a Job

```typescript
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DEFAULT_JOB_OPTIONS } from '../../bullmq/bullmq-default-options';

@Injectable()
export class ReviewService {
  constructor(
    @InjectQueue('marketplace.notification') private readonly notificationQueue: Queue,
    @InjectQueue('marketplace.rating')       private readonly ratingQueue: Queue,
  ) {}

  async createReview(dto: CreateReviewDto, userId: string) {
    const review = await this.reviewRepo.create({ ...dto, userId });

    // Non-blocking — returns immediately, worker handles async
    await this.notificationQueue.add('notify-review-created', {
      reviewId: review.id,
      providerId: dto.providerId,
      rating: dto.rating,
    }, DEFAULT_JOB_OPTIONS);

    await this.ratingQueue.add('recalculate-provider-rating', {
      providerId: dto.providerId,
    }, DEFAULT_JOB_OPTIONS);

    return review;
  }
}
```

### Worker — Processing Jobs

```typescript
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { DEFAULT_JOB_OPTIONS } from '../bullmq/bullmq-default-options';

@Processor('marketplace.rating', {
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '3', 10),
})
export class ProviderRatingWorker extends WorkerHost implements OnModuleInit {
  constructor(
    @InjectQueue('marketplace.rating') private readonly ratingQueue: Queue,
    private readonly reviewAggregateRepo: ProviderReviewAggregateRepository,
  ) {
    super();
  }

  // Register repeatable jobs on startup
  async onModuleInit(): Promise<void> {
    await this.ratingQueue.add(
      'refresh-all-provider-ratings',
      {},
      { ...DEFAULT_JOB_OPTIONS, repeat: { pattern: '0 3 * * *' } },  // 3AM daily
    );
  }

  // Route all jobs through process()
  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'recalculate-provider-rating':
        return this.recalculateOne(job.data.providerId);
      case 'refresh-all-provider-ratings':
        return this.refreshAll();
      default:
        throw new Error(`Unknown job: ${job.name}`);
    }
  }

  private async recalculateOne(providerId: string): Promise<void> {
    await this.reviewAggregateRepo.refreshByProvider(providerId);
  }

  private async refreshAll(): Promise<void> {
    await this.reviewAggregateRepo.refreshAllAggregates();
  }
}
```

### WorkersModule — Conditional Loading

Every service has `src/workers/workers.module.ts`:

```typescript
@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'marketplace.notification' },
      { name: 'marketplace.rating' },
      { name: 'marketplace.analytics' },
      { name: 'marketplace.cleanup' },
    ),
    // Feature modules needed by workers
    ReviewModule,
    RequestModule,
  ],
  providers: [
    NotificationWorker,
    ProviderRatingWorker,
    AnalyticsWorker,
    CleanupWorker,
  ],
})
export class WorkersModule {}
```

### Conditional Import in app.module.ts

```typescript
// Conditionally load workers — workers run in the same process
// but only when WORKERS_ENABLED=true
const conditionalModules = process.env.WORKERS_ENABLED === 'true'
  ? [WorkersModule]
  : [];

@Module({
  imports: [
    BullMQCoreModule,             // Always — so producers work in API pods too
    ...conditionalModules,        // Only when WORKERS_ENABLED=true
    // ... other modules
  ],
})
export class AppModule {}
```

---

## Repeatable Jobs (Cron Replacement)

Repeatable jobs are registered in `onModuleInit()` of each worker. They replace `@nestjs/schedule` `@Cron()` decorators.

```typescript
// Pattern examples
'0 3 * * *'    // 3:00 AM every day
'0 */4 * * *'  // Every 4 hours
'0 1 * * 0'    // 1:00 AM every Sunday
'*/15 * * * *' // Every 15 minutes
```

BullMQ deduplicates repeatable jobs by `jobId`. Re-registering on startup is safe — it will not create duplicates.

---

## Job Cleanup Strategy

All services use the built-in BullMQ auto-cleanup via `removeOnComplete`/`removeOnFail`. Additionally each service has a `CleanupWorker` (in the `*.cleanup` queue) that purges database records for completed items:

| Service | Cleanup target | Retention |
|---|---|---|
| comms-service | notifications, deliveries | 90 days |
| payment-service | processed webhooks, expired coupons | 30 days |
| oversight-service | audit logs | 1 year |
| oversight-service | activity logs | 90 days |
| infrastructure-service | events | 90 days |

---

## Monitoring

### Check Queue Depth (Bull Board — optional)

Install BullMQ Board for a web UI:

```bash
npm install @bull-board/api @bull-board/express
```

```typescript
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';   // Note: BullMQAdapter, not BullAdapter
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bullmq';

const serverAdapter = new ExpressAdapter();
createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue),
    new BullMQAdapter(paymentQueue),
  ],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());
```

### Programmatic Queue Inspection

```typescript
const waiting   = await queue.getWaitingCount();
const active    = await queue.getActiveCount();
const completed = await queue.getCompletedCount();
const failed    = await queue.getFailedCount();
const delayed   = await queue.getDelayedCount();

// Inspect failed jobs
const failedJobs = await queue.getFailed(0, 20);
failedJobs.forEach(job => {
  console.log(job.id, job.failedReason, job.attemptsMade);
});

// Manually retry a failed job
await failedJob.retry();
```

---

## Troubleshooting

### Workers not starting

```bash
# Confirm WORKERS_ENABLED is set
docker-compose exec identity-service printenv WORKERS_ENABLED
# Should print: true

# Check logs for worker registration messages
docker-compose logs identity-service | grep -i "worker"
```

### Jobs stuck in queue (not processed)

```bash
# Verify Redis is reachable from the service container
docker-compose exec marketplace-service nc -zv redis 6379

# Check Redis key count (BullMQ stores jobs as sorted sets)
docker exec -it marketplace-redis redis-cli KEYS "bull:marketplace.*"
```

### Jobs failing repeatedly

```bash
# Tail service logs for error details
docker-compose logs -f payment-service | grep -i "failed\|error"
```

Then check `failedReason` programmatically (see Monitoring section above) or via Bull Board UI.

### Repeatable jobs not firing

Repeatable jobs require `WORKERS_ENABLED=true`. They are registered in `onModuleInit()` — check that the worker pod started cleanly:

```bash
docker-compose logs payment-service | grep "repeatable"
```

---

## Summary

| | Before (Bull) | After (BullMQ) |
|---|---|---|
| Package | `@nestjs/bull` + `bull` | `@nestjs/bullmq` + `bullmq` |
| Worker pattern | `@Process()` decorator | `WorkerHost.process()` |
| Repeatable jobs | `@nestjs/schedule @Cron()` | `queue.add(..., repeat: { pattern })` in `onModuleInit` |
| Worker activation | Always on | Conditional via `WORKERS_ENABLED=true` |
| Services covered | 2 (comms, payment) | **All 6** |
| Total queues | 3 | **22** |
| Auto job cleanup | Manual | Built-in `removeOnComplete` + `CleanupWorker` |

**Production checklist**:
- [ ] Redis is running and reachable (`REDIS_HOST`, `REDIS_PORT` set)
- [ ] `WORKERS_ENABLED=true` on worker pods, `false` on API pods
- [ ] `WORKER_CONCURRENCY` tuned for your Redis/CPU capacity
- [ ] Redis persistence (AOF or RDB) enabled to survive restarts
- [ ] Alerts on queue depth and failed job count

**Last Updated**: March 2026

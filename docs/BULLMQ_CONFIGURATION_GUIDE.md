# BullMQ Configuration Guide

**Last Updated:** April 11, 2026  
**Implemented:** High Priority Gaps 2.4.1 (Job Timeouts), 2.4.2 (Queue Priorities), 2.4.3 (Rate Limiting), 2.4.4 (Stalled Job Recovery)

---

## Overview

The platform uses a **centralized BullMQ configuration** that defines timeouts, priorities, retry strategies, rate limits, stalled job recovery, and cleanup policies for all queues.

**Benefits:**
- ✅ Automatic job timeout protection (prevents stuck workers)
- ✅ Priority-based job processing (critical jobs first)
- ✅ Queue rate limiting (prevents flooding, ensures fair resource allocation)
- ✅ Automatic stalled job recovery (no manual intervention needed)
- ✅ Consistent retry strategies across services
- ✅ Automatic cleanup of completed/failed jobs
- ✅ DLQ (Dead Letter Queue) protection for critical operations

**Configuration Location:** [`config/queue-config.ts`](../config/queue-config.ts)

---

## Job Priorities

Jobs are processed in **priority order** (1 = highest, 4 = lowest):

| Priority | Use Cases | Example Jobs |
|----------|-----------|--------------|
| **CRITICAL (1)** | Auth, payments, security | Password reset, payment processing, refunds |
| **HIGH (2)** | Customer notifications | Order confirmations, job updates, SMS OTPs |
| **NORMAL (3)** | Standard operations | Analytics, audit logs, provider notifications |
| **LOW (4)** | Maintenance tasks | Cleanup jobs, digest emails, expired document checks |

### Priority Processing Behavior

- **Same priority:** FIFO (first in, first out)
- **Mixed priorities:** Lower numbers processed first
- **Stalled jobs:** Automatically retried after timeout expires

---

## Queue Timeouts by Service

### Comms Service

| Queue | Timeout | Priority | Attempts | Use Case |
|-------|---------|----------|----------|----------|
| `comms.email` | 10s | HIGH | 3 | Email delivery via external SMTP |
| `comms.sms` | 15s | HIGH | 3 | SMS delivery (carrier delays) |
| `comms.push` | 5s | HIGH | 3 | Push notifications (FCM/APNs) |
| `comms.digest` | 60s | LOW | 2 | Batch email digests |
| `comms.cleanup` | 120s | LOW | 2 | Delete old notifications |

### Payment Service

| Queue | Timeout | Priority | Attempts | Use Case |
|-------|---------|----------|----------|----------|
| `payment.retry` | 30s | CRITICAL | 5 | Retry failed payments |
| `payment.refund` | 30s | CRITICAL | 3 | Process refunds |
| `payment.webhook` | 20s | HIGH | 5 | Deliver webhooks to external endpoints |
| `payment.notification` | 10s | HIGH | 3 | Notify users of payment status |
| `payment.analytics` | 60s | NORMAL | 2 | Track payment metrics |
| `payment.subscription` | 30s | HIGH | 3 | Subscription billing |
| `payment.method-expiry` | 60s | LOW | 2 | Check for expired payment methods |
| `payment.cleanup` | 120s | LOW | 2 | Cleanup old payment records |

### Marketplace Service

| Queue | Timeout | Priority | Attempts | Use Case |
|-------|---------|----------|----------|----------|
| `marketplace.notification` | 10s | NORMAL | 3 | Job/request notifications |
| `marketplace.analytics` | 60s | NORMAL | 2 | Track marketplace metrics |
| `marketplace.rating` | 60s | NORMAL | 2 | Update provider ratings |
| `marketplace.cleanup` | 120s | LOW | 2 | Cleanup old requests |

### Identity Service

| Queue | Timeout | Priority | Attempts | Use Case |
|-------|---------|----------|----------|----------|
| `identity.notification` | 10s | CRITICAL | 3 | Auth emails (verification, password reset) |
| `identity.cleanup` | 120s | LOW | 2 | Cleanup expired tokens |
| `identity.document` | 60s | NORMAL | 2 | Check document expiry |

### Oversight Service

| Queue | Timeout | Priority | Attempts | Use Case |
|-------|---------|----------|----------|----------|
| `oversight.audit` | 30s | NORMAL | 2 | Write audit logs |
| `oversight.cleanup` | 120s | LOW | 2 | Cleanup old audit logs |

### Infrastructure Service

| Queue | Timeout | Priority | Attempts | Use Case |
|-------|---------|----------|----------|----------|
| `infra.background-jobs` | 60s | NORMAL | 2 | Generic background tasks |
| `infra.cleanup` | 120s | LOW | 2 | Cleanup old events |
| `infra.dlq` | 30s | LOW | 1 | Process dead letter queue |

---

## Using Queue Configuration

### 1. Default Configuration (Recommended)

When enqueuing jobs, **default options are automatically applied** from the queue configuration:

```typescript
// ✅ GOOD: Uses default timeout=10s, priority=HIGH, attempts=3
await this.emailQueue.add('deliver-email', {
  to: 'user@example.com',
  subject: 'Welcome!',
  body: 'Thanks for signing up',
});
```

### 2. Overriding Priority

Override priority for specific jobs when needed:

```typescript
import { JobPriority } from '@/config/queue-config';

// CRITICAL: Password reset email
await this.emailQueue.add(
  'deliver-email',
  { to: user.email, template: 'password-reset' },
  { priority: JobPriority.CRITICAL } // Override: CRITICAL instead of HIGH
);

// LOW: Marketing digest email
await this.emailQueue.add(
  'send-digest',
  { userId: user.id },
  { priority: JobPriority.LOW } // Override: LOW instead of default
);
```

### 3. Overriding Timeout

Override timeout for slow operations:

```typescript
// Large file processing - needs more time
await this.analyticsQueue.add(
  'generate-report',
  { reportId, startDate, endDate },
  { 
    timeout: 300000, // 5 minutes instead of default 60s
    priority: JobPriority.NORMAL 
  }
);
```

### 4. Custom Retry Strategy

Override retry behavior for sensitive operations:

```typescript
// Financial operation - fewer retries, longer backoff
await this.paymentQueue.add(
  'process-payment',
  { paymentId },
  {
    attempts: 2, // Only 2 attempts instead of default 5
    backoff: {
      type: 'exponential',
      delay: 30000, // 30s, 60s
    },
    priority: JobPriority.CRITICAL,
  }
);
```

### 5. Delayed Jobs

Schedule jobs for future execution:

```typescript
// Send reminder email in 24 hours
await this.emailQueue.add(
  'send-reminder',
  { userId, jobId },
  {
    delay: 24 * 60 * 60 * 1000, // 24 hours
    priority: JobPriority.NORMAL,
  }
);
```

### 6. Repeatable Jobs (Cron)

Create recurring jobs:

```typescript
// Daily cleanup at 2 AM
await this.cleanupQueue.add(
  'daily-cleanup',
  {},
  {
    repeat: { pattern: '0 2 * * *' }, // Cron: 2:00 AM daily
    jobId: 'daily-cleanup-job', // Unique ID prevents duplicates
    priority: JobPriority.LOW,
  }
);
```

---

## Timeout Handling

### What Happens on Timeout?

1. **Job marked as failed** after timeout expires
2. **Retry triggered** if attempts remain
3. **Exponential backoff** applied between retries
4. **DLQ capture** if all retries exhausted (for protected queues)

### Timeout Example

```typescript
// Job with 10s timeout, 3 attempts
await queue.add('process-data', { id }, {
  timeout: 10000,
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 }
});

// Timeline:
// t=0s:   Attempt 1 starts
// t=10s:  Timeout! Attempt 1 fails
// t=15s:  Attempt 2 starts (5s backoff)
// t=25s:  Timeout! Attempt 2 fails
// t=35s:  Attempt 3 starts (10s backoff)
// t=45s:  Timeout! Attempt 3 fails
// t=45s:  Job moved to DLQ (if enabled)
```

### Preventing Timeouts

**For long-running operations:**

1. **Increase timeout** via job options
2. **Break into smaller jobs** (recommended)
3. **Use background tasks** for indefinite operations

```typescript
// ❌ BAD: Single 10-minute job
await queue.add('process-large-file', { fileId }, { timeout: 600000 });

// ✅ GOOD: Break into chunks
for (const chunk of fileChunks) {
  await queue.add('process-chunk', { chunk }, { timeout: 30000 });
}
```

---

## Monitoring Timeouts

### Queue Health Endpoint

Check for timed-out jobs:

```bash
GET /health
```

Response includes:
- Active jobs (currently processing)
- Waiting jobs (in queue)
- Failed jobs (timeout or error)
- Delayed jobs (scheduled)

### Redis Inspection

Manually check queue state:

```bash
# Connect to Redis
docker exec -it redis-container redis-cli

# List failed jobs in queue
ZRANGE bull:comms.email:failed 0 -1

# Get job details
GET bull:comms.email:12345
```

---

## Rate Limiting

### Overview

BullMQ implements **token bucket rate limiting** to prevent queue flooding and ensure fair resource allocation.

**How it works:**
1. Each queue has a bucket with `max` tokens
2. Processing a job consumes 1 token
3. Tokens refill at a rate of `max` per `duration`
4. When bucket is empty, jobs wait until tokens available

**Benefits:**
- Prevents overwhelming external APIs (SMTP, SMS, payment gateways)
- Controls costs (SMS providers charge per message)
- Ensures fair resource distribution across queues
- Protects against queue flooding attacks

### Rate Limits by Queue

| Queue | Limit | Reasoning |
|-------|-------|-----------|
| `comms.email` | 100/min | SMTP provider limits (SendGrid, Mailgun) |
| `comms.sms` | 50/min | Carrier limits + cost control |
| `comms.push` | 1000/min | Firebase has high throughput |
| `payment.retry` | 200/min | Stripe API rate limits (100 req/s per key) |
| `payment.refund` | 100/min | Financial operation safety |
| `payment.webhook` | 100/min | Respect external endpoint limits |
| `marketplace.notification` | 300/min | High volume, non-critical |
| `identity.email` | 200/min | Auth emails critical but controlled |
| `oversight.audit` | 500/min | High volume audit logging |

### How Rate Limiting Works

```typescript
// Queue configured with rate limit
'comms.email': {
  limiter: {
    max: 100,        // 100 jobs
    duration: 60000, // per minute
  },
}

// Behavior:
// - First 100 jobs process immediately
// - Job 101 waits until next minute
// - Tokens refill continuously (not all at once)
```

### Monitoring Rate Limits

Check queue status to see rate-limited jobs:

```typescript
// Get queue status
const queue = this.emailQueue;
const jobCounts = await queue.getJobCounts();

console.log({
  waiting: jobCounts.waiting,     // Jobs waiting for tokens
  active: jobCounts.active,       // Currently processing
  delayed: jobCounts.delayed,     // Rate-limited jobs
});
```

### Adjusting Rate Limits

Edit `config/queue-config.ts` and restart workers:

```typescript
// Increase email rate limit
'comms.email': {
  limiter: {
    max: 200,        // Increased from 100
    duration: 60000,
  },
}
```

**Note:** BullMQ rate limiting is **per worker instance**. If you run 5 worker pods, effective limit is `max * 5`.

### Rate Limiting Best Practices

1. **Match external API limits** - Set rate limits slightly below provider limits
2. **Monitor failure rates** - Adjust if hitting provider rate limits
3. **Use job priorities** - Critical jobs bypass rate-limited lower-priority jobs
4. **Scale workers carefully** - More workers = higher effective rate
5. **Test with production load** - Simulate peak traffic to validate limits

---

## Stalled Job Recovery

### Overview

**Stalled jobs** occur when a worker crashes or loses connection while processing a job. BullMQ automatically detects and recovers stalled jobs.

**Configuration per queue:**
```typescript
settings: {
  stalledInterval: 30000,   // Check every 30 seconds
  maxStalledCount: 2,       // Max stalls before failure
  lockDuration: 20000,      // Worker holds lock for 20s
  lockRenewTime: 5000,      // Renew lock every 5s
}
```

### How Stalled Job Recovery Works

1. **Worker acquires job lock** with `lockDuration` (e.g., 20s)
2. **Worker renews lock** every `lockRenewTime` (e.g., 5s) while processing
3. **If worker crashes**, lock expires after `lockDuration`
4. **Stalled job checker** runs every `stalledInterval` (e.g., 30s)
5. **Job marked as stalled** if lock expired
6. **Job retried** if `attempts` remain and `maxStalledCount` not exceeded
7. **Job fails** if `maxStalledCount` exceeded

### Stalled Job Recovery Timeline

```
t=0s:    Job starts, lock acquired (20s duration)
t=5s:    Lock renewed (now expires at t=25s)
t=10s:   Lock renewed (now expires at t=30s)
t=12s:   ❌ Worker crashes (lock stops renewing)
t=30s:   Lock expires
t=35s:   Stalled checker runs, detects expired lock
t=35s:   Job marked as stalled (attempt 1)
t=35s:   Job retried (attempt 2 starts)
```

### Monitoring Stalled Jobs

Check queue health for stalled job counts:

```bash
GET /health

Response:
{
  "queues": {
    "comms.email": {
      "active": 5,
      "waiting": 120,
      "failed": 3,
      "stalled": 2   # ⚠️ Stalled jobs detected
    }
  }
}
```

Query Redis directly for stalled job details:

```bash
# Connect to Redis
docker exec -it redis-container redis-cli

# List stalled jobs
ZRANGE bull:comms.email:stalled 0 -1

# Get stalled job count
ZCARD bull:comms.email:stalled
```

### Stalled Job Configuration by Queue

| Queue | Check Interval | Max Stalls | Lock Duration | Reasoning |
|-------|---------------|------------|---------------|-----------|
| `comms.email` | 30s | 2 | 20s | Fast jobs, quick recovery |
| `comms.sms` | 30s | 2 | 25s | Carrier delays tolerated |
| `payment.retry` | 30s | 2 | 40s | Critical, longer processing |
| `payment.webhook` | 30s | 3 | 30s | External endpoints unreliable |
| `payment.analytics` | 60s | 1 | 70s | Long jobs, fewer retries |
| `comms.cleanup` | 60s | 1 | 130s | Low priority, long operations |

### Tuning Stalled Job Settings

**Fast failing jobs (< 10s):**
```typescript
settings: {
  stalledInterval: 30000,   // Check every 30s
  maxStalledCount: 2,       // 2 stalls allowed
  lockDuration: 20000,      // 20s lock (timeout + 10s buffer)
  lockRenewTime: 5000,      // Renew every 5s
}
```

**Slow jobs (1-2 minutes):**
```typescript
settings: {
  stalledInterval: 60000,   // Check every minute
  maxStalledCount: 1,       // Only 1 stall allowed
  lockDuration: 130000,     // 130s lock (120s timeout + 10s buffer)
  lockRenewTime: 30000,     // Renew every 30s
}
```

**External APIs (unpredictable):**
```typescript
settings: {
  stalledInterval: 30000,
  maxStalledCount: 3,       // More stalls tolerated
  lockDuration: 30000,
  lockRenewTime: 10000,
}
```

### Preventing Stalled Jobs

1. **Set lockDuration = timeout + buffer** - Prevents false stall detection
2. **Renew locks frequently** - Set lockRenewTime = lockDuration / 4
3. **Monitor worker health** - Restart unhealthy workers
4. **Use connection pooling** - Prevents Redis connection drops
5. **Handle errors gracefully** - Ensure workers can exit cleanly

### Stalled Job Troubleshooting

**Symptom:** High stalled job count

**Causes:**
- Worker pods crashing frequently
- Redis connection instability
- lockDuration too short for job timeout
- Network partitions between worker and Redis

**Solutions:**
1. Check worker logs: `kubectl logs -f comms-worker`
2. Verify Redis connectivity: `redis-cli PING`
3. Increase lockDuration if jobs timing out
4. Scale worker pods horizontally
5. Restart Redis if connection pool exhausted

**Symptom:** Jobs stall but never retry

**Cause:** maxStalledCount = 1 with high worker crash rate

**Solution:** Increase maxStalledCount to 2-3 for unreliable jobs

---

## Dead Letter Queue (DLQ)

### Protected Queues

The following queues have **automatic DLQ capture** on final failure:

- `comms.email`
- `comms.sms`
- `comms.push`
- `payment.refund`
- `payment.webhook`

### DLQ API

```bash
# List all DLQ jobs
GET /admin/dlq?limit=50&offset=0

# Retry single DLQ job
POST /admin/dlq/:id/retry

# Retry all DLQ jobs for a queue
POST /admin/dlq/retry-all
  Body: { originalQueue: "comms.email" }

# Delete DLQ job
DELETE /admin/dlq/:id
```

---

## Best Practices

### 1. Use Default Configurations

Let the centralized config handle timeouts and priorities:

```typescript
// ✅ GOOD: Clean and simple
await queue.add('send-email', { to, subject, body });

// ❌ BAD: Manually specifying defaults
await queue.add('send-email', data, {
  timeout: 10000,
  attempts: 3,
  priority: 2,
  // ... duplicating config
});
```

### 2. Override Only When Necessary

```typescript
// ✅ GOOD: Override for valid reason
await queue.add('urgent-alert', data, {
  priority: JobPriority.CRITICAL, // Security alert
});

// ❌ BAD: Arbitrary overrides
await queue.add('some-job', data, {
  priority: 1, // Why critical? No justification
});
```

### 3. Keep Jobs Fast

Target < 5 seconds for most jobs:

```typescript
// ✅ GOOD: Fast single-purpose job
async processPayment(job) {
  const payment = await this.createPayment(job.data);
  await this.notifyUser(payment);
}

// ❌ BAD: Slow multi-step job
async processOrder(job) {
  await this.createOrder(job.data);
  await this.sendEmails();
  await this.updateInventory();
  await this.generateInvoice();
  await this.notifyWarehouse();
  // ... 20+ steps taking 5 minutes
}
```

### 4. Use Idempotent Job Handlers

Jobs may retry on failure:

```typescript
// ✅ GOOD: Idempotent (safe to retry)
async sendEmail(job) {
  const { deliveryId, userId, message } = job.data;
  
  // Check if already sent
  const delivery = await this.getDelivery(deliveryId);
  if (delivery.status === 'sent') {
    return; // Skip duplicate
  }
  
  await this.emailClient.send(userId, message);
  await this.markDelivered(deliveryId);
}

// ❌ BAD: Not idempotent (double-sends on retry)
async sendEmail(job) {
  await this.emailClient.send(job.data.userId, job.data.message);
  // No duplicate check!
}
```

### 5. Log Job Progress

Help debug timeouts and failures:

```typescript
async processLargeTask(job) {
  this.logger.log(`Job ${job.id} starting (attempt ${job.attemptsMade + 1})`);
  
  const result = await this.doWork(job.data);
  
  this.logger.log(`Job ${job.id} completed successfully`);
  return result;
}
```

---

## Troubleshooting

### Jobs Timing Out

**Symptoms:**
- Jobs failing with "job stalled" or timeout errors
- High failed job count in queue health

**Solutions:**
1. Check worker concurrency: `WORKER_CONCURRENCY=5` (default)
2. Increase timeout for specific job: `{ timeout: 30000 }`
3. Optimize job handler performance
4. Check external API latency (SMTP, SMS, Stripe)

### Priority Not Working

**Symptoms:**
- Low-priority jobs processed before high-priority

**Solutions:**
1. Verify `priority` is set correctly (1=highest, 4=lowest)
2. Check worker is using latest config (restart container)
3. Ensure FIFO is not disabled

### Jobs Stuck in Queue

**Symptoms:**
- Jobs in "waiting" state never processed
- Worker pod not consuming jobs

**Solutions:**
1. Check `WORKERS_ENABLED=true` in worker pods
2. Verify Redis connection: `docker logs worker-pod`
3. Restart worker: `kubectl rollout restart deployment/comms-worker`

---

## Configuration Changes

### Adding New Queues

1. Add configuration to `config/queue-config.ts`:

```typescript
export const QUEUE_CONFIGS: Record<string, QueueConfig> = {
  // ... existing queues
  'my-service.new-queue': {
    name: 'my-service.new-queue',
    defaultJobOptions: {
      attempts: 3,
      timeout: 15000, // 15 seconds
      priority: JobPriority.NORMAL,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    },
  },
};
```

2. Register queue in worker module:

```typescript
import { getQueueRegistrationOptions } from '@/config/queue-config';

@Module({
  imports: [
    BullModule.registerQueue(
      getQueueRegistrationOptions('my-service.new-queue'),
    ),
  ],
})
export class WorkersModule {}
```

### Adjusting Timeouts

Edit `config/queue-config.ts` and restart affected services:

```bash
# Update timeout
vim config/queue-config.ts

# Restart workers
docker-compose restart comms-worker payment-worker
```

---

## Implementation Summary

**Implemented (April 11, 2026):**
- ✅ Centralized queue configuration system
- ✅ Job timeouts for all 20+ queues (10s - 120s ranges)
- ✅ Priority-based processing (4 levels: CRITICAL → LOW)
- ✅ Queue rate limiting (token bucket algorithm, per-queue configurable)
- ✅ Automatic stalled job recovery (30-60s check intervals, max 1-3 stalls)
- ✅ Automatic retry strategies (2-5 attempts with exponential/fixed backoff)
- ✅ Cleanup policies (removeOnComplete, removeOnFail)
- ✅ DLQ integration with timeout protection

**Rate Limits Configured:**
- Email: 100/min, SMS: 50/min, Push: 1000/min
- Payments: 200/min, Refunds: 100/min, Webhooks: 100/min
- Analytics: 30-50/min, Cleanup: 5-10/min
- Audit logs: 500/min (high volume logging)

**Stalled Job Recovery:**
- Fast jobs (email, SMS, push): 30s check interval, 2 max stalls
- Slow jobs (analytics, cleanup): 60s check interval, 1 max stall
- Unreliable jobs (webhooks): 30s interval, 3 max stalls

**Gaps Closed:**
- ✅ Gap 2.4.1: Job Timeouts Configuration
- ✅ Gap 2.4.2: Queue Priorities
- ✅ Gap 2.4.3: Queue Rate Limiting
- ✅ Gap 2.4.4: Stalled Job Recovery

**Production Ready:** All BullMQ scalability gaps closed! 🎉

---

## References

- **Queue Config:** [`config/queue-config.ts`](../config/queue-config.ts)
- **BullMQ Docs:** https://docs.bullmq.io/
- **Rate Limiting:** https://docs.bullmq.io/guide/rate-limiting
- **Stalled Jobs:** https://docs.bullmq.io/guide/jobs/stalled
- **Worker Module Example:** [`services/comms-service/src/workers/workers.module.ts`](../services/comms-service/src/workers/workers.module.ts)
- **DLQ Guide:** [`DLQ_WORKER_INTEGRATION_SUMMARY.md`](../DLQ_WORKER_INTEGRATION_SUMMARY.md)

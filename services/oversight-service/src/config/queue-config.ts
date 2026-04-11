/**
 * Centralized BullMQ Queue Configuration
 * 
 * Defines timeouts, priorities, retry strategies, rate limits, and stalled job recovery
 * for all queues across the platform.
 */

export enum JobPriority {
  CRITICAL = 1,    // Authentication, payments, security alerts
  HIGH = 2,        // Customer notifications, refunds
  NORMAL = 3,      // Standard notifications, analytics
  LOW = 4,         // Cleanup jobs, digest emails
}

/**
 * Rate Limiting Configuration
 * 
 * Prevents queue flooding and ensures fair resource allocation.
 * Uses BullMQ's built-in rate limiter (token bucket algorithm).
 */
export interface RateLimitConfig {
  max: number;        // Maximum jobs to process
  duration: number;   // Time window in milliseconds
  groupKey?: string;  // Optional grouping key for fine-grained control
}

export interface QueueConfig {
  name: string;
  defaultJobOptions: {
    attempts?: number;
    backoff?: {
      type: 'exponential' | 'fixed';
      delay: number;
    };
    removeOnComplete?: boolean | number | { age?: number; count?: number };
    removeOnFail?: boolean | number | { age?: number; count?: number };
    timeout?: number; // milliseconds
    priority?: JobPriority;
  };
  limiter?: RateLimitConfig;
  settings?: {
    stalledInterval?: number;  // Check for stalled jobs every X ms
    maxStalledCount?: number;  // Max times a job can stall before failed
    lockDuration?: number;     // How long a worker holds job lock (ms)
    lockRenewTime?: number;    // Renew lock every X ms
  };
}

/**
 * Job Timeout Guidelines:
 * - Email delivery: 10 seconds (external API call)
 * - SMS delivery: 15 seconds (external API call + carrier delays)
 * - Push notifications: 5 seconds (Firebase/APNs fast)
 * - Payment processing: 30 seconds (Stripe API can be slow)
 * - Webhook delivery: 20 seconds (external endpoints)
 * - Analytics: 60 seconds (batch processing)
 * - Cleanup jobs: 120 seconds (database operations)
 * 
 * Rate Limiting Guidelines:
 * - Email: 100/min (SMTP provider limits)
 * - SMS: 50/min (carrier limits, cost control)
 * - Push: 1000/min (Firebase has high limits)
 * - Payment: 200/min (Stripe API rate limits)
 * - Webhooks: 100/min (respect external endpoints)
 * - Analytics: 50/min (database load management)
 * 
 * Stalled Job Recovery:
 * - Check every 30 seconds by default
 * - Max 2 stalls before job marked as failed
 * - Lock duration = timeout + 10s buffer
 */
export const QUEUE_CONFIGS: Record<string, QueueConfig> = {
  // ============================================
  // COMMS SERVICE QUEUES
  // ============================================
  'comms.email': {
    name: 'comms.email',
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000, // 5s, 10s, 20s
      },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
      timeout: 10000, // 10 seconds
      priority: JobPriority.HIGH,
    },
    limiter: {
      max: 100,       // 100 emails
      duration: 60000, // per minute
    },
    settings: {
      stalledInterval: 30000,  // Check every 30s
      maxStalledCount: 2,      // Fail after 2 stalls
      lockDuration: 20000,     // 20s (timeout + 10s buffer)
      lockRenewTime: 5000,     // Renew every 5s
    },
  },
  'comms.sms': {
    name: 'comms.sms',
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 10000, // 10s, 20s, 40s
      },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
      timeout: 15000, // 15 seconds
      priority: JobPriority.HIGH,
    },
    limiter: {
      max: 50,         // 50 SMS
      duration: 60000, // per minute (cost control)
    },
    settings: {
      stalledInterval: 30000,
      maxStalledCount: 2,
      lockDuration: 25000,     // 25s
      lockRenewTime: 7000,
    },
  },
  'comms.push': {
    name: 'comms.push',
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 3000, // 3s, 6s, 12s
      },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
      timeout: 5000, // 5 seconds
      priority: JobPriority.HIGH,
    },
    limiter: {
      max: 1000,       // 1000 push notifications
      duration: 60000, // per minute (Firebase high limits)
    },
    settings: {
      stalledInterval: 30000,
      maxStalledCount: 2,
      lockDuration: 15000,     // 15s
      lockRenewTime: 3000,
    },
  },
  'comms.digest': {
    name: 'comms.digest',
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 300000, // 5 minutes
      },
      removeOnComplete: true,
      removeOnFail: { count: 10 },
      timeout: 60000, // 60 seconds (batch processing)
      priority: JobPriority.LOW,
    },
    limiter: {
      max: 10,         // 10 batch jobs
      duration: 60000, // per minute
    },
    settings: {
      stalledInterval: 60000,  // Check every minute
      maxStalledCount: 1,
      lockDuration: 70000,
      lockRenewTime: 15000,
    },
  },
  'comms.cleanup': {
    name: 'comms.cleanup',
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 600000, // 10 minutes
      },
      removeOnComplete: true,
      removeOnFail: { count: 5 },
      timeout: 120000, // 120 seconds
      priority: JobPriority.LOW,
    },
    limiter: {
      max: 5,          // 5 cleanup jobs
      duration: 60000, // per minute
    },
    settings: {
      stalledInterval: 60000,
      maxStalledCount: 1,
      lockDuration: 130000,
      lockRenewTime: 30000,
    },
  },

  // ============================================
  // PAYMENT SERVICE QUEUES
  // ============================================
  'payment.retry': {
    name: 'payment.retry',
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 10000, // 10s, 20s, 40s, 80s, 160s
      },
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 100 },
      timeout: 30000, // 30 seconds
      priority: JobPriority.CRITICAL,
    },
    limiter: {
      max: 200,        // 200 payment retries
      duration: 60000, // per minute
    },
    settings: {
      stalledInterval: 30000,
      maxStalledCount: 2,
      lockDuration: 40000,     // 40s
      lockRenewTime: 10000,
    },
  },
  'payment.refund': {
    name: 'payment.refund',
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 15000, // 15s, 30s, 60s
      },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 100 },
      timeout: 30000, // 30 seconds
      priority: JobPriority.CRITICAL,
    },
    limiter: {
      max: 100,        // 100 refunds
      duration: 60000, // per minute
    },
    settings: {
      stalledInterval: 30000,
      maxStalledCount: 2,
      lockDuration: 40000,
      lockRenewTime: 10000,
    },
  },
  'payment.webhook': {
    name: 'payment.webhook',
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 30000, // 30s, 60s, 120s, 240s, 480s
      },
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 100 },
      timeout: 20000, // 20 seconds
      priority: JobPriority.HIGH,
    },
    limiter: {
      max: 100,        // 100 webhooks
      duration: 60000, // per minute
    },
    settings: {
      stalledInterval: 30000,
      maxStalledCount: 3,      // More stall attempts for webhooks
      lockDuration: 30000,
      lockRenewTime: 10000,
    },
  },
  'payment.notification': {
    name: 'payment.notification',
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: { count: 50 },
      timeout: 10000, // 10 seconds
      priority: JobPriority.HIGH,
    },
    limiter: {
      max: 200,        // 200 notifications
      duration: 60000, // per minute
    },
    settings: {
      stalledInterval: 30000,
      maxStalledCount: 2,
      lockDuration: 20000,
      lockRenewTime: 5000,
    },
  },
  'payment.analytics': {
    name: 'payment.analytics',
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 60000,
      },
      removeOnComplete: true,
      removeOnFail: { count: 20 },
      timeout: 60000, // 60 seconds
      priority: JobPriority.NORMAL,
    },
    limiter: {
      max: 50,         // 50 analytics jobs
      duration: 60000, // per minute
    },
    settings: {
      stalledInterval: 60000,
      maxStalledCount: 1,
      lockDuration: 70000,
      lockRenewTime: 15000,
    },
  },
  'payment.subscription': {
    name: 'payment.subscription',
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 300000, // 5 minutes
      },
      removeOnComplete: true,
      removeOnFail: { count: 10 },
      timeout: 30000, // 30 seconds
      priority: JobPriority.HIGH,
    },
    limiter: {
      max: 100,        // 100 subscription jobs
      duration: 60000, // per minute
    },
    settings: {
      stalledInterval: 30000,
      maxStalledCount: 2,
      lockDuration: 40000,
      lockRenewTime: 10000,
    },
  },
  'payment.method-expiry': {
    name: 'payment.method-expiry',
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 3600000, // 1 hour
      },
      removeOnComplete: true,
      removeOnFail: { count: 5 },
      timeout: 60000, // 60 seconds
      priority: JobPriority.LOW,
    },
    limiter: {
      max: 20,         // 20 expiry checks
      duration: 60000, // per minute
    },
    settings: {
      stalledInterval: 60000,
      maxStalledCount: 1,
      lockDuration: 70000,
      lockRenewTime: 15000,
    },
  },
  'payment.cleanup': {
    name: 'payment.cleanup',
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 600000, // 10 minutes
      },
      removeOnComplete: true,
      removeOnFail: { count: 5 },
      timeout: 120000, // 120 seconds
      priority: JobPriority.LOW,
    },
    limiter: {
      max: 5,          // 5 cleanup jobs
      duration: 60000, // per minute
    },
    settings: {
      stalledInterval: 60000,
      maxStalledCount: 1,
      lockDuration: 130000,
      lockRenewTime: 30000,
    },
  },

  // ============================================
  // MARKETPLACE SERVICE QUEUES
  // ============================================
  'marketplace.notification': {
    name: 'marketplace.notification',
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: { count: 50 },
      timeout: 10000, // 10 seconds
      priority: JobPriority.NORMAL,
    },
    limiter: {
      max: 300,        // 300 notifications
      duration: 60000, // per minute
    },
    settings: {
      stalledInterval: 30000,
      maxStalledCount: 2,
      lockDuration: 20000,
      lockRenewTime: 5000,
    },
  },
  'marketplace.analytics': {
    name: 'marketplace.analytics',
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 60000,
      },
      removeOnComplete: true,
      removeOnFail: { count: 20 },
      timeout: 60000, // 60 seconds
      priority: JobPriority.NORMAL,
    },
    limiter: {
      max: 50,         // 50 analytics jobs
      duration: 60000, // per minute
    },
    settings: {
      stalledInterval: 60000,
      maxStalledCount: 1,
      lockDuration: 70000,
      lockRenewTime: 15000,
    },
  },

  // ============================================
  // IDENTITY SERVICE QUEUES
  // ============================================
  'identity.email': {
    name: 'identity.email',
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: { count: 50 },
      timeout: 10000, // 10 seconds
      priority: JobPriority.CRITICAL, // Auth emails are critical
    },
    limiter: {
      max: 200,        // 200 auth emails
      duration: 60000, // per minute
    },
    settings: {
      stalledInterval: 30000,
      maxStalledCount: 2,
      lockDuration: 20000,
      lockRenewTime: 5000,
    },
  },
  'identity.notification': {
    name: 'identity.notification',
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: { count: 50 },
      timeout: 10000, // 10 seconds
      priority: JobPriority.CRITICAL, // Auth notifications are critical
    },
    limiter: {
      max: 200,
      duration: 60000,
    },
    settings: {
      stalledInterval: 30000,
      maxStalledCount: 2,
      lockDuration: 20000,
      lockRenewTime: 5000,
    },
  },
  'identity.cleanup': {
    name: 'identity.cleanup',
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 600000, // 10 minutes
      },
      removeOnComplete: true,
      removeOnFail: { count: 5 },
      timeout: 120000, // 120 seconds
      priority: JobPriority.LOW,
    },
    limiter: {
      max: 5,
      duration: 60000,
    },
    settings: {
      stalledInterval: 60000,
      maxStalledCount: 1,
      lockDuration: 130000,
      lockRenewTime: 30000,
    },
  },
  'identity.document': {
    name: 'identity.document',
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 60000, // 1 minute
      },
      removeOnComplete: true,
      removeOnFail: { count: 20 },
      timeout: 60000, // 60 seconds
      priority: JobPriority.NORMAL,
    },
    limiter: {
      max: 50,
      duration: 60000,
    },
    settings: {
      stalledInterval: 60000,
      maxStalledCount: 1,
      lockDuration: 70000,
      lockRenewTime: 15000,
    },
  },

  // ============================================
  // OVERSIGHT SERVICE QUEUES
  // ============================================
  'oversight.audit': {
    name: 'oversight.audit',
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 10000,
      },
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 100 },
      timeout: 30000, // 30 seconds
      priority: JobPriority.NORMAL,
    },
    limiter: {
      max: 500,        // 500 audit logs
      duration: 60000, // per minute
    },
    settings: {
      stalledInterval: 30000,
      maxStalledCount: 1,
      lockDuration: 40000,
      lockRenewTime: 10000,
    },
  },
  'oversight.analytics': {
    name: 'oversight.analytics',
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 60000,
      },
      removeOnComplete: true,
      removeOnFail: { count: 20 },
      timeout: 120000, // 120 seconds (complex aggregations)
      priority: JobPriority.NORMAL,
    },
    limiter: {
      max: 30,         // 30 analytics jobs
      duration: 60000, // per minute
    },
    settings: {
      stalledInterval: 60000,
      maxStalledCount: 1,
      lockDuration: 130000,
      lockRenewTime: 30000,
    },
  },

  // ============================================
  // INFRASTRUCTURE SERVICE QUEUES
  // ============================================
  'infra.background-jobs': {
    name: 'infra.background-jobs',
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 30000,
      },
      removeOnComplete: true,
      removeOnFail: { count: 20 },
      timeout: 60000, // 60 seconds
      priority: JobPriority.NORMAL,
    },
    limiter: {
      max: 100,        // 100 background jobs
      duration: 60000, // per minute
    },
    settings: {
      stalledInterval: 60000,
      maxStalledCount: 1,
      lockDuration: 70000,
      lockRenewTime: 15000,
    },
  },

  // ============================================
  // DEAD LETTER QUEUE (DLQ)
  // ============================================
  'infra.dlq': {
    name: 'infra.dlq',
    defaultJobOptions: {
      attempts: 1, // DLQ jobs are already failed
      removeOnComplete: { count: 1000 },
      removeOnFail: false, // Keep all DLQ failures
      timeout: 30000, // 30 seconds
      priority: JobPriority.LOW,
    },
    limiter: {
      max: 50,         // 50 DLQ retries
      duration: 60000, // per minute
    },
    settings: {
      stalledInterval: 60000,
      maxStalledCount: 1,
      lockDuration: 40000,
      lockRenewTime: 10000,
    },
  },
};

/**
 * Get queue configuration by name.
 * Falls back to default config if not found.
 */
export function getQueueConfig(queueName: string): QueueConfig {
  return QUEUE_CONFIGS[queueName] || {
    name: queueName,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: { count: 20 },
      timeout: 30000, // 30 seconds default
      priority: JobPriority.NORMAL,
    },
    limiter: {
      max: 100,
      duration: 60000,
    },
    settings: {
      stalledInterval: 30000,
      maxStalledCount: 2,
      lockDuration: 40000,
      lockRenewTime: 10000,
    },
  };
}

/**
 * Generate BullModule.registerQueue options for a queue.
 * 
 * Includes:
 * - defaultJobOptions: Applied to all jobs in this queue
 * - limiter: Rate limiting (token bucket algorithm)
 * - settings: Queue-level settings including stalled job recovery
 */
export function getQueueRegistrationOptions(queueName: string) {
  const config = getQueueConfig(queueName);
  
  const options: any = {
    name: config.name,
    defaultJobOptions: config.defaultJobOptions,
  };
  
  // Add rate limiter if configured
  if (config.limiter) {
    options.limiter = config.limiter;
  }
  
  // Add queue settings (stalled job recovery)
  if (config.settings) {
    options.settings = config.settings;
  }
  
  return options;
}


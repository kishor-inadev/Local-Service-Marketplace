import { Injectable, OnModuleDestroy, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import Redis from 'ioredis';
import * as Bull from 'bull';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private redisClient: Redis;
  private jobQueues: Map<string, Bull.Queue> = new Map();

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.redisClient.on('connect', () => {
      this.logger.log('Redis connected successfully', 'RedisService');
    });

    this.redisClient.on('error', (err) => {
      this.logger.error(`Redis connection error: ${err.message}`, err.stack, 'RedisService');
    });
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
    for (const queue of this.jobQueues.values()) {
      await queue.close();
    }
  }

  getClient(): Redis {
    return this.redisClient;
  }

  /**
   * Get or create a Bull queue for job processing
   */
  getQueue(queueName: string): Bull.Queue {
    if (!this.jobQueues.has(queueName)) {
      const queue = new Bull(queueName, {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
        },
      });

      this.jobQueues.set(queueName, queue);
      this.logger.log(`Created Bull queue: ${queueName}`, 'RedisService');
    }

    return this.jobQueues.get(queueName);
  }

  /**
   * Add a job to a queue
   */
  async addJob(queueName: string, jobType: string, data: any, options?: Bull.JobOptions): Promise<Bull.Job> {
    const queue = this.getQueue(queueName);
    const job = await queue.add(jobType, data, options);

    this.logger.log(
      `Job added to queue ${queueName}: ${jobType} (ID: ${job.id})`,
      'RedisService',
    );

    return job;
  }

  /**
   * Process jobs from a queue
   */
  processQueue(
    queueName: string,
    processor: Bull.ProcessCallbackFunction<any>,
  ): void {
    const queue = this.getQueue(queueName);
    queue.process(processor);

    this.logger.log(`Processing jobs for queue: ${queueName}`, 'RedisService');
  }

  /**
   * Get job by ID
   */
  async getJob(queueName: string, jobId: string): Promise<Bull.Job | null> {
    const queue = this.getQueue(queueName);
    return queue.getJob(jobId);
  }

  /**
   * Get job counts from queue
   */
  async getJobCounts(queueName: string): Promise<Bull.JobCounts> {
    const queue = this.getQueue(queueName);
    return queue.getJobCounts();
  }

  /**
   * Clean completed jobs from queue
   */
  async cleanQueue(queueName: string, grace: number = 0, status: 'completed' | 'wait' | 'active' | 'delayed' | 'failed' = 'completed'): Promise<Bull.Job[]> {
    const queue = this.getQueue(queueName);
    return queue.clean(grace, status);
  }

  /**
   * Set a key-value pair in Redis
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redisClient.setex(key, ttl, value);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  /**
   * Get a value from Redis
   */
  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  /**
   * Delete a key from Redis
   */
  async del(key: string): Promise<number> {
    return this.redisClient.del(key);
  }

  /**
   * Increment a counter in Redis
   */
  async incr(key: string): Promise<number> {
    return this.redisClient.incr(key);
  }

  /**
   * Set expiry on a key
   */
  async expire(key: string, seconds: number): Promise<number> {
    return this.redisClient.expire(key, seconds);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<number> {
    return this.redisClient.exists(key);
  }
}

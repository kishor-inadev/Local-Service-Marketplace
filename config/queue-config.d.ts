export declare enum JobPriority {
    CRITICAL = 1,
    HIGH = 2,
    NORMAL = 3,
    LOW = 4
}
export interface RateLimitConfig {
    max: number;
    duration: number;
    groupKey?: string;
}
export interface QueueConfig {
    name: string;
    defaultJobOptions: {
        attempts?: number;
        backoff?: {
            type: 'exponential' | 'fixed';
            delay: number;
        };
        removeOnComplete?: boolean | number | {
            age?: number;
            count?: number;
        };
        removeOnFail?: boolean | number | {
            age?: number;
            count?: number;
        };
        timeout?: number;
        priority?: JobPriority;
    };
    limiter?: RateLimitConfig;
    settings?: {
        stalledInterval?: number;
        maxStalledCount?: number;
        lockDuration?: number;
        lockRenewTime?: number;
    };
}
export declare const QUEUE_CONFIGS: Record<string, QueueConfig>;
export declare function getQueueConfig(queueName: string): QueueConfig;
export declare function getQueueRegistrationOptions(queueName: string): any;

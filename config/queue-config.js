"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QUEUE_CONFIGS = exports.JobPriority = void 0;
exports.getQueueConfig = getQueueConfig;
exports.getQueueRegistrationOptions = getQueueRegistrationOptions;
var JobPriority;
(function (JobPriority) {
    JobPriority[JobPriority["CRITICAL"] = 1] = "CRITICAL";
    JobPriority[JobPriority["HIGH"] = 2] = "HIGH";
    JobPriority[JobPriority["NORMAL"] = 3] = "NORMAL";
    JobPriority[JobPriority["LOW"] = 4] = "LOW";
})(JobPriority || (exports.JobPriority = JobPriority = {}));
exports.QUEUE_CONFIGS = {
    'comms.email': {
        name: 'comms.email',
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000,
            },
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 50 },
            timeout: 10000,
            priority: JobPriority.HIGH,
        },
        limiter: {
            max: 100,
            duration: 60000,
        },
        settings: {
            stalledInterval: 30000,
            maxStalledCount: 2,
            lockDuration: 20000,
            lockRenewTime: 5000,
        },
    },
    'comms.sms': {
        name: 'comms.sms',
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 10000,
            },
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 50 },
            timeout: 15000,
            priority: JobPriority.HIGH,
        },
        limiter: {
            max: 50,
            duration: 60000,
        },
        settings: {
            stalledInterval: 30000,
            maxStalledCount: 2,
            lockDuration: 25000,
            lockRenewTime: 7000,
        },
    },
    'comms.push': {
        name: 'comms.push',
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 3000,
            },
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 50 },
            timeout: 5000,
            priority: JobPriority.HIGH,
        },
        limiter: {
            max: 1000,
            duration: 60000,
        },
        settings: {
            stalledInterval: 30000,
            maxStalledCount: 2,
            lockDuration: 15000,
            lockRenewTime: 3000,
        },
    },
    'comms.digest': {
        name: 'comms.digest',
        defaultJobOptions: {
            attempts: 2,
            backoff: {
                type: 'fixed',
                delay: 300000,
            },
            removeOnComplete: true,
            removeOnFail: { count: 10 },
            timeout: 60000,
            priority: JobPriority.LOW,
        },
        limiter: {
            max: 10,
            duration: 60000,
        },
        settings: {
            stalledInterval: 60000,
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
                delay: 600000,
            },
            removeOnComplete: true,
            removeOnFail: { count: 5 },
            timeout: 120000,
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
    'payment.retry': {
        name: 'payment.retry',
        defaultJobOptions: {
            attempts: 5,
            backoff: {
                type: 'exponential',
                delay: 10000,
            },
            removeOnComplete: { count: 50 },
            removeOnFail: { count: 100 },
            timeout: 30000,
            priority: JobPriority.CRITICAL,
        },
        limiter: {
            max: 200,
            duration: 60000,
        },
        settings: {
            stalledInterval: 30000,
            maxStalledCount: 2,
            lockDuration: 40000,
            lockRenewTime: 10000,
        },
    },
    'payment.refund': {
        name: 'payment.refund',
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 15000,
            },
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 100 },
            timeout: 30000,
            priority: JobPriority.CRITICAL,
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
    },
    'payment.webhook': {
        name: 'payment.webhook',
        defaultJobOptions: {
            attempts: 5,
            backoff: {
                type: 'exponential',
                delay: 30000,
            },
            removeOnComplete: { count: 50 },
            removeOnFail: { count: 100 },
            timeout: 20000,
            priority: JobPriority.HIGH,
        },
        limiter: {
            max: 100,
            duration: 60000,
        },
        settings: {
            stalledInterval: 30000,
            maxStalledCount: 3,
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
            timeout: 10000,
            priority: JobPriority.HIGH,
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
            timeout: 60000,
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
    'payment.subscription': {
        name: 'payment.subscription',
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 300000,
            },
            removeOnComplete: true,
            removeOnFail: { count: 10 },
            timeout: 30000,
            priority: JobPriority.HIGH,
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
    },
    'payment.method-expiry': {
        name: 'payment.method-expiry',
        defaultJobOptions: {
            attempts: 2,
            backoff: {
                type: 'fixed',
                delay: 3600000,
            },
            removeOnComplete: true,
            removeOnFail: { count: 5 },
            timeout: 60000,
            priority: JobPriority.LOW,
        },
        limiter: {
            max: 20,
            duration: 60000,
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
                delay: 600000,
            },
            removeOnComplete: true,
            removeOnFail: { count: 5 },
            timeout: 120000,
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
            timeout: 10000,
            priority: JobPriority.NORMAL,
        },
        limiter: {
            max: 300,
            duration: 60000,
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
            timeout: 60000,
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
            timeout: 10000,
            priority: JobPriority.CRITICAL,
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
            timeout: 10000,
            priority: JobPriority.CRITICAL,
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
                delay: 600000,
            },
            removeOnComplete: true,
            removeOnFail: { count: 5 },
            timeout: 120000,
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
                delay: 60000,
            },
            removeOnComplete: true,
            removeOnFail: { count: 20 },
            timeout: 60000,
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
            timeout: 30000,
            priority: JobPriority.NORMAL,
        },
        limiter: {
            max: 500,
            duration: 60000,
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
            timeout: 120000,
            priority: JobPriority.NORMAL,
        },
        limiter: {
            max: 30,
            duration: 60000,
        },
        settings: {
            stalledInterval: 60000,
            maxStalledCount: 1,
            lockDuration: 130000,
            lockRenewTime: 30000,
        },
    },
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
            timeout: 60000,
            priority: JobPriority.NORMAL,
        },
        limiter: {
            max: 100,
            duration: 60000,
        },
        settings: {
            stalledInterval: 60000,
            maxStalledCount: 1,
            lockDuration: 70000,
            lockRenewTime: 15000,
        },
    },
    'infra.dlq': {
        name: 'infra.dlq',
        defaultJobOptions: {
            attempts: 1,
            removeOnComplete: { count: 1000 },
            removeOnFail: false,
            timeout: 30000,
            priority: JobPriority.LOW,
        },
        limiter: {
            max: 50,
            duration: 60000,
        },
        settings: {
            stalledInterval: 60000,
            maxStalledCount: 1,
            lockDuration: 40000,
            lockRenewTime: 10000,
        },
    },
};
function getQueueConfig(queueName) {
    return exports.QUEUE_CONFIGS[queueName] || {
        name: queueName,
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000,
            },
            removeOnComplete: true,
            removeOnFail: { count: 20 },
            timeout: 30000,
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
function getQueueRegistrationOptions(queueName) {
    const config = getQueueConfig(queueName);
    const options = {
        name: config.name,
        defaultJobOptions: config.defaultJobOptions,
    };
    if (config.limiter) {
        options.limiter = config.limiter;
    }
    if (config.settings) {
        options.settings = config.settings;
    }
    return options;
}
//# sourceMappingURL=queue-config.js.map
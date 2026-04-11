import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Inject, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { UserRepository } from '../modules/auth/repositories/user.repository';
import { SessionRepository } from '../modules/auth/repositories/session.repository';
import { DEFAULT_JOB_OPTIONS } from '../bullmq/bullmq-default-options';

@Processor('identity.cleanup', {
  concurrency: 1,
})
export class IdentityCleanupWorker extends WorkerHost implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    @InjectQueue('identity.cleanup') private readonly cleanupQueue: Queue,
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    // Daily 1 AM — expire verification tokens
    await this.cleanupQueue.add(
      'expire-verification-tokens',
      {},
      { ...DEFAULT_JOB_OPTIONS, repeat: { pattern: '0 1 * * *' } },
    );

    // Daily 2 AM — purge expired sessions
    await this.cleanupQueue.add(
      'purge-expired-sessions',
      {},
      { ...DEFAULT_JOB_OPTIONS, repeat: { pattern: '0 2 * * *' } },
    );

    // Weekly Sunday 3 AM — purge old login attempts
    await this.cleanupQueue.add(
      'purge-login-attempts',
      {},
      { ...DEFAULT_JOB_OPTIONS, repeat: { pattern: '0 3 * * 0' } },
    );

    this.logger.info('Identity cleanup repeatable jobs registered', { context: 'IdentityCleanupWorker' });
  }

  async process(job: Job<any, any, string>): Promise<any> {
    try {
      switch (job.name) {
        case 'expire-verification-tokens':
          return this.handleExpireVerificationTokens();
        case 'purge-expired-sessions':
          return this.handlePurgeExpiredSessions();
        case 'purge-login-attempts':
          return this.handlePurgeLoginAttempts();
        default:
          throw new Error(`Unknown job name: ${job.name}`);
      }
    } catch (error: any) {
      const err = error as Error;
      this.logger.error(`Job "${job.name}/${job.id}" threw: ${err.message}`, { context: 'IdentityCleanupWorker', stack: err.stack });
      throw error;
    }
  }

  private async handleExpireVerificationTokens(): Promise<void> {
    this.logger.info('Expiring old verification tokens', { context: 'IdentityCleanupWorker' });
    await this.userRepository.deleteExpiredVerificationTokens();
  }

  private async handlePurgeExpiredSessions(): Promise<void> {
    this.logger.info('Purging expired sessions', { context: 'IdentityCleanupWorker' });
    await this.sessionRepository.deleteExpiredSessions();
  }

  private async handlePurgeLoginAttempts(): Promise<void> {
    this.logger.info('Purging old login attempts', { context: 'IdentityCleanupWorker' });
    // Purge login attempts older than 30 days
    await this.userRepository.deleteOldLoginAttempts(30);
  }

  // ─────────────────────────────────────────────────────────────────
  // Worker lifecycle hooks
  // ─────────────────────────────────────────────────────────────────

  @OnWorkerEvent('active')
  onActive(job: Job): void {
    this.logger.info(`Job "${job.name}/${job.id}" started (attempt ${job.attemptsMade + 1})`, { context: 'IdentityCleanupWorker' });
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.info(`Job "${job.name}/${job.id}" completed`, { context: 'IdentityCleanupWorker' });
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    this.logger.error(
      `Job "${job?.name ?? 'unknown'}/${job?.id ?? '?'}" failed (attempt ${job?.attemptsMade ?? 0}): ${error.message}`,
      { context: 'IdentityCleanupWorker', stack: error.stack },
    );
  }

  @OnWorkerEvent('error')
  onError(error: Error): void {
    this.logger.error(`Worker error: ${error.message}`, { context: 'IdentityCleanupWorker', stack: error.stack });
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string): void {
    this.logger.warn(`Job ${jobId} stalled and will be requeued`, { context: 'IdentityCleanupWorker' });
  }
}

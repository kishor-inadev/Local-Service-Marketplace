import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogService {
  constructor(
    private readonly auditLogRepository: AuditLogRepository,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  async getAuditLogs(
    limit: number = 100,
    offset: number = 0,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    this.logger.log(
      `Fetching audit logs (limit: ${limit}, offset: ${offset})`,
      'AuditLogService',
    );

    const logs = await this.auditLogRepository.getAuditLogs(limit, offset);
    const total = await this.auditLogRepository.getAuditLogCount();

    return { logs, total };
  }

  async getAuditLogsByUserId(userId: string): Promise<AuditLog[]> {
    this.logger.log(
      `Fetching audit logs for user ${userId}`,
      'AuditLogService',
    );

    return this.auditLogRepository.getAuditLogsByUserId(userId);
  }

  async getAuditLogsByEntity(
    entity: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    this.logger.log(
      `Fetching audit logs for entity ${entity}:${entityId}`,
      'AuditLogService',
    );

    return this.auditLogRepository.getAuditLogsByEntity(entity, entityId);
  }

  async createAuditLog(
    userId: string,
    action: string,
    entity: string,
    entityId: string,
    metadata?: any,
  ): Promise<AuditLog> {
    this.logger.log(
      `Creating audit log: ${action} on ${entity}:${entityId}`,
      'AuditLogService',
    );

    return this.auditLogRepository.createAuditLog(
      userId,
      action,
      entity,
      entityId,
      metadata,
    );
  }
}

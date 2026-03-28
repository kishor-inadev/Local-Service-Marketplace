import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { AuditLog } from '../entities/audit-log.entity';
import { AuditLogQueryDto } from "../dto/audit-log-query.dto";
import { resolvePagination, validateDateRange } from "../../common/pagination/list-query-validation.util";

@Injectable()
export class AuditLogService {
	constructor(
		private readonly auditLogRepository: AuditLogRepository,
		@Inject(WINSTON_MODULE_NEST_PROVIDER)
		private readonly logger: LoggerService,
	) {}

	async getAuditLogs(
		queryDto: AuditLogQueryDto,
	): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }> {
		validateDateRange(queryDto.createdFrom, queryDto.createdTo, "createdAt");

		const pagination = resolvePagination(queryDto, { page: 1, limit: 100 });
		this.logger.log(
			`Fetching audit logs (page: ${pagination.page}, limit: ${pagination.limit}, offset: ${pagination.offset})`,
			"AuditLogService",
		);

		const [logs, total] = await Promise.all([
			this.auditLogRepository.findAuditLogs(queryDto, pagination),
			this.auditLogRepository.countAuditLogs(queryDto),
		]);

		return { data: logs, total, page: pagination.page, limit: pagination.limit };
	}

	async getAuditLogsByUserId(userId: string): Promise<AuditLog[]> {
		this.logger.log(`Fetching audit logs for user ${userId}`, "AuditLogService");

		return this.auditLogRepository.getAuditLogsByUserId(userId);
	}

	async getAuditLogsByEntity(entity: string, entityId: string): Promise<AuditLog[]> {
		this.logger.log(`Fetching audit logs for entity ${entity}:${entityId}`, "AuditLogService");

		return this.auditLogRepository.getAuditLogsByEntity(entity, entityId);
	}

	async createAuditLog(
		userId: string,
		action: string,
		entity: string,
		entityId: string,
		metadata?: any,
	): Promise<AuditLog> {
		this.logger.log(`Creating audit log: ${action} on ${entity}:${entityId}`, "AuditLogService");

		return this.auditLogRepository.createAuditLog(userId, action, entity, entityId, metadata);
	}
}

import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DisputeRepository } from '../repositories/dispute.repository';
import { AdminActionRepository } from '../repositories/admin-action.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { Dispute } from '../entities/dispute.entity';
import { NotFoundException, ForbiddenException } from '../../common/exceptions/http.exceptions';
import { DisputeListQueryDto } from "../dto/dispute-list-query.dto";
import { resolvePagination, validateDateRange } from "../../common/pagination/list-query-validation.util";

@Injectable()
export class DisputeService {
	constructor(
		private readonly disputeRepository: DisputeRepository,
		private readonly adminActionRepository: AdminActionRepository,
		private readonly auditLogRepository: AuditLogRepository,
		@Inject(WINSTON_MODULE_NEST_PROVIDER)
		private readonly logger: LoggerService,
	) {}

	async createDispute(jobId: string, openedBy: string, reason: string): Promise<Dispute> {
		this.logger.log(`Creating dispute for job ${jobId} by user ${openedBy}`, 'DisputeService');
		const dispute = await this.disputeRepository.createDispute(jobId, openedBy, reason);
		await this.auditLogRepository.createAuditLog(openedBy, 'create_dispute', 'dispute', dispute.id, { job_id: jobId, reason });
		return dispute;
	}

	async getUserDisputes(
		userId: string,
		params: { status?: string; page: number; limit: number },
	): Promise<{ data: Dispute[]; total: number; page: number; limit: number }> {
		this.logger.log(`Fetching disputes for user ${userId}`, 'DisputeService');
		const result = await this.disputeRepository.getUserDisputes(userId, params);
		return { ...result, page: params.page, limit: params.limit };
	}

	async getDisputeForUser(id: string, userId: string): Promise<Dispute> {
		const dispute = await this.disputeRepository.getDisputeById(id);
		if (!dispute) throw new NotFoundException('Dispute not found');
		// Only allow access to the user who opened the dispute
		if (dispute.opened_by !== userId) {
			throw new ForbiddenException('You do not have access to this dispute');
		}
		return dispute;
	}

	async getAllDisputes(
		queryDto: DisputeListQueryDto,
	): Promise<{ data: Dispute[]; total: number; page: number; limit: number }> {
		validateDateRange(queryDto.createdFrom, queryDto.createdTo, "createdAt");
		const pagination = resolvePagination(queryDto, { page: 1, limit: 50 });

		this.logger.log(
			`Fetching disputes (page: ${pagination.page}, limit: ${pagination.limit}, offset: ${pagination.offset})`,
			"DisputeService",
		);

		const [disputes, total] = await Promise.all([
			this.disputeRepository.findDisputes(queryDto, pagination),
			this.disputeRepository.countDisputes(queryDto),
		]);

		return { data: disputes, total, page: pagination.page, limit: pagination.limit };
	}

	async getDisputeById(id: string): Promise<Dispute> {
		this.logger.log(`Fetching dispute with ID ${id}`, "DisputeService");

		const dispute = await this.disputeRepository.getDisputeById(id);

		if (!dispute) {
			throw new NotFoundException("Dispute not found");
		}

		return dispute;
	}

	async getDisputesByStatus(status: string): Promise<Dispute[]> {
		this.logger.log(`Fetching disputes with status: ${status}`, "DisputeService");

		return this.disputeRepository.getDisputesByStatus(status);
	}

	async getDisputeStats(): Promise<{
		total: number;
		byStatus: { open: number; investigating: number; resolved: number; closed: number };
	}> {
		return this.disputeRepository.getDisputeStats();
	}

	async updateDispute(id: string, adminId: string, status: string, resolution: string): Promise<Dispute> {
		this.logger.log(`Updating dispute ${id} by admin ${adminId}`, "DisputeService");
		const normalizedStatus = status === "in_progress" ? "investigating" : status;

		// Check if dispute exists
		const existingDispute = await this.disputeRepository.getDisputeById(id);
		if (!existingDispute) {
			throw new NotFoundException("Dispute not found");
		}

		// Update dispute
		const updatedDispute = await this.disputeRepository.updateDispute(existingDispute.id, normalizedStatus, resolution, adminId);

		// Log admin action
		await this.adminActionRepository.createAdminAction(
			adminId,
			"resolve_dispute",
			"dispute",
			existingDispute.id,
			`Status: ${normalizedStatus}, Resolution: ${resolution}`,
		);

		// Create audit log
		await this.auditLogRepository.createAuditLog(adminId, "update_dispute", "dispute", id, {
			status: normalizedStatus,
			resolution,
		});

		this.logger.log(`Dispute ${id} updated successfully`, "DisputeService");

		return updatedDispute;
	}
}

import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DisputeRepository } from '../repositories/dispute.repository';
import { AdminActionRepository } from '../repositories/admin-action.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { Dispute } from '../entities/dispute.entity';
import { NotFoundException, ForbiddenException, BadRequestException } from '../../common/exceptions/http.exceptions';
import { DisputeListQueryDto } from "../dto/dispute-list-query.dto";
import { resolvePagination, validateDateRange } from "../../common/pagination/list-query-validation.util";
import { KafkaService } from '../../kafka/kafka.service';
import { NotificationClient } from '../../common/notification/notification.client';
import { UserClient } from '../../common/user/user.client';

// Valid status transitions: current → allowed next statuses
const VALID_TRANSITIONS: Record<string, string[]> = {
	open: ['investigating', 'closed'],
	investigating: ['resolved', 'closed'],
	resolved: ['closed'],
	closed: [],
};

@Injectable()
export class DisputeService {
	private readonly workersEnabled: boolean;

	constructor(
		private readonly disputeRepository: DisputeRepository,
		private readonly adminActionRepository: AdminActionRepository,
		private readonly auditLogRepository: AuditLogRepository,
		private readonly kafkaService: KafkaService,
		private readonly notificationClient: NotificationClient,
		private readonly userClient: UserClient,
		@Inject(WINSTON_MODULE_NEST_PROVIDER)
		private readonly logger: LoggerService,
		@InjectQueue('oversight.notification') private readonly notificationQueue: Queue,
	) {
		this.workersEnabled = process.env.WORKERS_ENABLED === 'true';
	}

	async createDispute(jobId: string, openedBy: string, reason: string): Promise<Dispute> {
		this.logger.log(`Creating dispute for job ${jobId} by user ${openedBy}`, 'DisputeService');

		// Enforce dispute window: if the job is completed, check how long ago
		const completedAt = await this.disputeRepository.getJobCompletedAt(jobId);
		if (completedAt) {
			const windowDaysStr = await this.disputeRepository.getSystemSetting('dispute_window_days', '30');
			const windowDays = parseInt(windowDaysStr, 10) || 30;
			const ageDays = (Date.now() - new Date(completedAt).getTime()) / (1000 * 60 * 60 * 24);
			if (ageDays > windowDays) {
				throw new BadRequestException(
					`Disputes can only be filed within ${windowDays} day${windowDays === 1 ? '' : 's'} of job completion. This job was completed ${Math.floor(ageDays)} day${Math.floor(ageDays) === 1 ? '' : 's'} ago.`,
				);
			}
		}

		const dispute = await this.disputeRepository.createDispute(jobId, openedBy, reason);
		await this.auditLogRepository.createAuditLog(openedBy, 'create_dispute', 'dispute', dispute.id, { job_id: jobId, reason });

		// Notify dispute opener — queue if workers enabled, else inline
		if (this.workersEnabled) {
			this.notificationQueue
				.add('notify-dispute-created', {
					disputeId: dispute.id,
					openedBy,
					jobId,
				})
				.catch((err: any) => {
					this.logger.warn(`Failed to enqueue dispute creation notification: ${err.message}`, 'DisputeService');
				});
		} else {
			this.userClient.getUserEmail(openedBy).then((email) => {
				if (!email) return;
				this.notificationClient.sendEmail({
					to: email,
					template: 'MESSAGE_RECEIVED',
					variables: {
						recipientName: email.split('@')[0],
						senderName: 'LocalServices Support',
						messagePreview: `A dispute #${dispute.id} has been opened for job #${jobId}. Our team will review it shortly.`,
						replyUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/disputes/${dispute.id}`,
					},
				});
			}).catch((err: any) => {
				this.logger.warn(`Failed to send dispute creation email: ${err.message}`, 'DisputeService');
			});
		}

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

		// Validate status transition
		const allowed = VALID_TRANSITIONS[existingDispute.status];
		if (!allowed || !allowed.includes(normalizedStatus)) {
			throw new BadRequestException(
				`Invalid status transition: '${existingDispute.status}' → '${normalizedStatus}'. Allowed: ${(allowed || []).join(', ') || 'none'}`,
			);
		}

		// Require resolution text when resolving or closing
		if ((normalizedStatus === 'resolved' || normalizedStatus === 'closed') && !resolution) {
			throw new BadRequestException('Resolution text is required when resolving or closing a dispute');
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
			previous_status: existingDispute.status,
		});

		// Emit event for cross-service processing (job status sync, refund triggering)
		try {
			await this.kafkaService.emit('dispute-events', {
				event: 'dispute_status_changed',
				dispute_id: existingDispute.id,
				job_id: existingDispute.job_id,
				previous_status: existingDispute.status,
				new_status: normalizedStatus,
				resolution,
				admin_id: adminId,
				timestamp: new Date().toISOString(),
			});
		} catch (err) {
			this.logger.warn(`Failed to emit dispute event for ${id}: ${err.message}`, 'DisputeService');
		}

		// Notify dispute opener about status change — queue if workers enabled, else inline
		if (this.workersEnabled) {
			this.notificationQueue
				.add('notify-dispute-status-changed', {
					disputeId: existingDispute.id,
					openedBy: existingDispute.opened_by,
					newStatus: normalizedStatus,
					resolution,
				})
				.catch((err: any) => {
					this.logger.warn(`Failed to enqueue dispute status notification: ${err.message}`, 'DisputeService');
				});
		} else {
			this.userClient.getUserEmail(existingDispute.opened_by).then((email) => {
				if (!email) return;
				this.notificationClient.sendEmail({
					to: email,
					template: 'MESSAGE_RECEIVED',
					variables: {
						recipientName: email.split('@')[0],
						senderName: 'LocalServices Support',
						messagePreview: `Your dispute #${existingDispute.id} status has been updated to: ${normalizedStatus}. ${resolution ? 'Resolution: ' + resolution : ''}`,
						replyUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/disputes/${existingDispute.id}`,
					},
				});
			}).catch((err: any) => {
				this.logger.warn(`Failed to send dispute status email: ${err.message}`, 'DisputeService');
			});
		}

		this.logger.log(`Dispute ${id} updated successfully`, "DisputeService");

		return updatedDispute;
	}
}

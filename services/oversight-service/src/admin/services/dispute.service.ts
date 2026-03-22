import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DisputeRepository } from '../repositories/dispute.repository';
import { AdminActionRepository } from '../repositories/admin-action.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { Dispute } from '../entities/dispute.entity';
import { NotFoundException } from '../../common/exceptions/http.exceptions';

@Injectable()
export class DisputeService {
  constructor(
    private readonly disputeRepository: DisputeRepository,
    private readonly adminActionRepository: AdminActionRepository,
    private readonly auditLogRepository: AuditLogRepository,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  async getAllDisputes(
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ disputes: Dispute[]; total: number }> {
    this.logger.log(
      `Fetching disputes (limit: ${limit}, offset: ${offset})`,
      'DisputeService',
    );

    const disputes = await this.disputeRepository.getAllDisputes(limit, offset);
    const total = await this.disputeRepository.getDisputeCount();

    return { disputes, total };
  }

  async getDisputeById(id: string): Promise<Dispute> {
    this.logger.log(`Fetching dispute with ID ${id}`, 'DisputeService');

    const dispute = await this.disputeRepository.getDisputeById(id);

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    return dispute;
  }

  async getDisputesByStatus(status: string): Promise<Dispute[]> {
    this.logger.log(`Fetching disputes with status: ${status}`, 'DisputeService');

    return this.disputeRepository.getDisputesByStatus(status);
  }

  async updateDispute(
    id: string,
    adminId: string,
    status: string,
    resolution: string,
  ): Promise<Dispute> {
    this.logger.log(
      `Updating dispute ${id} by admin ${adminId}`,
      'DisputeService',
    );

    // Check if dispute exists
    const existingDispute = await this.disputeRepository.getDisputeById(id);
    if (!existingDispute) {
      throw new NotFoundException('Dispute not found');
    }

    // Update dispute
    const updatedDispute = await this.disputeRepository.updateDispute(
      id,
      status,
      resolution,
      adminId,
    );

    // Log admin action
    await this.adminActionRepository.createAdminAction(
      adminId,
      'resolve_dispute',
      'dispute',
      id,
      `Status: ${status}, Resolution: ${resolution}`,
    );

    // Create audit log
    await this.auditLogRepository.createAuditLog(
      adminId,
      'update_dispute',
      'dispute',
      id,
      { status, resolution },
    );

    this.logger.log(
      `Dispute ${id} updated successfully`,
      'DisputeService',
    );

    return updatedDispute;
  }
}

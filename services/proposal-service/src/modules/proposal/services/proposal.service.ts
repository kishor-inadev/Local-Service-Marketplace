import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ProposalRepository } from '../repositories/proposal.repository';
import { CreateProposalDto } from '../dto/create-proposal.dto';
import { ProposalQueryDto } from '../dto/proposal-query.dto';
import { ProposalResponseDto, PaginatedProposalResponseDto } from '../dto/proposal-response.dto';
import { NotFoundException, BadRequestException, ConflictException } from '../../../common/exceptions/http.exceptions';
import { KafkaService } from '../../../kafka/kafka.service';

@Injectable()
export class ProposalService {
  constructor(
    private readonly proposalRepository: ProposalRepository,
    private readonly kafkaService: KafkaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async createProposal(dto: CreateProposalDto): Promise<ProposalResponseDto> {
    this.logger.log(`Creating proposal for request ${dto.request_id} by provider ${dto.provider_id}`, ProposalService.name);

    // Validate price
    if (dto.price < 0) {
      throw new BadRequestException('Price must be a positive number');
    }

    // Check if provider already submitted a proposal for this request
    const hasExisting = await this.proposalRepository.hasExistingProposal(dto.request_id, dto.provider_id);
    if (hasExisting) {
      throw new ConflictException('Provider has already submitted a proposal for this request');
    }

    const proposal = await this.proposalRepository.createProposal(dto);

    this.logger.log(`Proposal created successfully: ${proposal.id}`, ProposalService.name);

    // Publish event to Kafka if enabled
    await this.kafkaService.publishEvent('proposal-events', {
      eventType: 'proposal_submitted',
      eventId: `${proposal.id}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        proposalId: proposal.id,
        requestId: proposal.request_id,
        providerId: proposal.provider_id,
        price: proposal.price,
        status: proposal.status,
      },
    });

    return ProposalResponseDto.fromEntity(proposal);
  }

  async getProposalsForRequest(requestId: string, limit = 20): Promise<PaginatedProposalResponseDto> {
    this.logger.log(`Fetching proposals for request: ${requestId}`, ProposalService.name);

    const proposals = await this.proposalRepository.getProposalsForRequest(requestId, limit);

    const hasMore = proposals.length > limit;
    const data = proposals.slice(0, limit);
    const nextCursor = hasMore ? data[data.length - 1].id : undefined;

    const response = data.map(ProposalResponseDto.fromEntity);

    return new PaginatedProposalResponseDto(response, nextCursor, hasMore);
  }

  async getProposalById(id: string): Promise<ProposalResponseDto> {
    this.logger.log(`Fetching proposal: ${id}`, ProposalService.name);

    const proposal = await this.proposalRepository.getProposalById(id);

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    return ProposalResponseDto.fromEntity(proposal);
  }

  async acceptProposal(id: string): Promise<ProposalResponseDto> {
    this.logger.log(`Accepting proposal: ${id}`, ProposalService.name);

    // Validate proposal exists
    const existingProposal = await this.proposalRepository.getProposalById(id);
    if (!existingProposal) {
      throw new NotFoundException('Proposal not found');
    }

    // Check if proposal is already accepted or rejected
    if (existingProposal.status !== 'pending') {
      throw new BadRequestException(`Cannot accept proposal with status: ${existingProposal.status}`);
    }

    const proposal = await this.proposalRepository.acceptProposal(id);

    this.logger.log(`Proposal accepted successfully: ${id}`, ProposalService.name);

    // Publish event to Kafka if enabled
    await this.kafkaService.publishEvent('proposal-events', {
      eventType: 'proposal_accepted',
      eventId: `${proposal.id}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        proposalId: proposal.id,
        requestId: proposal.request_id,
        providerId: proposal.provider_id,
        status: proposal.status,
      },
    });

    return ProposalResponseDto.fromEntity(proposal);
  }

  async rejectProposal(id: string): Promise<ProposalResponseDto> {
    this.logger.log(`Rejecting proposal: ${id}`, ProposalService.name);

    // Validate proposal exists
    const existingProposal = await this.proposalRepository.getProposalById(id);
    if (!existingProposal) {
      throw new NotFoundException('Proposal not found');
    }

    // Check if proposal is already accepted or rejected
    if (existingProposal.status !== 'pending') {
      throw new BadRequestException(`Cannot reject proposal with status: ${existingProposal.status}`);
    }

    const proposal = await this.proposalRepository.rejectProposal(id);

    this.logger.log(`Proposal rejected successfully: ${id}`, ProposalService.name);

    // Publish event to Kafka if enabled
    await this.kafkaService.publishEvent('proposal-events', {
      eventType: 'proposal_rejected',
      eventId: `${proposal.id}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        proposalId: proposal.id,
        requestId: proposal.request_id,
        providerId: proposal.provider_id,
        status: proposal.status,
      },
    });

    return ProposalResponseDto.fromEntity(proposal);
  }

  async getProposals(queryDto: ProposalQueryDto): Promise<PaginatedProposalResponseDto> {
    this.logger.log(`Fetching proposals with filters: ${JSON.stringify(queryDto)}`, ProposalService.name);

    const limit = queryDto.limit || 20;
    const proposals = await this.proposalRepository.getProposalsPaginated(queryDto);

    const hasMore = proposals.length > limit;
    const data = proposals.slice(0, limit);
    const nextCursor = hasMore ? data[data.length - 1].id : undefined;

    const response = data.map(ProposalResponseDto.fromEntity);

    return new PaginatedProposalResponseDto(response, nextCursor, hasMore);
  }
}

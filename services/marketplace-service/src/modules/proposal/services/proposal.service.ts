import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ProposalRepository } from '../repositories/proposal.repository';
import { CreateProposalDto } from '../dto/create-proposal.dto';
import { ProposalQueryDto } from '../dto/proposal-query.dto';
import { ProposalResponseDto, PaginatedProposalResponseDto } from '../dto/proposal-response.dto';
import { NotFoundException, BadRequestException, ConflictException } from '../../../common/exceptions/http.exceptions';
import { KafkaService } from '../../../kafka/kafka.service';
import { NotificationClient } from '../../../common/notification/notification.client';
import { UserClient } from '../../../common/user/user.client';

@Injectable()
export class ProposalService {
  constructor(
    private readonly proposalRepository: ProposalRepository,
    private readonly kafkaService: KafkaService,
    private readonly notificationClient: NotificationClient,
    private readonly userClient: UserClient,
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

    // Send notification to customer (proposal received)
    // Fetch customer email from request owner and provider name
    const providerEmail = await this.userClient.getProviderEmail(proposal.provider_id);
    const provider = await this.userClient.getProviderById(proposal.provider_id);
    const providerName = provider?.business_name || 'Service Provider';

    // Note: We need request owner info - for now using placeholder
    // In production, fetch from request-service or pass customer_id in DTO
    const customerEmail = 'customer@example.com'; // TODO: Get from request-service

    if (customerEmail) {
      this.notificationClient.sendEmail({
        to: customerEmail,
        template: 'newRequest',
        variables: {
          providerName,
          serviceName: 'Service Request',
          price: proposal.price,
          message: proposal.message,
          proposalUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/proposals/${proposal.id}`,
        },
      }).catch(err => {
        this.logger.warn(`Failed to send proposal notification: ${err.message}`, ProposalService.name);
      });
    }

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

    // Send notification to provider (proposal accepted)
    const providerEmail = await this.userClient.getProviderEmail(proposal.provider_id);
    const customerName = 'Customer'; // TODO: Get from request-service or pass in DTO

    if (providerEmail) {
      this.notificationClient.sendEmail({
        to: providerEmail,
        template: 'jobAssigned',
        variables: {
          customerName,
          serviceName: 'Service Request',
          price: proposal.price,
          jobUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/jobs/${proposal.id}`,
        },
      }).catch(err => {
        this.logger.warn(`Failed to send acceptance notification: ${err.message}`, ProposalService.name);
      });
    }

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

  async getMyProposals(userId: string): Promise<ProposalResponseDto[]> {
    this.logger.log(`Fetching all proposals for user: ${userId}`, ProposalService.name);

    // Get proposals where user is either customer (request owner) or provider
    const customerProposals = await this.proposalRepository.getProposalsByCustomer(userId);
    const providerProposals = await this.proposalRepository.getProposalsByProviderUser(userId);

    // Combine and sort by created_at
    const allProposals = [...customerProposals, ...providerProposals];
    allProposals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return allProposals.map(ProposalResponseDto.fromEntity);
  }
}

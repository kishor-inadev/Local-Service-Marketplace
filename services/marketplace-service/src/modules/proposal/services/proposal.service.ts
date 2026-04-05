import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ProposalRepository } from '../repositories/proposal.repository';
import { CreateProposalDto } from '../dto/create-proposal.dto';
import { ProposalQueryDto, ProposalSortBy, SortOrder } from "../dto/proposal-query.dto";
import { ProposalResponseDto, PaginatedProposalResponseDto } from '../dto/proposal-response.dto';
import {
	NotFoundException,
	BadRequestException,
	ConflictException,
	ForbiddenException,
} from "../../../common/exceptions/http.exceptions";
import {
	validateCursorMode,
	validateDateRange,
	validateMinMaxRange,
} from "../../../common/pagination/list-query-validation.util";
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
		this.logger.log(
			`Creating proposal for request ${dto.request_id} by provider ${dto.provider_id}`,
			ProposalService.name,
		);

		// Validate price
		if (dto.price < 0) {
			throw new BadRequestException("Price must be a positive number");
		}

		// Check if provider already submitted a proposal for this request
		const hasExisting = await this.proposalRepository.hasExistingProposal(dto.request_id, dto.provider_id);
		if (hasExisting) {
			throw new ConflictException("Provider has already submitted a proposal for this request");
		}

		const proposal = await this.proposalRepository.createProposal(dto);

		this.logger.log(`Proposal created successfully: ${proposal.id}`, ProposalService.name);

		// Send notification to customer (proposal received)
		// Fetch customer email from request owner and provider name
		const providerEmail = await this.userClient.getProviderEmail(proposal.provider_id);
		const provider = await this.userClient.getProviderById(proposal.provider_id);
		const providerName = provider?.business_name || "Service Provider";

		// Fetch the full proposal with customer_id via JOIN, then get customer email
		const fullProposal = await this.proposalRepository.getProposalById(proposal.id);
		const customerEmail = fullProposal?.customer_id
			? await this.userClient.getUserEmail(fullProposal.customer_id)
			: null;

		if (customerEmail) {
			this.notificationClient
				.sendEmail({
					to: customerEmail,
					template: "newRequest",
					variables: {
						providerName,
						serviceName: "Service Request",
						price: proposal.price,
						message: proposal.message,
						proposalUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/proposals/${proposal.id}`,
					},
				})
				.catch((err) => {
					this.logger.warn(`Failed to send proposal notification: ${err.message}`, ProposalService.name);
				});
		}

		// Publish event to Kafka if enabled
		await this.kafkaService.publishEvent("proposal-events", {
			eventType: "proposal_submitted",
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
			throw new NotFoundException("Proposal not found");
		}

		return ProposalResponseDto.fromEntity(proposal);
	}

	async acceptProposal(id: string, userId: string, userRole: string): Promise<ProposalResponseDto> {
		this.logger.log(`Accepting proposal: ${id}`, ProposalService.name);

		// Validate proposal exists
		const existingProposal = await this.proposalRepository.getProposalById(id);
		if (!existingProposal) {
			throw new NotFoundException("Proposal not found");
		}

		// Ownership check: only the customer who owns the request or admin can accept a proposal
		if (userRole !== "admin" && existingProposal.customer_id !== userId) {
			throw new ForbiddenException("Only the request owner can accept a proposal");
		}

		// Check if proposal is already accepted or rejected
		if (existingProposal.status !== "pending") {
			throw new BadRequestException(`Cannot accept proposal with status: ${existingProposal.status}`);
		}

		const proposal = await this.proposalRepository.acceptProposal(id);

		this.logger.log(`Proposal accepted successfully: ${id}`, ProposalService.name);

		// Send notification to provider (proposal accepted)
		const providerEmail = await this.userClient.getProviderEmail(proposal.provider_id);
		const customerUser =
			existingProposal.customer_id ? await this.userClient.getUserById(existingProposal.customer_id) : null;
		const customerName = customerUser?.name || "Customer";

		if (providerEmail) {
			this.notificationClient
				.sendEmail({
					to: providerEmail,
					template: "jobAssigned",
					variables: {
						customerName,
						serviceName: "Service Request",
						price: proposal.price,
						jobUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/jobs/${proposal.id}`,
					},
				})
				.catch((err) => {
					this.logger.warn(`Failed to send acceptance notification: ${err.message}`, ProposalService.name);
				});
		}

		// Publish event to Kafka if enabled
		await this.kafkaService.publishEvent("proposal-events", {
			eventType: "proposal_accepted",
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

	async rejectProposal(id: string, userId: string, userRole: string): Promise<ProposalResponseDto> {
		this.logger.log(`Rejecting proposal: ${id}`, ProposalService.name);

		// Validate proposal exists
		const existingProposal = await this.proposalRepository.getProposalById(id);
		if (!existingProposal) {
			throw new NotFoundException("Proposal not found");
		}

		// Ownership check: only the customer who owns the request or admin can reject a proposal
		if (userRole !== "admin" && existingProposal.customer_id !== userId) {
			throw new ForbiddenException("Only the request owner can reject a proposal");
		}

		// Check if proposal is already accepted or rejected
		if (existingProposal.status !== "pending") {
			throw new BadRequestException(`Cannot reject proposal with status: ${existingProposal.status}`);
		}

		const proposal = await this.proposalRepository.rejectProposal(id);

		this.logger.log(`Proposal rejected successfully: ${id}`, ProposalService.name);

		// Publish event to Kafka if enabled
		await this.kafkaService.publishEvent("proposal-events", {
			eventType: "proposal_rejected",
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

		validateMinMaxRange(queryDto.min_price, queryDto.max_price, "min_price", "max_price");
		validateDateRange(queryDto.created_from, queryDto.created_to, "created_from", "created_to");
		validateCursorMode(
			queryDto.cursor,
			queryDto.page,
			queryDto.sortBy,
			queryDto.sortOrder,
			ProposalSortBy.CREATED_AT,
			SortOrder.DESC,
		);

		const limit = queryDto.limit || 20;

		if (queryDto.cursor) {
			const proposals = await this.proposalRepository.getProposalsPaginated(queryDto);
			const hasMore = proposals.length > limit;
			const data = proposals.slice(0, limit);
			const nextCursor = hasMore ? data[data.length - 1].id : undefined;
			const response = data.map(ProposalResponseDto.fromEntity);
			return new PaginatedProposalResponseDto(response, nextCursor, hasMore, undefined, queryDto.page || 1, limit);
		}

		const [proposals, total] = await Promise.all([
			this.proposalRepository.getProposalsPaginated(queryDto),
			this.proposalRepository.countProposals(queryDto),
		]);

		const response = proposals.map(ProposalResponseDto.fromEntity);
		return new PaginatedProposalResponseDto(response, undefined, false, total, queryDto.page || 1, limit);
	}

	async getMyProposals(userId: string): Promise<{ data: ProposalResponseDto[]; total: number }> {
		this.logger.log(`Fetching all proposals for user: ${userId}`, ProposalService.name);

		// Get proposals where user is either customer (request owner) or provider
		const customerProposals = await this.proposalRepository.getProposalsByCustomer(userId);
		const providerProposals = await this.proposalRepository.getProposalsByProviderUser(userId);

		// Combine and sort by created_at
		const allProposals = [...customerProposals, ...providerProposals];
		const uniqueProposals = Array.from(new Map(allProposals.map((proposal) => [proposal.id, proposal])).values());
		uniqueProposals.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

		const data = uniqueProposals.map(ProposalResponseDto.fromEntity);
		return { data, total: data.length };
	}

	async withdrawProposal(id: string, userId: string): Promise<ProposalResponseDto> {
		this.logger.log(`Withdrawing proposal: ${id}`, ProposalService.name);

		const existingProposal = await this.proposalRepository.getProposalById(id);
		if (!existingProposal) {
			throw new NotFoundException("Proposal not found");
		}

		if (existingProposal.provider_id !== userId) {
			throw new ForbiddenException("Only the provider who submitted this proposal can withdraw it");
		}

		if (existingProposal.status !== "pending") {
			throw new BadRequestException(`Cannot withdraw proposal with status: ${existingProposal.status}`);
		}

		const proposal = await this.proposalRepository.withdrawProposal(id, userId);
		if (!proposal) {
			throw new NotFoundException("Proposal not found");
		}

		this.logger.log(`Proposal withdrawn successfully: ${id}`, ProposalService.name);

		return ProposalResponseDto.fromEntity(proposal);
	}

	async updateProposal(
		id: string,
		userId: string,
		fields: { price?: number; message?: string; estimated_hours?: number },
	): Promise<ProposalResponseDto> {
		this.logger.log(`Updating proposal: ${id}`, ProposalService.name);

		const existingProposal = await this.proposalRepository.getProposalById(id);
		if (!existingProposal) {
			throw new NotFoundException("Proposal not found");
		}

		if (existingProposal.provider_id !== userId) {
			throw new ForbiddenException("Only the provider who submitted this proposal can update it");
		}

		if (existingProposal.status !== "pending") {
			throw new BadRequestException(`Cannot update proposal with status: ${existingProposal.status}`);
		}

		const proposal = await this.proposalRepository.updateProposal(id, userId, fields);
		if (!proposal) {
			throw new NotFoundException("Proposal not found");
		}

		this.logger.log(`Proposal updated successfully: ${id}`, ProposalService.name);

		return ProposalResponseDto.fromEntity(proposal);
	}
}

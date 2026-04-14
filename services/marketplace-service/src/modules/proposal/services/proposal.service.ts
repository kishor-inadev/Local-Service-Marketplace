import { Injectable, Inject, LoggerService } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { ProposalRepository } from "../repositories/proposal.repository";
import { JobRepository } from "../../job/repositories/job.repository";
import { RequestRepository } from "../../request/repositories/request.repository";
import { CreateProposalDto } from "../dto/create-proposal.dto";
import {
  ProposalQueryDto,
  ProposalSortBy,
  SortOrder,
} from "../dto/proposal-query.dto";
import {
  ProposalResponseDto,
  PaginatedProposalResponseDto,
} from "../dto/proposal-response.dto";
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
import { KafkaService } from "../../../kafka/kafka.service";
import { NotificationClient } from "../../../common/notification/notification.client";
import { UserClient } from "../../../common/user/user.client";

@Injectable()
export class ProposalService {
  private readonly workersEnabled = process.env.WORKERS_ENABLED === 'true';

  constructor(
    private readonly proposalRepository: ProposalRepository,
    private readonly jobRepository: JobRepository,
    private readonly requestRepository: RequestRepository,
    private readonly kafkaService: KafkaService,
    private readonly notificationClient: NotificationClient,
    private readonly userClient: UserClient,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectQueue('marketplace.notification') private readonly notificationQueue: Queue,
  ) { }

  async createProposal(dto: CreateProposalDto): Promise<ProposalResponseDto> {
    this.logger.log(
      `Creating proposal for request ${dto.request_id} by provider ${dto.provider_id}`,
      ProposalService.name,
    );

    // Validate price
    if (dto.price < 0) {
      throw new BadRequestException("Price must be a positive number");
    }

    // Validate that the request exists and is still open
    const requestStatus = await this.proposalRepository.getRequestStatus(dto.request_id);
    if (!requestStatus) {
      throw new NotFoundException("Service request not found");
    }
    if (requestStatus !== "open") {
      throw new BadRequestException(
        "Proposals can only be submitted for open service requests",
      );
    }

    // Check if provider already submitted a proposal for this request
    const hasExisting = await this.proposalRepository.hasExistingProposal(
      dto.request_id,
      dto.provider_id,
    );
    if (hasExisting) {
      throw new ConflictException(
        "Provider has already submitted a proposal for this request",
      );
    }

    // Cap total lifetime submissions per (provider, request) to prevent spam re-proposals
    const MAX_PROPOSALS_PER_REQUEST = 3;
    const totalAttempts = await this.proposalRepository.countProposalsByProviderForRequest(
      dto.request_id,
      dto.provider_id,
    );
    if (totalAttempts >= MAX_PROPOSALS_PER_REQUEST) {
      throw new ConflictException(
        `You have reached the maximum number of proposals (${MAX_PROPOSALS_PER_REQUEST}) for this request`,
      );
    }

    // Verify provider is verified and their email is confirmed before allowing proposal submission
    if (this.userClient.isEnabled()) {
      const providerForGate = await this.userClient.getProviderById(dto.provider_id);
      if (providerForGate && providerForGate.verification_status !== 'verified') {
        throw new BadRequestException(
          `Cannot submit proposal: your provider account is not yet verified (status: ${providerForGate.verification_status}). Please wait for admin approval.`,
        );
      }
      if (providerForGate?.user_id) {
        const providerUser = await this.userClient.getUserById(providerForGate.user_id);
        if (providerUser && providerUser.email_verified === false) {
          throw new BadRequestException(
            'Cannot submit proposal: your email address is not verified. Please verify your email first.',
          );
        }
      }
    }

    const proposal = await this.proposalRepository.createProposal(dto);

    this.logger.log(
      `Proposal created successfully: ${proposal.id}`,
      ProposalService.name,
    );

    // Send notification to customer (proposal received)
    // Fetch customer email from request owner and provider name
    const providerEmail = await this.userClient.getProviderEmail(
      proposal.provider_id,
    );
    const provider = await this.userClient.getProviderById(
      proposal.provider_id,
    );
    const providerName = provider?.business_name || "Service Provider";

    // Fetch the full proposal with customer_id via JOIN, then get customer email
    const fullProposal = await this.proposalRepository.getProposalById(
      proposal.id,
    );
    const customerEmail = fullProposal?.customer_id
      ? await this.userClient.getUserEmail(fullProposal.customer_id)
      : null;

    if (customerEmail) {
      if (this.workersEnabled) {
        this.notificationQueue
          .add('notify-proposal-submitted', {
            customerId: fullProposal?.customer_id,
            providerId: proposal.provider_id,
            requestId: proposal.request_id,
            proposalId: proposal.id,
            price: proposal.price,
          })
          .catch((err: any) => {
            this.logger.warn(
              `Failed to enqueue proposal notification: ${err.message}`,
              ProposalService.name,
            );
          });
      } else {
        this.notificationClient.sendEmail({
          to: customerEmail,
          template: 'MARKETPLACE_PROPOSAL_RECEIVED',
          variables: {
            customerName: customerEmail.split('@')[0],
            providerName: 'Service Provider',
            requestTitle: `Request #${proposal.request_id}`,
            price: proposal.price ? `₹${proposal.price}` : 'To be confirmed',
            estimatedDuration: 'To be confirmed',
            proposalDisplayId: proposal.id,
            requestDisplayId: proposal.request_id,
            proposalUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/requests/${proposal.request_id}/proposals/${proposal.id}`,
          },
        }).catch((err: any) => {
          this.logger.warn(
            `Failed to send proposal notification: ${err.message}`,
            ProposalService.name,
          );
        });
      }
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
        customerId: fullProposal?.customer_id,
        price: proposal.price,
        status: proposal.status,
      },
    });

    return ProposalResponseDto.fromEntity(proposal);
  }

  async getProposalsForRequest(
    requestId: string,
    user?: any,
    limit = 20,
  ): Promise<PaginatedProposalResponseDto> {
    this.logger.log(
      `Fetching proposals for request: ${requestId} for user ${user?.userId}`,
      ProposalService.name,
    );

    // RBAC: Only the request owner or user with manage permission can see proposals for a request
    if (user && !user.permissions?.includes('proposals.manage')) {
      const requestOwner = await this.proposalRepository.getRequestOwner(requestId);
      if (requestOwner !== user.userId) {
        throw new ForbiddenException(
          "Only the request owner or an admin can see the proposals for this request",
        );
      }
    }

    const proposals = await this.proposalRepository.getProposalsForRequest(
      requestId,
      limit,
    );

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

  async acceptProposal(
    id: string,
    userId: string,
    userRole: string,
    userPermissions?: string[],
  ): Promise<ProposalResponseDto> {
    this.logger.log(`Accepting proposal: ${id}`, ProposalService.name);

    // Validate proposal exists
    const existingProposal = await this.proposalRepository.getProposalById(id);
    if (!existingProposal) {
      throw new NotFoundException("Proposal not found");
    }

    // Ownership check: only the customer who owns the request or user with manage permission can accept
    if (!userPermissions?.includes('proposals.manage') && existingProposal.customer_id !== userId) {
      throw new ForbiddenException(
        "Only the request owner can accept a proposal",
      );
    }

    // Check if proposal is already accepted or rejected
    if (existingProposal.status !== "pending") {
      throw new BadRequestException(
        `Cannot accept proposal with status: ${existingProposal.status}`,
      );
    }

    // Validate that the parent request is still open (not cancelled/closed by another path)
    const currentRequestStatus = await this.proposalRepository.getRequestStatus(existingProposal.request_id);
    if (currentRequestStatus !== 'open') {
      throw new BadRequestException(
        `Cannot accept proposal: the service request is no longer open (status: ${currentRequestStatus})`,
      );
    }

    // Verify provider is approved before creating a job
    const provider = await this.userClient.getProviderById(existingProposal.provider_id);
    if (provider && provider.verification_status !== 'verified') {
      throw new BadRequestException(
        `Cannot accept proposal: provider is not verified (status: ${provider.verification_status})`,
      );
    }

    const proposal = await this.proposalRepository.acceptProposal(
      existingProposal.id,
    );

    // Reject all other pending proposals on this request so no request has
    // multiple accepted proposals simultaneously (non-blocking, best-effort)
    this.proposalRepository
      .rejectSiblingProposals(existingProposal.request_id, existingProposal.id)
      .catch((err: any) => {
        this.logger.warn(
          `Failed to reject sibling proposals for request ${existingProposal.request_id}: ${err.message}`,
          ProposalService.name,
        );
      });

    // Create job record — this is the central handoff from proposal → job lifecycle
    const job = await this.jobRepository.createJob({
      request_id: existingProposal.request_id,
      provider_id: existingProposal.provider_id,
      customer_id: existingProposal.customer_id,
      proposal_id: existingProposal.id,
    });

    // Transition the service request to 'assigned'
    await this.requestRepository.updateRequest(existingProposal.request_id, {
      status: 'assigned',
    } as any);

    this.logger.log(
      `Job ${job.id} created and request ${existingProposal.request_id} set to assigned`,
      ProposalService.name,
    );

    // Send notification to provider (proposal accepted)
    const providerEmail = await this.userClient.getProviderEmail(
      proposal.provider_id,
    );
    const customerUser = existingProposal.customer_id
      ? await this.userClient.getUserById(existingProposal.customer_id)
      : null;
    const customerName = customerUser?.name || "Customer";

    if (providerEmail) {
      if (this.workersEnabled) {
        this.notificationQueue
          .add('notify-proposal-accepted', {
            providerId: proposal.provider_id,
            requestId: proposal.request_id,
            proposalId: proposal.id,
          })
          .catch((err: any) => {
            this.logger.warn(
              `Failed to enqueue acceptance notification: ${err.message}`,
              ProposalService.name,
            );
          });
      } else {
        this.notificationClient.sendEmail({
          to: providerEmail,
          template: 'MARKETPLACE_JOB_ASSIGNED',
          variables: {
            providerName: providerEmail.split('@')[0],
            requestTitle: `Request #${proposal.request_id}`,
            customerName: customerName,
            price: existingProposal.price ? `₹${existingProposal.price}` : 'Agreed price',
            startDate: new Date().toLocaleDateString('en-IN'),
            jobDisplayId: job.id,
            jobUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/jobs/${job.id}`,
          },
        }).catch((err: any) => {
          this.logger.warn(
            `Failed to send acceptance notification: ${err.message}`,
            ProposalService.name,
          );
        });
      }
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

  async rejectProposal(
    id: string,
    userId: string,
    userRole: string,
    reason?: string,
    userPermissions?: string[],
  ): Promise<ProposalResponseDto> {
    this.logger.log(`Rejecting proposal: ${id}`, ProposalService.name);

    // Validate proposal exists
    const existingProposal = await this.proposalRepository.getProposalById(id);
    if (!existingProposal) {
      throw new NotFoundException("Proposal not found");
    }

    // Ownership check: only the customer who owns the request or user with manage permission can reject
    if (!userPermissions?.includes?.('proposals.manage') && existingProposal.customer_id !== userId) {
      throw new ForbiddenException(
        "Only the request owner can reject a proposal",
      );
    }

    // Check if proposal is already accepted or rejected
    if (existingProposal.status !== "pending") {
      throw new BadRequestException(
        `Cannot reject proposal with status: ${existingProposal.status}`,
      );
    }

    const proposal = await this.proposalRepository.rejectProposal(
      existingProposal.id,
      reason,
    );

    this.logger.log(
      `Proposal rejected successfully: ${id}`,
      ProposalService.name,
    );

    // Notify provider that their proposal was rejected
    const providerEmail = await this.userClient.getProviderEmail(proposal.provider_id).catch(() => null);
    if (providerEmail) {
      const rejectPayload = {
        to: providerEmail,
        template: 'MESSAGE_RECEIVED',
        variables: {
          recipientName: providerEmail.split('@')[0],
          senderName: 'LocalServices',
          messagePreview: `Your proposal for Request #${proposal.request_id} has been declined by the customer.${reason ? ` Reason: ${reason}` : ''}`,
          receivedAt: new Date().toISOString(),
          replyUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/proposals/${proposal.id}`,
        },
      };
      if (this.workersEnabled) {
        this.notificationQueue.add('notify-proposal-rejected', rejectPayload).catch((err: any) => {
          this.logger.warn(`Failed to enqueue rejection notification: ${err.message}`, ProposalService.name);
        });
      } else {
        this.notificationClient.sendEmail(rejectPayload).catch((err: any) => {
          this.logger.warn(`Failed to send rejection notification: ${err.message}`, ProposalService.name);
        });
      }
    }

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

  async getProposals(
    queryDto: ProposalQueryDto,
    user?: any,
  ): Promise<PaginatedProposalResponseDto> {
    this.logger.log(
      `Fetching proposals with filters: ${JSON.stringify(queryDto)} for user ${user?.userId}`,
      ProposalService.name,
    );

    // RBAC: Enforce ownership filtering unless user has manage permission
    if (user && !user.permissions?.includes('proposals.manage')) {
      if (user.role === "customer") {
        queryDto.customer_id = user.userId;
      } else if (user.role === "provider") {
        queryDto.provider_id = user.providerId || user.userId;
      }
    }

    validateMinMaxRange(
      queryDto.min_price,
      queryDto.max_price,
      "min_price",
      "max_price",
    );
    validateDateRange(
      queryDto.created_from,
      queryDto.created_to,
      "created_from",
      "created_to",
    );
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
      const proposals =
        await this.proposalRepository.getProposalsPaginated(queryDto);
      const hasMore = proposals.length > limit;
      const data = proposals.slice(0, limit);
      const nextCursor = hasMore ? data[data.length - 1].id : undefined;
      const response = data.map(ProposalResponseDto.fromEntity);
      return new PaginatedProposalResponseDto(
        response,
        nextCursor,
        hasMore,
        undefined,
        queryDto.page || 1,
        limit,
      );
    }

    const [proposals, total] = await Promise.all([
      this.proposalRepository.getProposalsPaginated(queryDto),
      this.proposalRepository.countProposals(queryDto),
    ]);

    const response = proposals.map(ProposalResponseDto.fromEntity);
    return new PaginatedProposalResponseDto(
      response,
      undefined,
      false,
      total,
      queryDto.page || 1,
      limit,
    );
  }

  async getMyProposals(
    userId: string,
  ): Promise<{ data: ProposalResponseDto[]; total: number }> {
    this.logger.log(
      `Fetching all proposals for user: ${userId}`,
      ProposalService.name,
    );

    // Get proposals where user is either customer (request owner) or provider
    const customerProposals =
      await this.proposalRepository.getProposalsByCustomer(userId);
    const providerProposals =
      await this.proposalRepository.getProposalsByProviderUser(userId);

    // Combine and sort by created_at
    const allProposals = [...customerProposals, ...providerProposals];
    const uniqueProposals = Array.from(
      new Map(allProposals.map((proposal) => [proposal.id, proposal])).values(),
    );
    uniqueProposals.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    const data = uniqueProposals.map(ProposalResponseDto.fromEntity);
    return { data, total: data.length };
  }

  async withdrawProposal(
    id: string,
    userId: string,
    userRole: string = "provider",
    providerId?: string,
    userPermissions?: string[],
  ): Promise<ProposalResponseDto> {
    this.logger.log(`Withdrawing proposal: ${id}`, ProposalService.name);

    const existingProposal = await this.proposalRepository.getProposalById(id);
    if (!existingProposal) {
      throw new NotFoundException("Proposal not found");
    }

    const isOwner = providerId && existingProposal.provider_id === providerId;
    const isAdmin = userPermissions?.includes('proposals.manage');

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        "Only the provider who submitted this proposal or an admin can withdraw it",
      );
    }

    if (existingProposal.status !== "pending") {
      throw new BadRequestException(
        `Cannot withdraw proposal with status: ${existingProposal.status}`,
      );
    }

    const proposal = await this.proposalRepository.withdrawProposal(
      existingProposal.id,
      existingProposal.provider_id,
    );
    if (!proposal) {
      throw new NotFoundException("Proposal not found");
    }

    this.logger.log(
      `Proposal withdrawn successfully: ${id}`,
      ProposalService.name,
    );

    // Notify customer that the provider withdrew the proposal
    const customerEmail = existingProposal.customer_id
      ? await this.userClient.getUserEmail(existingProposal.customer_id).catch(() => null)
      : null;
    if (customerEmail) {
      const withdrawPayload = {
        to: customerEmail,
        template: 'MESSAGE_RECEIVED',
        variables: {
          recipientName: customerEmail.split('@')[0],
          senderName: 'LocalServices',
          messagePreview: `A service provider has withdrawn their proposal for your Request #${existingProposal.request_id}. You may receive other proposals.`,
          receivedAt: new Date().toISOString(),
          replyUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/requests/${existingProposal.request_id}`,
        },
      };
      if (this.workersEnabled) {
        this.notificationQueue.add('notify-proposal-withdrawn', withdrawPayload).catch((err: any) => {
          this.logger.warn(`Failed to enqueue withdrawal notification: ${err.message}`, ProposalService.name);
        });
      } else {
        this.notificationClient.sendEmail(withdrawPayload).catch((err: any) => {
          this.logger.warn(`Failed to send withdrawal notification: ${err.message}`, ProposalService.name);
        });
      }
    }

    // Publish withdrawal event to Kafka
    await this.kafkaService.publishEvent("proposal-events", {
      eventType: "proposal_withdrawn",
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

  async updateProposal(
    id: string,
    userId: string,
    userRole: string,
    fields: { price?: number; message?: string; estimated_hours?: number },
    providerId?: string,
    userPermissions?: string[],
  ): Promise<ProposalResponseDto> {
    this.logger.log(`Updating proposal: ${id}`, ProposalService.name);

    const existingProposal = await this.proposalRepository.getProposalById(id);
    if (!existingProposal) {
      throw new NotFoundException("Proposal not found");
    }

    const isOwner = providerId && existingProposal.provider_id === providerId;
    const isAdmin = userPermissions?.includes?.('proposals.manage');

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        "Only the provider who submitted this proposal or an admin can update it",
      );
    }

    if (existingProposal.status !== "pending") {
      throw new BadRequestException(
        `Cannot update proposal with status: ${existingProposal.status}`,
      );
    }

    const proposal = await this.proposalRepository.updateProposal(
      id,
      existingProposal.provider_id,
      fields,
    );
    if (!proposal) {
      throw new NotFoundException("Proposal not found");
    }

    this.logger.log(
      `Proposal updated successfully: ${id}`,
      ProposalService.name,
    );

    // Notify customer about updated proposal terms
    const customerEmail = existingProposal.customer_id
      ? await this.userClient.getUserEmail(existingProposal.customer_id).catch(() => null)
      : null;
    if (customerEmail) {
      const updatePayload = {
        to: customerEmail,
        template: 'MARKETPLACE_PROPOSAL_RECEIVED',
        variables: {
          customerName: customerEmail.split('@')[0],
          providerName: 'Service Provider',
          requestTitle: `Request #${proposal.request_id}`,
          price: proposal.price ? `₹${proposal.price}` : 'To be confirmed',
          estimatedDuration: 'To be confirmed',
          proposalDisplayId: proposal.id,
          requestDisplayId: proposal.request_id,
          proposalUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/requests/${proposal.request_id}/proposals/${proposal.id}`,
        },
      };
      if (this.workersEnabled) {
        this.notificationQueue.add('notify-proposal-updated', updatePayload).catch((err: any) => {
          this.logger.warn(`Failed to enqueue proposal update notification: ${err.message}`, ProposalService.name);
        });
      } else {
        this.notificationClient.sendEmail(updatePayload).catch((err: any) => {
          this.logger.warn(`Failed to send proposal update notification: ${err.message}`, ProposalService.name);
        });
      }
    }

    return ProposalResponseDto.fromEntity(proposal);
  }

  async deleteProposal(
    id: string,
    userId: string,
    userRole: string,
    providerId?: string,
    userPermissions?: string[],
  ): Promise<void> {
    this.logger.log(`Deleting proposal: ${id}`, ProposalService.name);

    const existingProposal = await this.proposalRepository.getProposalById(id);
    if (!existingProposal) {
      throw new NotFoundException("Proposal not found");
    }

    const isOwner = providerId && existingProposal.provider_id === providerId;
    const isAdmin = userPermissions?.includes?.('proposals.manage');

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        "Only the provider who submitted this proposal or an admin can delete it",
      );
    }

    // Only allow deletion of pending proposals
    if (existingProposal.status !== "pending") {
      throw new BadRequestException(
        "Only pending proposals can be deleted. Use withdraw for other statuses.",
      );
    }

    // Withdraw the proposal (sets status to 'withdrawn')
    await this.proposalRepository.withdrawProposal(
      existingProposal.id,
      existingProposal.provider_id,
    );

    this.logger.log(
      `Proposal deleted successfully: ${id}`,
      ProposalService.name,
    );
  }
}

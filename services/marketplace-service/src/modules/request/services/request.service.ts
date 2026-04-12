import { Injectable, Inject, LoggerService } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { RequestRepository } from "../repositories/request.repository";
import { CategoryRepository } from "../repositories/category.repository";
import { LocationRepository } from "../repositories/location.repository";
import { CreateRequestDto } from "../dto/create-request.dto";
import { UpdateRequestDto } from "../dto/update-request.dto";
import {
  RequestQueryDto,
  RequestSortBy,
  SortOrder,
} from "../dto/request-query.dto";
import {
  RequestResponseDto,
  PaginatedRequestResponseDto,
} from "../dto/request-response.dto";
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "../../../common/exceptions/http.exceptions";
import {
  validateCursorMode,
  validateDateRange,
  validateMinMaxRange,
} from "../../../common/pagination/list-query-validation.util";
import { KafkaService } from "../../../kafka/kafka.service";
import { RedisService } from "../../../redis/redis.service";
import { NotificationClient } from "../../../common/notification/notification.client";
import { UserClient } from "../../../common/user/user.client";

@Injectable()
export class RequestService {
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly workersEnabled = process.env.WORKERS_ENABLED === 'true';

  constructor(
    private readonly requestRepository: RequestRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly locationRepository: LocationRepository,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
    private readonly notificationClient: NotificationClient,
    private readonly userClient: UserClient,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectQueue('marketplace.notification') private readonly notificationQueue: Queue,
  ) { }

  async createRequest(dto: CreateRequestDto): Promise<RequestResponseDto> {
    const userContext = dto.user_id ? `user ${dto.user_id}` : "anonymous user";
    this.logger.log(`Creating request for ${userContext}`, RequestService.name);

    // Validate category exists
    const categoryExists = await this.categoryRepository.categoryExists(
      dto.category_id,
    );
    if (!categoryExists) {
      throw new NotFoundException("Category not found");
    }

    // Validate budget
    if (dto.budget <= 0) {
      throw new BadRequestException("Budget must be a positive number");
    }

    // For anonymous users, validate guest_info is provided
    if (!dto.user_id && (!dto.guest_info || !dto.guest_info.email)) {
      throw new BadRequestException(
        "Guest contact information is required for anonymous requests",
      );
    }

    // Create location if provided
    let location_id: string | undefined;
    if (dto.location) {
      this.logger.log("Creating location for request", RequestService.name);
      const location = await this.locationRepository.createLocation({
        user_id: dto.user_id, // Will be null for anonymous users
        latitude: dto.location.latitude,
        longitude: dto.location.longitude,
        address: dto.location.address,
        city: dto.location.city,
        state: dto.location.state,
        zip_code: dto.location.zipCode,
        country: dto.location.country,
      });
      location_id = location.id;
    }

    const request = await this.requestRepository.createRequest({
      ...dto,
      location_id,
    } as any);

    this.logger.log(
      `Request created successfully: ${request.id}`,
      RequestService.name,
    );

    // Send notification (non-blocking) — queue if workers enabled, else inline
    if (dto.user_id) {
      if (this.workersEnabled) {
        this.notificationQueue
          .add('notify-request-created', {
            userId: request.user_id,
            requestId: request.id,
            description: dto.description,
            budget: request.budget,
          })
          .catch((err: any) => {
            this.logger.warn(
              `Failed to enqueue request creation notification: ${err.message}`,
              RequestService.name,
            );
          });
      } else {
        this.userClient.getUserEmail(request.user_id).then((email) => {
          if (!email) return;
          this.notificationClient.sendEmail({
            to: email,
            template: 'newRequest',
            variables: {
              serviceName: dto.description?.substring(0, 50) || 'Service Request',
              requestId: request.id,
              budget: request.budget,
              requestUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/requests/${request.id}`,
            },
          });
        }).catch((err: any) => {
          this.logger.warn(
            `Failed to send request creation notification: ${err.message}`,
            RequestService.name,
          );
        });
      }
    } else if (dto.guest_info?.email) {
      if (this.workersEnabled) {
        this.notificationQueue
          .add('notify-request-created', {
            guestEmail: dto.guest_info.email,
            requestId: request.id,
            description: dto.description,
            budget: request.budget,
          })
          .catch((err: any) => {
            this.logger.warn(
              `Failed to enqueue guest request creation notification: ${err.message}`,
              RequestService.name,
            );
          });
      } else {
        this.notificationClient.sendEmail({
          to: dto.guest_info.email,
          template: 'newRequest',
          variables: {
            serviceName: dto.description?.substring(0, 50) || 'Service Request',
            requestId: request.id,
            budget: request.budget,
            requestUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/requests/${request.id}`,
          },
        }).catch((err: any) => {
          this.logger.warn(
            `Failed to send guest request creation notification: ${err.message}`,
            RequestService.name,
          );
        });
      }
    }

    // Publish event to Kafka if enabled
    await this.kafkaService.publishEvent("request-events", {
      eventType: "request_created",
      eventId: `${request.id}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        requestId: request.id,
        userId: request.user_id || null,
        isAnonymous: !dto.user_id,
        categoryId: request.category_id,
        budget: request.budget,
        status: request.status,
      },
    });

    return RequestResponseDto.fromEntity(request);
  }

  async getRequests(
    queryDto: RequestQueryDto,
    user?: any,
  ): Promise<PaginatedRequestResponseDto> {
    this.logger.log(
      `Fetching requests with filters: ${JSON.stringify(queryDto)} for user ${user?.userId} (${user?.role})`,
      RequestService.name,
    );

    // RBAC: Users without browse permission can ONLY see their own requests
    const isAuthenticated = user && user.userId && user.userId !== 'anonymous';
    if (isAuthenticated && !user.permissions?.includes('requests.browse') && !user.permissions?.includes('requests.manage')) {
      this.logger.log(`Enforcing own-requests-only filter for user ${user.userId}`, RequestService.name);
      queryDto.user_id = user.userId;
    }

    validateMinMaxRange(
      queryDto.min_budget,
      queryDto.max_budget,
      "min_budget",
      "max_budget",
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
      RequestSortBy.CREATED_AT,
      SortOrder.DESC,
    );

    const limit = queryDto.limit || 20;

    if (queryDto.cursor) {
      const requests =
        await this.requestRepository.getRequestsPaginated(queryDto);
      const hasMore = requests.length > limit;
      const data = requests.slice(0, limit);
      const nextCursor = hasMore ? data[data.length - 1].id : undefined;
      const response = data.map(RequestResponseDto.fromEntity);
      return new PaginatedRequestResponseDto(
        response,
        nextCursor,
        hasMore,
        undefined,
        queryDto.page || 1,
        limit,
      );
    }

    const [requests, total] = await Promise.all([
      this.requestRepository.getRequestsPaginated(queryDto),
      this.requestRepository.countRequests(queryDto),
    ]);

    const response = requests.map(RequestResponseDto.fromEntity);
    return new PaginatedRequestResponseDto(
      response,
      undefined,
      false,
      total,
      queryDto.page || 1,
      limit,
    );
  }

  async getRequestById(id: string): Promise<RequestResponseDto> {
    this.logger.log(`Fetching request: ${id}`, RequestService.name);

    // Try cache first
    if (this.redisService.isCacheEnabled()) {
      const cacheKey = `request:${id}`;
      const cached = await this.redisService.get(cacheKey);

      if (cached) {
        this.logger.log(`Cache hit for request: ${id}`, RequestService.name);
        return JSON.parse(cached);
      }
    }

    const request = await this.requestRepository.getRequestById(id);

    if (!request) {
      throw new NotFoundException("Request not found");
    }

    const response = RequestResponseDto.fromEntity(request);

    // Cache the result
    if (this.redisService.isCacheEnabled()) {
      const cacheKey = `request:${id}`;
      await this.redisService.set(
        cacheKey,
        JSON.stringify(response),
        this.CACHE_TTL,
      );
    }

    return response;
  }

  async updateRequest(
    id: string,
    dto: UpdateRequestDto,
    userId: string,
  ): Promise<RequestResponseDto> {
    this.logger.log(`Updating request: ${id}`, RequestService.name);

    // Validate request exists
    const existingRequest = await this.requestRepository.getRequestById(id);
    if (!existingRequest) {
      throw new NotFoundException("Request not found");
    }

    // Ownership check — only the owner may update their request
    if (existingRequest.user_id !== userId) {
      throw new ForbiddenException(
        "You are not allowed to update this request",
      );
    }

    // Validate category if provided
    if (dto.category_id) {
      const categoryExists = await this.categoryRepository.categoryExists(
        dto.category_id,
      );
      if (!categoryExists) {
        throw new NotFoundException("Category not found");
      }
    }

    // Validate budget if provided
    if (dto.budget !== undefined && dto.budget < 0) {
      throw new BadRequestException("Budget must be a positive number");
    }

    const updatedRequest = await this.requestRepository.updateRequest(
      existingRequest.id,
      dto,
    );

    this.logger.log(`Request updated successfully: ${id}`, RequestService.name);

    // Send notification to user about update
    const userEmail = await this.userClient.getUserEmail(
      updatedRequest.user_id,
    );
    if (userEmail && dto.status) {
      this.notificationClient
        .sendEmail({
          to: userEmail,
          template: "newRequest",
          variables: {
            serviceName: "Request Update",
            message: `Your request has been updated. Status: ${dto.status}`,
            requestUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/requests/${id}`,
          },
        })
        .catch((err: any) => {
          this.logger.warn(
            `Failed to send request update notification: ${err.message}`,
            RequestService.name,
          );
        });
    }

    // Invalidate cache
    if (this.redisService.isCacheEnabled()) {
      await this.redisService.del(`request:${existingRequest.id}`);
    }

    // Publish event to Kafka if enabled
    await this.kafkaService.publishEvent("request-events", {
      eventType: "request_updated",
      eventId: `${updatedRequest.id}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        requestId: updatedRequest.id,
        userId: updatedRequest.user_id,
        status: updatedRequest.status,
        changes: dto,
      },
    });

    return RequestResponseDto.fromEntity(updatedRequest);
  }

  async cancelRequest(id: string, userId: string): Promise<void> {
    this.logger.log(`Cancelling request: ${id}`, RequestService.name);

    const request = await this.requestRepository.getRequestById(id);
    if (!request) {
      throw new NotFoundException("Request not found");
    }

    if (request.user_id !== userId) {
      throw new ForbiddenException("You are not allowed to cancel this request");
    }

    if (request.status !== "open") {
      throw new BadRequestException(
        `Cannot cancel request with status '${request.status}'. Only open requests can be cancelled.`,
      );
    }

    await this.requestRepository.updateRequest(request.id, { status: "cancelled" } as any);

    this.logger.log(`Request cancelled: ${id}`, RequestService.name);

    // Notify customer of cancellation — queue if workers enabled, else inline
    if (this.workersEnabled) {
      this.notificationQueue
        .add('notify-request-cancelled', {
          userId: request.user_id,
          requestId: request.id,
        })
        .catch((err: any) => {
          this.logger.warn(
            `Failed to enqueue request cancellation notification: ${err.message}`,
            RequestService.name,
          );
        });
    } else {
      this.userClient.getUserEmail(request.user_id).then((email) => {
        if (!email) return;
        this.notificationClient.sendEmail({
          to: email,
          template: 'requestCancelled',
          variables: {
            requestId: request.id,
            requestUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/requests/${request.id}`,
          },
        });
      }).catch((err: any) => {
        this.logger.warn(
          `Failed to send request cancellation email: ${err.message}`,
          RequestService.name,
        );
      });
    }

    await this.kafkaService.publishEvent("request-events", {
      eventType: "request_cancelled",
      eventId: `${request.id}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        requestId: request.id,
        userId: request.user_id,
        status: "cancelled",
      },
    });
  }

  async deleteRequest(id: string): Promise<void> {
    this.logger.log(`Deleting request: ${id}`, RequestService.name);

    const request = await this.requestRepository.getRequestById(id);
    if (!request) {
      throw new NotFoundException("Request not found");
    }

    await this.requestRepository.deleteRequest(request.id);

    this.logger.log(`Request deleted successfully: ${id}`, RequestService.name);
  }

  async getRequestsByUser(
    userId: string,
  ): Promise<{ data: RequestResponseDto[]; total: number }> {
    this.logger.log(
      `Fetching requests for user: ${userId}`,
      RequestService.name,
    );

    const requests = await this.requestRepository.getRequestsByUser(userId);
    const data = requests.map(RequestResponseDto.fromEntity);

    return { data, total: data.length };
  }

  async getRequestStats(): Promise<{
    total: number;
    byStatus: {
      open: number;
      assigned: number;
      completed: number;
      cancelled: number;
    };
  }> {
    this.logger.log(`Fetching request stats`, RequestService.name);
    return this.requestRepository.getRequestStats();
  }
}

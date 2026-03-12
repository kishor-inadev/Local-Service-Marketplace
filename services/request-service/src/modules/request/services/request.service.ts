import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { RequestRepository } from '../repositories/request.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { CreateRequestDto } from '../dto/create-request.dto';
import { UpdateRequestDto } from '../dto/update-request.dto';
import { RequestQueryDto } from '../dto/request-query.dto';
import { RequestResponseDto, PaginatedRequestResponseDto } from '../dto/request-response.dto';
import { NotFoundException, BadRequestException } from '../../../common/exceptions/http.exceptions';
import { KafkaService } from '../../../kafka/kafka.service';
import { RedisService } from '../../../redis/redis.service';

@Injectable()
export class RequestService {
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private readonly requestRepository: RequestRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async createRequest(dto: CreateRequestDto): Promise<RequestResponseDto> {
    this.logger.log(`Creating request for user ${dto.user_id}`, RequestService.name);

    // Validate category exists
    const categoryExists = await this.categoryRepository.categoryExists(dto.category_id);
    if (!categoryExists) {
      throw new NotFoundException('Category not found');
    }

    // Validate budget
    if (dto.budget < 0) {
      throw new BadRequestException('Budget must be a positive number');
    }

    const request = await this.requestRepository.createRequest(dto);

    this.logger.log(`Request created successfully: ${request.id}`, RequestService.name);

    // Publish event to Kafka if enabled
    await this.kafkaService.publishEvent('request-events', {
      eventType: 'request_created',
      eventId: `${request.id}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        requestId: request.id,
        userId: request.user_id,
        categoryId: request.category_id,
        budget: request.budget,
        status: request.status,
      },
    });

    return RequestResponseDto.fromEntity(request);
  }

  async getRequests(queryDto: RequestQueryDto): Promise<PaginatedRequestResponseDto> {
    this.logger.log(`Fetching requests with filters: ${JSON.stringify(queryDto)}`, RequestService.name);

    const limit = queryDto.limit || 20;
    const requests = await this.requestRepository.getRequestsPaginated(queryDto);

    const hasMore = requests.length > limit;
    const data = requests.slice(0, limit);
    const nextCursor = hasMore ? data[data.length - 1].id : undefined;

    const response = data.map(RequestResponseDto.fromEntity);

    return new PaginatedRequestResponseDto(response, nextCursor, hasMore);
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
      throw new NotFoundException('Request not found');
    }

    const response = RequestResponseDto.fromEntity(request);

    // Cache the result
    if (this.redisService.isCacheEnabled()) {
      const cacheKey = `request:${id}`;
      await this.redisService.set(cacheKey, JSON.stringify(response), this.CACHE_TTL);
    }

    return response;
  }

  async updateRequest(id: string, dto: UpdateRequestDto): Promise<RequestResponseDto> {
    this.logger.log(`Updating request: ${id}`, RequestService.name);

    // Validate request exists
    const existingRequest = await this.requestRepository.getRequestById(id);
    if (!existingRequest) {
      throw new NotFoundException('Request not found');
    }

    // Validate category if provided
    if (dto.category_id) {
      const categoryExists = await this.categoryRepository.categoryExists(dto.category_id);
      if (!categoryExists) {
        throw new NotFoundException('Category not found');
      }
    }

    // Validate budget if provided
    if (dto.budget !== undefined && dto.budget < 0) {
      throw new BadRequestException('Budget must be a positive number');
    }

    const updatedRequest = await this.requestRepository.updateRequest(id, dto);

    this.logger.log(`Request updated successfully: ${id}`, RequestService.name);

    // Invalidate cache
    if (this.redisService.isCacheEnabled()) {
      await this.redisService.del(`request:${id}`);
    }

    // Publish event to Kafka if enabled
    await this.kafkaService.publishEvent('request-events', {
      eventType: 'request_updated',
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

  async deleteRequest(id: string): Promise<void> {
    this.logger.log(`Deleting request: ${id}`, RequestService.name);

    const request = await this.requestRepository.getRequestById(id);
    if (!request) {
      throw new NotFoundException('Request not found');
    }

    await this.requestRepository.deleteRequest(id);

    this.logger.log(`Request deleted successfully: ${id}`, RequestService.name);
  }

  async getRequestsByUser(userId: string): Promise<RequestResponseDto[]> {
    this.logger.log(`Fetching requests for user: ${userId}`, RequestService.name);

    const requests = await this.requestRepository.getRequestsByUser(userId);

    return requests.map(RequestResponseDto.fromEntity);
  }
}

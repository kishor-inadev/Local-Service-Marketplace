import { Controller, Post, Get, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { RequestService } from '../services/request.service';
import { CreateRequestDto } from '../dto/create-request.dto';
import { UpdateRequestDto } from '../dto/update-request.dto';
import { RequestQueryDto } from '../dto/request-query.dto';
import { RequestResponseDto, PaginatedRequestResponseDto } from '../dto/request-response.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('requests')
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRequest(@Body() createRequestDto: CreateRequestDto): Promise<RequestResponseDto> {
    return this.requestService.createRequest(createRequestDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getRequests(@Query() queryDto: RequestQueryDto): Promise<PaginatedRequestResponseDto> {
    return this.requestService.getRequests(queryDto);
  }

  @Get('my')
  @HttpCode(HttpStatus.OK)
  async getMyRequests(@Query('user_id', ParseUUIDPipe) userId: string): Promise<RequestResponseDto[]> {
    if (!userId) {
      throw new Error('User ID is required');
    }
    return this.requestService.getRequestsByUser(userId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getRequestById(@Param('id') id: string): Promise<RequestResponseDto> {
    return this.requestService.getRequestById(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updateRequest(
    @Param('id') id: string,
    @Body() updateRequestDto: UpdateRequestDto,
  ): Promise<RequestResponseDto> {
    return this.requestService.updateRequest(id, updateRequestDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRequest(@Param('id') id: string): Promise<void> {
    return this.requestService.deleteRequest(id);
  }

  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  async getRequestsByUser(@Param('userId', ParseUUIDPipe) userId: string): Promise<RequestResponseDto[]> {
    return this.requestService.getRequestsByUser(userId);
  }
}

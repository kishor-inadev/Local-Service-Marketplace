import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ProviderService } from '../services/provider.service';
import { CreateProviderDto } from '../dto/create-provider.dto';
import { UpdateProviderDto } from '../dto/update-provider.dto';
import { UpdateProviderServicesDto } from '../dto/update-provider-services.dto';
import { UpdateProviderAvailabilityDto } from '../dto/update-provider-availability.dto';
import { ProviderQueryDto } from '../dto/provider-query.dto';
import { ProviderResponseDto } from '../dto/provider-response.dto';
import { PaginatedResponseDto } from '../dto/paginated-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('providers')
export class ProviderController {
  constructor(
    private readonly providerService: ProviderService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createProvider(
    @Body() createProviderDto: CreateProviderDto,
  ): Promise<ProviderResponseDto> {
    this.logger.info('POST /providers', {
      context: 'ProviderController',
      user_id: createProviderDto.user_id,
    });
    return this.providerService.createProvider(createProviderDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getProvider(@Param('id') id: string): Promise<ProviderResponseDto> {
    this.logger.info('GET /providers/:id', {
      context: 'ProviderController',
      provider_id: id,
    });
    return this.providerService.getProvider(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getProviders(
    @Query() queryDto: ProviderQueryDto,
  ): Promise<PaginatedResponseDto<ProviderResponseDto>> {
    this.logger.info('GET /providers', {
      context: 'ProviderController',
      query: queryDto,
    });
    return this.providerService.getProviders(queryDto);
  }

  @Roles('provider', 'admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updateProvider(
    @Param('id') id: string,
    @Body() updateProviderDto: UpdateProviderDto,
  ): Promise<ProviderResponseDto> {
    this.logger.info('PATCH /providers/:id', {
      context: 'ProviderController',
      provider_id: id,
    });
    return this.providerService.updateProvider(id, updateProviderDto);
  }

  @Roles('provider', 'admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProvider(@Param('id') id: string): Promise<void> {
    this.logger.info('DELETE /providers/:id', {
      context: 'ProviderController',
      provider_id: id,
    });
    return this.providerService.deleteProvider(id);
  }

  /**
   * Update provider service categories
   * PATCH /providers/:id/services
   */
  @Roles('provider', 'admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/services')
  @HttpCode(HttpStatus.OK)
  async updateProviderServices(
    @Param('id') id: string,
    @Body() dto: UpdateProviderServicesDto,
  ): Promise<ProviderResponseDto> {
    this.logger.info('PATCH /providers/:id/services', {
      context: 'ProviderController',
      provider_id: id,
      service_count: dto.service_categories.length,
    });

    // Use the existing updateProvider method with only service_categories
    return this.providerService.updateProvider(id, {
      service_categories: dto.service_categories,
    });
  }

  /**
   * Update provider availability schedule
   * PATCH /providers/:id/availability
   */
  @Patch(':id/availability')
  @HttpCode(HttpStatus.OK)
  async updateProviderAvailability(
    @Param('id') id: string,
    @Body() dto: UpdateProviderAvailabilityDto,
  ): Promise<ProviderResponseDto> {
    this.logger.info('PATCH /providers/:id/availability', {
      context: 'ProviderController',
      provider_id: id,
      slot_count: dto.availability.length,
    });

    // Use the existing updateProvider method with only availability
    return this.providerService.updateProvider(id, {
      availability: dto.availability,
    });
  }
}

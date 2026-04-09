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
  Req,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { FlexibleIdPipe } from "../../../common/pipes/flexible-id.pipe";
import { StrictUuidPipe } from "../../../common/pipes/strict-uuid.pipe";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";
import { ProviderService } from "../services/provider.service";
import { CreateProviderDto } from "../dto/create-provider.dto";
import { UpdateProviderDto } from "../dto/update-provider.dto";
import { UpdateProviderServicesDto } from "../dto/update-provider-services.dto";
import { UpdateProviderAvailabilityDto } from "../dto/update-provider-availability.dto";
import { AddProviderServiceDto } from "../dto/add-provider-service.dto";
import { ProviderQueryDto } from "../dto/provider-query.dto";
import { ProviderResponseDto } from "../dto/provider-response.dto";
import { PaginatedResponseDto } from "../dto/paginated-response.dto";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { FileServiceClient } from "../../../common/file-service.client";

@Controller("providers")
export class ProviderController {
  constructor(
    private readonly providerService: ProviderService,
    private readonly fileServiceClient: FileServiceClient,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createProvider(
    @Body() createProviderDto: CreateProviderDto,
    @Req() req: any,
  ): Promise<ProviderResponseDto> {
    createProviderDto.user_id = req.user.userId;
    this.logger.info("POST /providers", {
      context: "ProviderController",
      user_id: createProviderDto.user_id,
    });
    return this.providerService.createProvider(createProviderDto);
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  async getProvider(
    @Param("id", FlexibleIdPipe) id: string,
  ): Promise<ProviderResponseDto> {
    this.logger.info("GET /providers/:id", {
      context: "ProviderController",
      provider_id: id,
    });
    return this.providerService.getProvider(id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getProviders(
    @Query() queryDto: ProviderQueryDto,
  ): Promise<PaginatedResponseDto<ProviderResponseDto>> {
    this.logger.info("GET /providers", {
      context: "ProviderController",
      query: queryDto,
    });
    return this.providerService.getProviders(queryDto);
  }

  @Roles("provider", "admin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  async updateProvider(
    @Param("id", StrictUuidPipe) id: string,
    @Body() updateProviderDto: UpdateProviderDto,
  ): Promise<ProviderResponseDto> {
    this.logger.info("PATCH /providers/:id", {
      context: "ProviderController",
      provider_id: id,
    });
    return this.providerService.updateProvider(id, updateProviderDto);
  }

  /**
   * Upload profile picture for provider
   * POST /providers/:id/profile-picture
   */
  @Roles("provider", "admin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(":id/profile-picture")
  @UseInterceptors(FileInterceptor("file"))
  @HttpCode(HttpStatus.OK)
  async uploadProviderProfilePicture(
    @Param("id", StrictUuidPipe) id: string,
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException("Profile picture file is required");
    }

    this.logger.info("POST /providers/:id/profile-picture", {
      context: "ProviderController",
      provider_id: id,
      filename: file.originalname,
      filesize: file.size,
    });

    const userId = req.user.userId;
    const userRole = req.user.role || "provider";

    // Upload file to external file service
    const uploadedFile = await this.fileServiceClient.uploadFile(
      file,
      {
        category: "profile-picture",
        description: "Provider profile picture",
        visibility: "public",
        linkedEntityType: "provider",
        linkedEntityId: id,
        tags: ["provider", "profile", "avatar"],
      },
      userId,
      userRole,
    );

    // Update provider profile with file URL
    const updatedProvider = await this.providerService.updateProvider(id, {
      profile_picture_url: uploadedFile.url,
    });

    return {
      success: true,
      data: {
        provider: updatedProvider,
        file: uploadedFile,
      },
      message: "Provider profile picture uploaded successfully",
    };
  }

  @Roles("provider", "admin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProvider(@Param("id", StrictUuidPipe) id: string): Promise<void> {
    this.logger.info("DELETE /providers/:id", {
      context: "ProviderController",
      provider_id: id,
    });
    return this.providerService.deleteProvider(id);
  }

  /**
   * Update provider service categories
   * PATCH /providers/:id/services
   */
  @Roles("provider", "admin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(":id/services")
  @HttpCode(HttpStatus.OK)
  async updateProviderServices(
    @Param("id", StrictUuidPipe) id: string,
    @Body() dto: UpdateProviderServicesDto,
  ): Promise<ProviderResponseDto> {
    this.logger.info("PATCH /providers/:id/services", {
      context: "ProviderController",
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
  @Patch(":id/availability")
  @HttpCode(HttpStatus.OK)
  async updateProviderAvailability(
    @Param("id", StrictUuidPipe) id: string,
    @Body() dto: UpdateProviderAvailabilityDto,
  ): Promise<ProviderResponseDto> {
    this.logger.info("PATCH /providers/:id/availability", {
      context: "ProviderController",
      provider_id: id,
      slot_count: dto.availability.length,
    });

    // Use the existing updateProvider method with only availability
    return this.providerService.updateProvider(id, {
      availability: dto.availability,
    });
  }
  /**
   * Get isolated provider services
   * GET /providers/:id/services
   */
  @Get(":id/services")
  @HttpCode(HttpStatus.OK)
  async getProviderServices(
    @Param("id", StrictUuidPipe) id: string,
  ): Promise<any[]> {
    this.logger.info("GET /providers/:id/services", {
      context: "ProviderController",
      provider_id: id,
    });
    return this.providerService.getProviderServices(id);
  }

  /**
   * Add a single provider service category
   * POST /providers/:id/services
   */
  @Roles("provider", "admin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(":id/services")
  @HttpCode(HttpStatus.CREATED)
  async addProviderService(
    @Param("id", StrictUuidPipe) id: string,
    @Body() dto: AddProviderServiceDto,
  ): Promise<any> {
    this.logger.info("POST /providers/:id/services", {
      context: "ProviderController",
      provider_id: id,
      category_id: dto.category_id,
    });
    return this.providerService.addProviderService(id, dto.category_id);
  }

  /**
   * Remove a single provider service category
   * DELETE /providers/:id/services/:serviceId
   */
  @Roles("provider", "admin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(":id/services/:serviceId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeProviderService(
    @Param("id", StrictUuidPipe) id: string,
    @Param("serviceId", StrictUuidPipe) serviceId: string,
  ): Promise<void> {
    this.logger.info("DELETE /providers/:id/services/:serviceId", {
      context: "ProviderController",
      provider_id: id,
      service_id: serviceId,
    });
    return this.providerService.removeProviderService(id, serviceId);
  }
}

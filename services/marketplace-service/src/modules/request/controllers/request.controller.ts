import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { FlexibleIdPipe } from "@/common/pipes/flexible-id.pipe";
import { StrictUuidPipe } from "@/common/pipes/strict-uuid.pipe";
import { RequestService } from "../services/request.service";
import { CreateRequestDto } from "../dto/create-request.dto";
import { UpdateRequestDto } from "../dto/update-request.dto";
import { RequestQueryDto } from "../dto/request-query.dto";
import {
  RequestResponseDto,
  PaginatedRequestResponseDto,
} from "../dto/request-response.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { OwnershipGuard } from "@/common/guards/ownership.guard";
import { Roles } from "@/common/decorators/roles.decorator";
import { Ownership } from "@/common/decorators/ownership.decorator";
import { ForbiddenException } from "../../../common/exceptions/http.exceptions";
import { FileServiceClient } from "../../../common/file-service.client";
import "multer";

@Controller("requests")
export class RequestController {
  constructor(
    private readonly requestService: RequestService,
    private readonly fileServiceClient: FileServiceClient,
  ) {}

  // Public — authenticated users supply user_id via JWT context; guests supply guest_info
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRequest(
    @Body() createRequestDto: CreateRequestDto,
    @Req() req: any,
  ): Promise<RequestResponseDto> {
    if (req.user?.role === "provider") {
      throw new ForbiddenException("Providers cannot create service requests");
    }
    if (req.user?.userId) {
      createRequestDto.user_id = req.user.userId;
    }
    return this.requestService.createRequest(createRequestDto);
  }

  // Admin stats endpoint
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Get("stats")
  @HttpCode(HttpStatus.OK)
  async getRequestStats() {
    return this.requestService.getRequestStats();
  }

  // Public — anyone can browse open requests
  @UseGuards(JwtAuthGuard)
  @Get()
  @HttpCode(HttpStatus.OK)
  async getRequests(
    @Query() queryDto: RequestQueryDto,
    @Req() req: any,
  ): Promise<PaginatedRequestResponseDto> {
    return this.requestService.getRequests(queryDto, req.user);
  }

  // Authenticated — fetch only the calling user's requests
  @UseGuards(JwtAuthGuard)
  @Get("my")
  @HttpCode(HttpStatus.OK)
  async getMyRequests(@Req() req: any): Promise<{
    data: RequestResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const result = await this.requestService.getRequestsByUser(req.user.userId);
    return { ...result, page: 1, limit: result.data.length || 1 };
  }

  // Public — anyone can browse a single request
  @UseGuards(JwtAuthGuard)
  @Get(":id")
  @HttpCode(HttpStatus.OK)
  async getRequestById(
    @Param("id", FlexibleIdPipe) id: string,
  ): Promise<RequestResponseDto> {
    return this.requestService.getRequestById(id);
  }

  // Authenticated — owner can upload images for their service request
  @UseGuards(JwtAuthGuard, OwnershipGuard)
  @Ownership({ resourceType: "request", userIdField: "user_id" })
  @Post(":id/images")
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor("files", 10))
  async uploadRequestImages(
    @Param("id", StrictUuidPipe) requestId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      requestId: string;
      uploadedFiles: any[];
    };
  }> {
    if (!files || files.length === 0) {
      throw new BadRequestException("At least one image file is required");
    }

    // Resource already fetched and validated by OwnershipGuard
    const request = req.resource;

    // Upload files to external file service
    const uploadedFiles = await this.fileServiceClient.uploadMultipleFiles(
      files,
      {
        category: "service-request",
        linkedEntityId: requestId,
        linkedEntityType: "request",
      },
      req.user.userId,
      req.user.role
    );

    return {
      success: true,
      message: `${uploadedFiles.length} image(s) uploaded successfully for service request`,
      data: {
        requestId,
        uploadedFiles,
      },
    };
  }

  // Authenticated — owner can update their own request
  @UseGuards(JwtAuthGuard, OwnershipGuard)
  @Ownership({ resourceType: "request", userIdField: "user_id" })
  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  async updateRequest(
    @Param("id", StrictUuidPipe) id: string,
    @Body() updateRequestDto: UpdateRequestDto,
    @Req() req: any,
  ): Promise<RequestResponseDto> {
    // Resource already validated by OwnershipGuard
    return this.requestService.updateRequest(
      id,
      updateRequestDto,
      req.user.userId,
    );
  }

  // Admin only — hard delete
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRequest(@Param("id", StrictUuidPipe) id: string): Promise<void> {
    return this.requestService.deleteRequest(id);
  }

  // Authenticated — admin / internal lookup by user id
  @UseGuards(JwtAuthGuard)
  @Get("user/:userId")
  @HttpCode(HttpStatus.OK)
  async getRequestsByUser(
    @Param("userId", FlexibleIdPipe) userId: string,
    @Req() req: any,
  ): Promise<{
    data: RequestResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    if (req.user.role !== "admin" && req.user.userId !== userId) {
      throw new ForbiddenException("You can only view service requests belonging to your own account");
    }
    const result = await this.requestService.getRequestsByUser(userId);
    return { ...result, page: 1, limit: result.data.length || 1 };
  }
}

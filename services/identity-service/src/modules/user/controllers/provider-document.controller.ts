import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ForbiddenException,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { FlexibleIdPipe } from "../../../common/pipes/flexible-id.pipe";
import { StrictUuidPipe } from "../../../common/pipes/strict-uuid.pipe";
import { FileInterceptor } from "@nestjs/platform-express";
import { ProviderDocumentService } from "../services/provider-document.service";
import { UploadDocumentDto } from "../dto/upload-document.dto";
import { VerifyDocumentDto } from "../dto/verify-document.dto";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionsGuard as RolesGuard, Roles, RequirePermissions } from '@/common/rbac';
import { FileServiceClient } from "../../../common/file-service.client";

@UseGuards(JwtAuthGuard)
@Controller("provider-documents")
export class ProviderDocumentController {
  constructor(
    private readonly documentService: ProviderDocumentService,
    private readonly fileServiceClient: FileServiceClient,
  ) {}

  @RequirePermissions('provider_documents.manage')
  @UseGuards(RolesGuard)
  @Post("upload/:providerId")
  @UseInterceptors(FileInterceptor("file"))
  @HttpCode(HttpStatus.CREATED)
  async uploadDocument(
    @Param("providerId", StrictUuidPipe) providerId: string,
    @Body() dto: UploadDocumentDto,
    @UploadedFile() file: any,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException("Document file is required");
    }

    const userId = req.user.userId;
    const userRole = req.user.role || "user";

    if (!dto.document_name && file) {
      dto.document_name = file.originalname;
    }

    // Upload file to external file service
    const uploadedFile = await this.fileServiceClient.uploadFile(
      file,
      {
        category: "document",
        description: `${dto.document_type} for provider ${providerId}`,
        title: dto.document_name,
        visibility: "private",
        linkedEntityType: "provider_document",
        linkedEntityId: providerId,
        tags: [dto.document_type, "provider-verification"],
      },
      userId,
      userRole,
    );

    // Create document record in database
    const document = await this.documentService.uploadDocument(
      providerId,
      userId,
      dto,
      uploadedFile.id, // Store file ID instead of URL
    );

    return {
      success: true,
      data: {
        ...document,
        file_url: uploadedFile.url, // Return download URL for frontend
      },
      message: "Document uploaded successfully. Pending verification.",
    };
  }

  @RequirePermissions('providers.verify')
  @UseGuards(RolesGuard)
  @Post("verify/:documentId")
  @HttpCode(HttpStatus.OK)
  async verifyDocument(
    @Param("documentId", ParseUUIDPipe) documentId: string,
    @Body() dto: VerifyDocumentDto,
    @Request() req: any,
  ) {
    const document = await this.documentService.verifyDocument(
      documentId,
      req.user.userId,
      dto,
    );

    return {
      success: true,
      data: document,
      message: "Document verified successfully",
    };
  }

  @RequirePermissions('providers.verify')
  @UseGuards(RolesGuard)
  @Post("reject/:documentId")
  @HttpCode(HttpStatus.OK)
  async rejectDocument(
    @Param("documentId", ParseUUIDPipe) documentId: string,
    @Body("reason") reason: string,
    @Request() req: any,
  ) {
    const document = await this.documentService.rejectDocument(
      documentId,
      req.user.userId,
      reason || "Rejected by admin",
    );
    return { success: true, data: document, message: "Document rejected successfully" };
  }

  @RequirePermissions('provider_documents.manage')
  @UseGuards(RolesGuard)
  @Get("provider/:providerId")
  async getProviderDocuments(
    @Param("providerId", FlexibleIdPipe) providerId: string,
    @Request() req: any,
  ) {
    if (!req.user.permissions?.includes('providers.manage') && req.user.providerId !== providerId) {
      throw new ForbiddenException("You can only view your own documents");
    }
    return this.documentService.getProviderDocuments(providerId);
  }

  @RequirePermissions('providers.verify')
  @UseGuards(RolesGuard)
  @Get("pending")
  async getPendingDocuments() {
    return this.documentService.getPendingDocuments();
  }

  @RequirePermissions('providers.verify')
  @UseGuards(RolesGuard)
  @Get("expiring")
  async getExpiringDocuments(@Request() req: any) {
    return this.documentService.getExpiringDocuments(30);
  }

  @Get("verification-status/:providerId")
  async getVerificationStatus(
    @Param("providerId", FlexibleIdPipe) providerId: string,
  ) {
    const status =
      await this.documentService.checkProviderVerificationStatus(providerId);

    return { success: true, data: status };
  }

  @RequirePermissions('provider_documents.manage')
  @UseGuards(RolesGuard)
  @Delete(":documentId")
  async deleteDocument(
    @Param("documentId", ParseUUIDPipe) documentId: string,
    @Request() req: any,
  ) {
    await this.documentService.deleteDocument(documentId, req.user.userId);

    return { success: true, message: "Document deleted successfully" };
  }
}

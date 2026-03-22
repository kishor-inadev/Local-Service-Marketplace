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
  ParseUUIDPipe
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProviderDocumentService } from '../services/provider-document.service';
import { UploadDocumentDto } from '../dto/upload-document.dto';
import { VerifyDocumentDto } from '../dto/verify-document.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('provider-documents')
export class ProviderDocumentController {
  constructor(
    private readonly documentService: ProviderDocumentService
  ) {}

  @Post('upload/:providerId')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('providerId', ParseUUIDPipe) providerId: string,
    @Body() dto: UploadDocumentDto,
    @UploadedFile() file: any,
    @Request() req: any
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // TODO: Upload file to storage (S3 or local)
    // For now, using a placeholder URL
    const fileUrl = `/uploads/documents/${file.filename}`;

    const document = await this.documentService.uploadDocument(
      providerId,
      req.user.id,
      dto,
      fileUrl
    );

    return {
      success: true,
      data: document,
      message: 'Document uploaded successfully. Pending verification.'
    };
  }

  @Post('verify/:documentId')
  async verifyDocument(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() dto: VerifyDocumentDto,
    @Request() req: any
  ) {
    // TODO: Add admin guard
    const document = await this.documentService.verifyDocument(
      documentId,
      req.user.id,
      dto
    );

    return {
      success: true,
      data: document,
      message: 'Document verified successfully'
    };
  }

  @Get('provider/:providerId')
  async getProviderDocuments(
    @Param('providerId', ParseUUIDPipe) providerId: string,
    @Request() req: any
  ) {
    const documents = await this.documentService.getProviderDocuments(providerId);

    return {
      success: true,
      data: documents,
      count: documents.length
    };
  }

  @Get('pending')
  async getPendingDocuments(@Request() req: any) {
    // TODO: Add admin guard
    const documents = await this.documentService.getPendingDocuments();

    return {
      success: true,
      data: documents,
      count: documents.length
    };
  }

  @Get('expiring')
  async getExpiringDocuments(@Request() req: any) {
    // TODO: Add admin guard
    const documents = await this.documentService.getExpiringDocuments(30);

    return {
      success: true,
      data: documents,
      count: documents.length
    };
  }

  @Get('verification-status/:providerId')
  async getVerificationStatus(
    @Param('providerId', ParseUUIDPipe) providerId: string
  ) {
    const status = await this.documentService.checkProviderVerificationStatus(providerId);

    return {
      success: true,
      data: status
    };
  }

  @Delete(':documentId')
  async deleteDocument(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Request() req: any
  ) {
    await this.documentService.deleteDocument(documentId, req.user.id);

    return {
      success: true,
      message: 'Document deleted successfully'
    };
  }
}

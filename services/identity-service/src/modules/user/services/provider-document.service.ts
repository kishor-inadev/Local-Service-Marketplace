import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ProviderDocumentRepository } from '../repositories/provider-document.repository';
import { UploadDocumentDto } from '../dto/upload-document.dto';
import { VerifyDocumentDto } from '../dto/verify-document.dto';
import { ProviderDocument } from '../entities/provider-document.entity';

@Injectable()
export class ProviderDocumentService {
  constructor(
    private readonly documentRepository: ProviderDocumentRepository
  ) {}

  async uploadDocument(
    providerId: string,
    userId: string,
    dto: UploadDocumentDto,
    fileUrl: string
  ): Promise<ProviderDocument> {
    // Verify user owns this provider profile
    // This should call ProviderRepository to verify ownership
    // For now, assuming authorization is handled at controller level

    // Check if document type already exists and is verified
    const existingDocs = await this.documentRepository.findByProvider(providerId);
    const existingDoc = existingDocs.find(doc => doc.document_type === dto.document_type);

    if (existingDoc && existingDoc.verified) {
      throw new BadRequestException(
        `A verified ${dto.document_type} document already exists. Delete the existing one first.`
      );
    }

    // Create document record
    return this.documentRepository.create({
      provider_id: providerId,
      document_type: dto.document_type,
      document_url: fileUrl,
      document_name: dto.document_name,
      document_number: dto.document_number,
      expiry_date: dto.expiry_date
    });
  }

  async verifyDocument(
    documentId: string,
    adminUserId: string,
    dto: VerifyDocumentDto
  ): Promise<ProviderDocument> {
    const document = await this.documentRepository.findById(documentId);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.verified) {
      throw new BadRequestException('Document is already verified');
    }

    return this.documentRepository.verify(documentId, dto.verified, adminUserId);
  }

  async getProviderDocuments(providerId: string): Promise<ProviderDocument[]> {
    return this.documentRepository.findByProvider(providerId);
  }

  async getDocumentById(documentId: string, userId: string): Promise<ProviderDocument> {
    const document = await this.documentRepository.findById(documentId);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Authorization check would go here
    // Verify user owns the provider or is admin

    return document;
  }

  async getPendingDocuments(): Promise<ProviderDocument[]> {
    // Admin only - authorization should be handled at controller level
    return this.documentRepository.getPendingDocuments();
  }

  async getExpiringDocuments(days: number = 30): Promise<ProviderDocument[]> {
    // Admin only - get documents expiring within X days
    return this.documentRepository.getExpiringDocuments(days);
  }

  async deleteDocument(documentId: string, userId: string): Promise<void> {
    const document = await this.documentRepository.findById(documentId);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Only allow deletion of unverified documents
    // Or allow provider to delete and re-upload
    if (document.verified) {
      throw new BadRequestException(
        'Cannot delete verified documents. Contact support if you need to update this document.'
      );
    }

    // Authorization check: verify user owns the provider
    // This would involve checking provider ownership

    await this.documentRepository.delete(documentId);
  }

  async checkProviderVerificationStatus(providerId: string): Promise<{
    fully_verified: boolean;
    pending_documents: number;
    verified_documents: number;
    missing_required_documents: string[];
  }> {
    const documents = await this.documentRepository.findByProvider(providerId);

    const requiredDocumentTypes = [
      'government_id',
      'business_license'
    ];

    const verifiedCount = documents.filter(d => d.verified).length;
    const pendingCount = documents.filter(d => !d.verified).length;

    const uploadedTypes = documents.map(d => d.document_type);
    const missingTypes = requiredDocumentTypes.filter(
      type => !uploadedTypes.includes(type as any)
    );

    const fullyVerified = missingTypes.length === 0 &&
      requiredDocumentTypes.every(type =>
        documents.some(d => d.document_type === type && d.verified)
      );

    return {
      fully_verified: fullyVerified,
      pending_documents: pendingCount,
      verified_documents: verifiedCount,
      missing_required_documents: missingTypes
    };
  }
}

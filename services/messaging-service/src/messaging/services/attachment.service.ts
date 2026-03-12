import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AttachmentRepository } from '../repositories/attachment.repository';
import { Attachment } from '../entities/attachment.entity';
import { NotFoundException } from '../../common/exceptions/http.exceptions';

@Injectable()
export class AttachmentService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
    private readonly attachmentRepository: AttachmentRepository,
  ) {}

  async createAttachment(entityType: string, entityId: string, fileUrl: string): Promise<Attachment> {
    this.logger.log(`Creating attachment for ${entityType} ${entityId}`, 'AttachmentService');
    const attachment = await this.attachmentRepository.createAttachment(entityType, entityId, fileUrl);
    this.logger.log(`Attachment created successfully: ${attachment.id}`, 'AttachmentService');
    return attachment;
  }

  async getAttachmentById(id: string): Promise<Attachment> {
    this.logger.log(`Fetching attachment ${id}`, 'AttachmentService');
    const attachment = await this.attachmentRepository.getAttachmentById(id);
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }
    return attachment;
  }

  async getAttachmentsByEntity(entityType: string, entityId: string): Promise<Attachment[]> {
    this.logger.log(`Fetching attachments for ${entityType} ${entityId}`, 'AttachmentService');
    return this.attachmentRepository.getAttachmentsByEntity(entityType, entityId);
  }

  async deleteAttachment(id: string): Promise<void> {
    this.logger.log(`Deleting attachment ${id}`, 'AttachmentService');
    const attachment = await this.getAttachmentById(id);
    await this.attachmentRepository.deleteAttachment(attachment.id);
    this.logger.log(`Attachment ${id} deleted successfully`, 'AttachmentService');
  }
}

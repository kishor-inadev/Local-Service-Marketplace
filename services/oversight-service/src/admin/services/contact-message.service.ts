import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ContactMessageRepository } from '../repositories/contact-message.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { ContactMessage } from '../entities/contact-message.entity';
import { CreateContactMessageDto } from '../dto/create-contact-message.dto';
import { UpdateContactMessageDto } from '../dto/update-contact-message.dto';
import { ContactMessageListQueryDto } from "../dto/contact-message-list-query.dto";
import { NotFoundException } from '../../common/exceptions/http.exceptions';
import { resolvePagination, validateDateRange } from "../../common/pagination/list-query-validation.util";

@Injectable()
export class ContactMessageService {
	constructor(
		private readonly contactMessageRepository: ContactMessageRepository,
		private readonly auditLogRepository: AuditLogRepository,
		@Inject(WINSTON_MODULE_NEST_PROVIDER)
		private readonly logger: LoggerService,
	) {}

	async createContactMessage(dto: CreateContactMessageDto): Promise<ContactMessage> {
		this.logger.log(`Creating contact message from ${dto.email}`, "ContactMessageService");

		const contactMessage = await this.contactMessageRepository.createContactMessage(dto);

		// Log audit event (system action, no user_id required for contact form submissions)
		await this.auditLogRepository.createAuditLog(
			null,
			"contact_message_created",
			"contact_message",
			contactMessage.id,
			{ name: dto.name, email: dto.email },
		);

		return contactMessage;
	}

	async getAllContactMessages(
		queryDto: ContactMessageListQueryDto,
	): Promise<{ data: ContactMessage[]; total: number; page: number; limit: number }> {
		validateDateRange(queryDto.createdFrom, queryDto.createdTo, "createdAt");
		const pagination = resolvePagination(queryDto, { page: 1, limit: 50 });

		this.logger.log(
			`Fetching contact messages (page: ${pagination.page}, limit: ${pagination.limit}, offset: ${pagination.offset})`,
			"ContactMessageService",
		);

		const [messages, total] = await Promise.all([
			this.contactMessageRepository.findContactMessages(queryDto, pagination),
			this.contactMessageRepository.countContactMessagesByQuery(queryDto),
		]);

		return { data: messages, total, page: pagination.page, limit: pagination.limit };
	}

	async getContactMessageById(id: string): Promise<ContactMessage> {
		this.logger.log(`Fetching contact message with ID ${id}`, "ContactMessageService");

		const message = await this.contactMessageRepository.getContactMessageById(id);

		if (!message) {
			throw new NotFoundException("Contact message not found");
		}

		return message;
	}

	async getContactMessagesByEmail(email: string): Promise<{ data: ContactMessage[]; total: number }> {
		this.logger.log(`Fetching contact messages for email: ${email}`, "ContactMessageService");

		const data = await this.contactMessageRepository.getContactMessagesByEmail(email);
		return { data, total: data.length };
	}

	async getContactMessagesByUserId(userId: string): Promise<{ data: ContactMessage[]; total: number }> {
		this.logger.log(`Fetching contact messages for user: ${userId}`, "ContactMessageService");

		const data = await this.contactMessageRepository.getContactMessagesByUserId(userId);
		return { data, total: data.length };
	}

	async updateContactMessage(id: string, dto: UpdateContactMessageDto, adminId: string): Promise<ContactMessage> {
		this.logger.log(`Updating contact message ${id} by admin ${adminId}`, "ContactMessageService");

		// Check if message exists
		await this.getContactMessageById(id);

		const updatedMessage = await this.contactMessageRepository.updateContactMessage(id, dto);

		// Log audit event
		await this.auditLogRepository.createAuditLog(adminId, "contact_message_updated", "contact_message", id, {
			status: dto.status,
			admin_notes: dto.admin_notes,
		});

		return updatedMessage;
	}

	async deleteContactMessage(id: string, adminId: string): Promise<void> {
		this.logger.log(`Deleting contact message ${id} by admin ${adminId}`, "ContactMessageService");

		// Check if message exists
		const message = await this.getContactMessageById(id);

		await this.contactMessageRepository.deleteContactMessage(id);

		// Log audit event
		await this.auditLogRepository.createAuditLog(adminId, "contact_message_deleted", "contact_message", id, {
			email: message.email,
			subject: message.subject,
		});
	}
}

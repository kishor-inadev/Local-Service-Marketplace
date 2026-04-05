import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { MessageRepository, PaginatedMessages } from '../repositories/message.repository';
import { Message } from '../entities/message.entity';
import { NotFoundException } from '../../common/exceptions/http.exceptions';

@Injectable()
export class MessageService {
	constructor(
		@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
		private readonly messageRepository: MessageRepository,
	) {}

	async createMessage(jobId: string, senderId: string, message: string): Promise<Message> {
		this.logger.log(`Creating message for job ${jobId} from sender ${senderId}`, "MessageService");
		const newMessage = await this.messageRepository.createMessage(jobId, senderId, message);
		this.logger.log(`Message created successfully: ${newMessage.id}`, "MessageService");
		return newMessage;
	}

	async getMessageById(id: string): Promise<Message> {
		this.logger.log(`Fetching message ${id}`, "MessageService");
		const message = await this.messageRepository.getMessageById(id);
		if (!message) {
			throw new NotFoundException("Message not found");
		}
		return message;
	}

	async getMessagesForJob(jobId: string, page: number = 1, limit: number = 20): Promise<PaginatedMessages> {
		this.logger.log(`Fetching messages for job ${jobId} (page ${page}, limit ${limit})`, "MessageService");
		return this.messageRepository.getMessagesForJob(jobId, page, limit);
	}

	async getUserConversations(userId: string): Promise<any[]> {
		this.logger.log(`Fetching conversations for user ${userId}`, "MessageService");
		return this.messageRepository.getUserConversations(userId);
	}

	async markMessageAsRead(id: string): Promise<Message> {
		this.logger.log(`Marking message ${id} as read`, "MessageService");
		const message = await this.messageRepository.getMessageById(id);
		if (!message) {
			throw new NotFoundException("Message not found");
		}
		return this.messageRepository.markAsRead(message.id);
	}

	async deleteMessage(id: string): Promise<void> {
		this.logger.log(`Deleting message ${id}`, "MessageService");
		const message = await this.getMessageById(id);
		await this.messageRepository.deleteMessage(message.id);
		this.logger.log(`Message ${id} deleted successfully`, "MessageService");
	}
}

import { Injectable, Inject, LoggerService } from "@nestjs/common";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import {
  MessageRepository,
  PaginatedMessages,
} from "../repositories/message.repository";
import { Message } from "../entities/message.entity";
import {
  NotFoundException,
  ForbiddenException,
} from "../../common/exceptions/http.exceptions";

@Injectable()
export class MessageService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly messageRepository: MessageRepository,
  ) {}

  async createMessage(
    jobId: string,
    senderId: string,
    message: string,
  ): Promise<Message> {
    this.logger.log(
      `Creating message for job ${jobId} from sender ${senderId}`,
      "MessageService",
    );
    const newMessage = await this.messageRepository.createMessage(
      jobId,
      senderId,
      message,
    );
    this.logger.log(
      `Message created successfully: ${newMessage.id}`,
      "MessageService",
    );
    return newMessage;
  }

  async getMessageById(id: string, requestingUserId?: string): Promise<Message> {
    this.logger.log(`Fetching message ${id}`, "MessageService");
    const message = await this.messageRepository.getMessageById(id);
    if (!message) {
      throw new NotFoundException("Message not found");
    }
    if (requestingUserId) {
      const isParticipant = await this.messageRepository.isJobParticipant(message.job_id, requestingUserId);
      if (!isParticipant) {
        throw new ForbiddenException("You are not authorized to view this message");
      }
    }
    return message;
  }

  async getMessagesForJob(
    jobId: string,
    user: any,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedMessages> {
    this.logger.log(
      `Fetching messages for job ${jobId} for user ${user.userId} (page ${page}, limit ${limit})`,
      "MessageService",
    );

    // RBAC: Verify user is participant or has manage permission
    if (!user.permissions?.includes('messages.manage')) {
      const conversations = await this.messageRepository.getUserConversations(
        user.userId,
      );
      const isParticipant = conversations.some((c) => c.job_id === jobId);

      if (!isParticipant) {
        throw new ForbiddenException(
          "You are not authorized to view messages for this job",
        );
      }
    }

    return this.messageRepository.getMessagesForJob(jobId, page, limit);
  }

  async getUserConversations(userId: string): Promise<any[]> {
    this.logger.log(
      `Fetching conversations for user ${userId}`,
      "MessageService",
    );
    return this.messageRepository.getUserConversations(userId);
  }

  async markMessageAsRead(id: string, userId?: string): Promise<Message> {
    this.logger.log(`Marking message ${id} as read`, "MessageService");
    const message = await this.messageRepository.getMessageById(id);
    if (!message) {
      throw new NotFoundException("Message not found");
    }
    if (userId) {
      const isParticipant = await this.messageRepository.isJobParticipant(message.job_id, userId);
      if (!isParticipant) {
        throw new ForbiddenException("You are not authorized to mark this message as read");
      }
    }
    return this.messageRepository.markAsRead(message.id);
  }
  async updateMessage(id: string, newMessage: string): Promise<Message> {
    this.logger.log(`Updating message ${id}`, "MessageService");
    const message = await this.messageRepository.editMessage(id, newMessage);
    if (!message) {
      throw new NotFoundException("Message not found");
    }
    return message;
  }
  async deleteMessage(id: string): Promise<void> {
    this.logger.log(`Deleting message ${id}`, "MessageService");
    const message = await this.getMessageById(id);
    await this.messageRepository.deleteMessage(message.id);
    this.logger.log(`Message ${id} deleted successfully`, "MessageService");
  }
}

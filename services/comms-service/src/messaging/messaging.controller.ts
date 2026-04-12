import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  Inject,
  LoggerService,
  ParseIntPipe,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { FlexibleIdPipe } from "@/common/pipes/flexible-id.pipe";
import { StrictUuidPipe } from "@/common/pipes/strict-uuid.pipe";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { MessageService } from "./services/message.service";
import { AttachmentService } from "./services/attachment.service";
import { CreateMessageDto } from "./dto/create-message.dto";
import { UpdateMessageDto } from "./dto/update-message.dto";
import { CreateAttachmentDto } from "./dto/create-attachment.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { FileServiceClient } from "../common/file-service.client";
import "multer";

@UseGuards(JwtAuthGuard)
@Controller("messages")
export class MessagingController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly messageService: MessageService,
    private readonly attachmentService: AttachmentService,
    private readonly fileServiceClient: FileServiceClient,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createMessage(
    @Body() createMessageDto: CreateMessageDto,
    @Request() req: any,
  ) {
    this.logger.log("POST /messages - Create message", "MessagingController");
    const item = await this.messageService.createMessage(
      createMessageDto.job_id,
      req.user.userId,
      createMessageDto.message,
    );
    return { success: true, data: item, message: "Message sent successfully" };
  }

  @Get("jobs/:jobId")
  async getMessagesForJob(
    @Param("jobId", FlexibleIdPipe) jobId: string,
    @Request() req: any,
    @Query("page", new ParseIntPipe({ optional: true })) page: number = 1,
    @Query("limit", new ParseIntPipe({ optional: true })) limit: number = 20,
  ) {
    this.logger.log(
      `GET /messages/jobs/${jobId}/messages - Get conversation for user ${req.user.userId}`,
      "MessagingController",
    );
    const result = await this.messageService.getMessagesForJob(
      jobId,
      req.user,
      page,
      limit,
    );
    return result;
  }

  @Get("conversations")
  async getConversations(@Request() req: any) {
    this.logger.log(
      `GET /messages/conversations - Get user conversations`,
      "MessagingController",
    );
    const conversations = await this.messageService.getUserConversations(
      req.user.userId,
    );
    return {
      data: conversations,
      total: conversations.length,
      page: 1,
      limit: conversations.length || 1,
    };
  }

  @Post("attachments")
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor("file"))
  async createAttachment(
    @Body() createAttachmentDto: CreateAttachmentDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    this.logger.log(
      "POST /messages/attachments - Create attachment",
      "MessagingController",
    );

    if (!file) {
      throw new BadRequestException("File is required for attachment upload");
    }

    const userId = req.user.userId;
    const userRole = req.user.role || "user";

    // Upload file to external file service
    const uploadedFile = await this.fileServiceClient.uploadFile(
      file,
      {
        category: "attachment",
        description: `Message attachment for message ${createAttachmentDto.message_id}`,
        visibility: "private",
        linkedEntityType: "message",
        linkedEntityId: createAttachmentDto.message_id,
        tags: ["message", "attachment"],
      },
      userId,
      userRole,
    );

    // Create attachment record in database
    const attachment = await this.attachmentService.createAttachment(
      createAttachmentDto.message_id,
      uploadedFile.url, // Store download URL
      uploadedFile.originalName,
      uploadedFile.size,
      uploadedFile.mimeType,
    );

    return {
      success: true,
      data: {
        ...attachment,
        file: uploadedFile, // Include full file metadata
      },
      message: "Attachment uploaded successfully",
    };
  }

  @Get("attachments/message/:messageId")
  async getAttachmentsByMessage(
    @Param("messageId", FlexibleIdPipe) messageId: string,
  ) {
    this.logger.log(
      `GET /messages/attachments/message/${messageId} - Get attachments`,
      "MessagingController",
    );
    const attachments =
      await this.attachmentService.getAttachmentsByMessageId(messageId);
    return {
      data: attachments,
      total: attachments.length,
      page: 1,
      limit: attachments.length || 1,
    };
  }

  @Get("attachments/:id")
  async getAttachment(@Param("id", ParseUUIDPipe) id: string) {
    this.logger.log(
      `GET /messages/attachments/${id} - Get attachment`,
      "MessagingController",
    );
    const attachment = await this.attachmentService.getAttachmentById(id);
    return {
      success: true,
      data: attachment,
      message: "Attachment retrieved successfully",
    };
  }

  @Get(":id")
  async getMessage(@Param("id", FlexibleIdPipe) id: string, @Request() req: any) {
    this.logger.log(`GET /messages/${id} - Get message`, "MessagingController");
    const item = await this.messageService.getMessageById(id, req.user.userId);
    return {
      success: true,
      data: item,
      message: "Message retrieved successfully",
    };
  }

  @Patch(":id/read")
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param("id", StrictUuidPipe) id: string, @Request() req: any) {
    this.logger.log(
      `PATCH /messages/${id}/read - Mark as read`,
      "MessagingController",
    );
    const item = await this.messageService.markMessageAsRead(id, req.user.userId);
    return { success: true, data: item, message: "Message marked as read" };
  }

  /**
   * Edit a message (only by sender, within 15 minutes)
   * PATCH /messages/:id
   */
  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  async updateMessage(
    @Param("id", StrictUuidPipe) id: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @Request() req: any,
  ) {
    this.logger.log(
      `PATCH /messages/${id} - Update message`,
      "MessagingController",
    );

    // Get message to check ownership
    const message = await this.messageService.getMessageById(id);

    // Only sender can edit
    if (message.sender_id !== req.user.userId && req.user.role !== "admin") {
      throw new ForbiddenException(
        "You can only edit your own messages",
      );
    }

    // Check if message is still editable (within 15 minutes)
    const minutesSinceCreation = Math.floor(
      (Date.now() - new Date(message.created_at).getTime()) / (1000 * 60),
    );

    if (minutesSinceCreation > 15 && req.user.role !== "admin") {
      throw new ForbiddenException(
        "Messages can only be edited within 15 minutes of sending",
      );
    }

    const updatedMessage = await this.messageService.updateMessage(
      id,
      updateMessageDto.message,
    );

    return {
      success: true,
      data: updatedMessage,
      message: "Message updated successfully",
    };
  }

  /**
   * Delete a message (only by sender or admin)
   * DELETE /messages/:id
   */
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async deleteMessage(
    @Param("id", StrictUuidPipe) id: string,
    @Request() req: any,
  ) {
    this.logger.log(
      `DELETE /messages/${id} - Delete message`,
      "MessagingController",
    );

    // Get message to check ownership
    const message = await this.messageService.getMessageById(id);

    // Only sender or admin can delete
    if (message.sender_id !== req.user.userId && req.user.role !== "admin") {
      throw new ForbiddenException(
        "You can only delete your own messages",
      );
    }

    await this.messageService.deleteMessage(id);

    return {
      success: true,
      message: "Message deleted successfully",
    };
  }
}

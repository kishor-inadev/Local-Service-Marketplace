import {
  Controller,
  Post,
  Get,
  Patch,
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
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { FlexibleIdPipe } from "@/common/pipes/flexible-id.pipe";
import { StrictUuidPipe } from "@/common/pipes/strict-uuid.pipe";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { MessageService } from "./services/message.service";
import { AttachmentService } from "./services/attachment.service";
import { CreateMessageDto } from "./dto/create-message.dto";
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
    @Query("page", new ParseIntPipe({ optional: true })) page: number = 1,
    @Query("limit", new ParseIntPipe({ optional: true })) limit: number = 20,
  ) {
    this.logger.log(
      `GET /messages/jobs/${jobId}/messages - Get conversation`,
      "MessagingController",
    );
    const result = await this.messageService.getMessagesForJob(
      jobId,
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
  async getMessage(@Param("id", FlexibleIdPipe) id: string) {
    this.logger.log(`GET /messages/${id} - Get message`, "MessagingController");
    const item = await this.messageService.getMessageById(id);
    return {
      success: true,
      data: item,
      message: "Message retrieved successfully",
    };
  }

  @Patch(":id/read")
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param("id", StrictUuidPipe) id: string) {
    this.logger.log(
      `PATCH /messages/${id}/read - Mark as read`,
      "MessagingController",
    );
    const item = await this.messageService.markMessageAsRead(id);
    return { success: true, data: item, message: "Message marked as read" };
  }
}

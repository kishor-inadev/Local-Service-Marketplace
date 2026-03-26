import {
	Controller,
	Post,
	Get,
	Body,
	Param,
	Query,
	Inject,
	LoggerService,
	ParseIntPipe,
	ParseUUIDPipe,
	UseGuards,
	HttpCode,
	HttpStatus
} from "@nestjs/common";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { MessageService } from "./services/message.service";
import { AttachmentService } from "./services/attachment.service";
import { CreateMessageDto } from "./dto/create-message.dto";
import { CreateAttachmentDto } from "./dto/create-attachment.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("messages")
export class MessagingController {
	constructor(
		@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
		private readonly messageService: MessageService,
		private readonly attachmentService: AttachmentService,
	) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	async createMessage(@Body() createMessageDto: CreateMessageDto) {
		this.logger.log("POST /messages - Create message", "MessagingController");
		const message = await this.messageService.createMessage(
			createMessageDto.job_id,
			createMessageDto.sender_id,
			createMessageDto.message,
		);
		return { message };
	}

	@Get(":id")
	async getMessage(@Param("id") id: string) {
		this.logger.log(`GET /messages/${id} - Get message`, "MessagingController");
		const message = await this.messageService.getMessageById(id);
		return { message };
	}

	@Get("jobs/:jobId")
	async getMessagesForJob(
		@Param("jobId", ParseUUIDPipe) jobId: string,
		@Query("page", new ParseIntPipe({ optional: true })) page: number = 1,
		@Query("limit", new ParseIntPipe({ optional: true })) limit: number = 20,
	) {
		this.logger.log(`GET /messages/jobs/${jobId}/messages - Get conversation`, "MessagingController");
		const result = await this.messageService.getMessagesForJob(jobId, page, limit);
		return result;
	}

	@Get("conversations")
	async getConversations(@Query("user_id", ParseUUIDPipe) userId: string) {
		this.logger.log(`GET /messages/conversations - Get user conversations`, "MessagingController");
		const conversations = await this.messageService.getUserConversations(userId);
		return { conversations };
	}

	@Post("attachments")
	@HttpCode(HttpStatus.CREATED)
	async createAttachment(@Body() createAttachmentDto: CreateAttachmentDto) {
		this.logger.log("POST /messages/attachments - Create attachment", "MessagingController");
		const attachment = await this.attachmentService.createAttachment(
			createAttachmentDto.message_id,
			createAttachmentDto.file_url,
			createAttachmentDto.file_name,
			createAttachmentDto.file_size,
			createAttachmentDto.mime_type,
		);
		return { attachment };
	}

	@Get("attachments/:id")
	async getAttachment(@Param("id") id: string) {
		this.logger.log(`GET /messages/attachments/${id} - Get attachment`, "MessagingController");
		const attachment = await this.attachmentService.getAttachmentById(id);
		return { attachment };
	}

	@Get("attachments/message/:messageId")
	async getAttachmentsByMessage(@Param("messageId") messageId: string) {
		this.logger.log(`GET /messages/attachments/message/${messageId} - Get attachments`, "MessagingController");
		const attachments = await this.attachmentService.getAttachmentsByMessageId(messageId);
		return { attachments };
	}
}

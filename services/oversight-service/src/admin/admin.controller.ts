import {
	Controller,
	Get,
	Patch,
	Post,
	Delete,
	Body,
	Param,
	Query,
	Headers,
	ParseUUIDPipe,
	Ip,
	Req,
	UseGuards,
	HttpCode,
	HttpStatus,
} from "@nestjs/common";
import { FlexibleIdPipe } from "@/common/pipes/flexible-id.pipe";
import { Request } from "express";
import { DisputeService } from "./services/dispute.service";
import { AuditLogService } from "./services/audit-log.service";
import { SystemSettingService } from "./services/system-setting.service";
import { ContactMessageService } from "./services/contact-message.service";
import { UpdateDisputeDto } from "./dto/update-dispute.dto";
import { UpdateSystemSettingDto } from "./dto/update-system-setting.dto";
import { CreateContactMessageDto } from "./dto/create-contact-message.dto";
import { UpdateContactMessageDto } from "./dto/update-contact-message.dto";
import { DisputeListQueryDto } from "./dto/dispute-list-query.dto";
import { AuditLogQueryDto } from "./dto/audit-log-query.dto";
import { ContactMessageListQueryDto } from "./dto/contact-message-list-query.dto";
import { SystemSettingQueryDto } from "./dto/system-setting-query.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";

@Controller("admin")
export class AdminController {
	constructor(
		private readonly disputeService: DisputeService,
		private readonly auditLogService: AuditLogService,
		private readonly systemSettingService: SystemSettingService,
		private readonly contactMessageService: ContactMessageService,
	) {}

	// Dispute Management Endpoints
	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Get("disputes/stats")
	async getDisputeStats() {
		return this.disputeService.getDisputeStats();
	}

	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Get("disputes")
	async getDisputes(@Query() queryDto: DisputeListQueryDto) {
		return this.disputeService.getAllDisputes(queryDto);
	}

	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Get("disputes/:id")
	async getDisputeById(@Param("id", FlexibleIdPipe) id: string) {
		return this.disputeService.getDisputeById(id);
	}

	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Patch("disputes/:id")
	async updateDispute(
		@Param("id", FlexibleIdPipe) id: string,
		@Body() updateDisputeDto: UpdateDisputeDto,
		@Headers("x-user-id") adminId: string,
	) {
		return this.disputeService.updateDispute(id, adminId, updateDisputeDto.status, updateDisputeDto.resolution);
	}

	// Audit Log Endpoints
	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Get("audit-logs")
	async getAuditLogs(@Query() queryDto: AuditLogQueryDto) {
		return this.auditLogService.getAuditLogs(queryDto);
	}

	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Get("audit-logs/entity/:entity/:entityId")
	async getAuditLogsByEntity(@Param("entity") entity: string, @Param("entityId", ParseUUIDPipe) entityId: string) {
		const logs = await this.auditLogService.getAuditLogsByEntity(entity, entityId);
		return { data: logs, total: logs.length, page: 1, limit: logs.length || 1 };
	}

	// System Settings Endpoints
	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Get("settings")
	async getSettings(@Query() queryDto: SystemSettingQueryDto) {
		return this.systemSettingService.getAllSettings(queryDto);
	}

	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Get("settings/:key")
	async getSettingByKey(@Param("key") key: string) {
		return this.systemSettingService.getSettingByKey(key);
	}

	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Patch("settings/:key")
	async updateSetting(
		@Param("key") key: string,
		@Body() updateSettingDto: UpdateSystemSettingDto,
		@Headers("x-user-id") adminId: string,
	) {
		return this.systemSettingService.updateSetting(key, updateSettingDto.value, adminId);
	}

	// Contact Message Endpoints
	@Post("contact")
	@HttpCode(HttpStatus.CREATED)
	async createContactMessage(
		@Body() createContactMessageDto: CreateContactMessageDto,
		@Ip() ip: string,
		@Req() req: Request,
	) {
		// Add IP address and user agent to the DTO
		createContactMessageDto.ip_address = ip;
		createContactMessageDto.user_agent = req.get("user-agent");

		return this.contactMessageService.createContactMessage(createContactMessageDto);
	}

	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Get("contact")
	async getContactMessages(@Query() queryDto: ContactMessageListQueryDto) {
		return this.contactMessageService.getAllContactMessages(queryDto);
	}

	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Get("contact/email/:email")
	async getContactMessagesByEmail(@Param("email") email: string) {
		return this.contactMessageService.getContactMessagesByEmail(email);
	}

	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Get("contact/user/:userId")
	async getContactMessagesByUserId(@Param("userId", FlexibleIdPipe) userId: string) {
		return this.contactMessageService.getContactMessagesByUserId(userId);
	}

	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Get("contact/:id")
	async getContactMessageById(@Param("id", ParseUUIDPipe) id: string) {
		return this.contactMessageService.getContactMessageById(id);
	}

	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Patch("contact/:id")
	@HttpCode(HttpStatus.OK)
	async updateContactMessage(
		@Param("id", ParseUUIDPipe) id: string,
		@Body() updateContactMessageDto: UpdateContactMessageDto,
		@Headers("x-user-id") adminId: string,
	) {
		return this.contactMessageService.updateContactMessage(id, updateContactMessageDto, adminId);
	}

	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Delete("contact/:id")
	@HttpCode(HttpStatus.OK)
	async deleteContactMessage(@Param("id", ParseUUIDPipe) id: string, @Headers("x-user-id") adminId: string) {
		return this.contactMessageService.deleteContactMessage(id, adminId);
	}
}

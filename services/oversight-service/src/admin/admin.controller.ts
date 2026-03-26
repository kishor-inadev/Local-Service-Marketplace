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
	ParseIntPipe,
	DefaultValuePipe,
	Ip,
	Req,
	UseGuards,
	HttpCode,
	HttpStatus
} from "@nestjs/common";
import { Request } from "express";
import { UserModerationService } from "./services/user-moderation.service";
import { DisputeService } from "./services/dispute.service";
import { AuditLogService } from "./services/audit-log.service";
import { SystemSettingService } from "./services/system-setting.service";
import { ContactMessageService } from "./services/contact-message.service";
import { UpdateDisputeDto } from "./dto/update-dispute.dto";
import { UpdateSystemSettingDto } from "./dto/update-system-setting.dto";
import { CreateContactMessageDto } from "./dto/create-contact-message.dto";
import { UpdateContactMessageDto } from "./dto/update-contact-message.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";

@Controller("admin")
export class AdminController {
	constructor(
		private readonly userModerationService: UserModerationService,
		private readonly disputeService: DisputeService,
		private readonly auditLogService: AuditLogService,
		private readonly systemSettingService: SystemSettingService,
		private readonly contactMessageService: ContactMessageService,
	) {}

	// User Moderation Endpoints
	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Get("stats")
	async getStats() {
		return this.userModerationService.getStats();
	}

	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Get("users")
	async getUsers(
		@Query("limit", new DefaultValuePipe(50), ParseIntPipe) limit: number,
		@Query("offset", new DefaultValuePipe(0), ParseIntPipe) offset: number,
		@Query("search") search?: string,
	) {
		if (search) {
			return this.userModerationService.searchUsers(search);
		}
		return this.userModerationService.getAllUsers(limit, offset);
	}

	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Get("users/:id")
	async getUserById(@Param("id") id: string) {
		return this.userModerationService.getUserById(id);
	}

	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Patch("users/:id/suspend")
	async suspendUser(
		@Param("id") id: string,
		@Body() body: { reason?: string },
		@Headers("x-admin-id") adminId: string,
	) {
		return this.userModerationService.suspendUser(id, adminId, true, body.reason);
	}

	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Patch("users/:id/activate")
	async activateUser(@Param("id") id: string, @Headers("x-admin-id") adminId: string) {
		return this.userModerationService.activateUser(id, adminId);
	}

	// Dispute Management Endpoints
	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Get("disputes")
	async getDisputes(
		@Query("limit", new DefaultValuePipe(50), ParseIntPipe) limit: number,
		@Query("offset", new DefaultValuePipe(0), ParseIntPipe) offset: number,
		@Query("status") status?: string,
	) {
		if (status) {
			const disputes = await this.disputeService.getDisputesByStatus(status);
			return { disputes, total: disputes.length };
		}
		return this.disputeService.getAllDisputes(limit, offset);
	}

	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Get("disputes/:id")
	async getDisputeById(@Param("id") id: string) {
		return this.disputeService.getDisputeById(id);
	}

	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Patch("disputes/:id")
	async updateDispute(
		@Param("id") id: string,
		@Body() updateDisputeDto: UpdateDisputeDto,
		@Headers("x-admin-id") adminId: string,
	) {
		return this.disputeService.updateDispute(id, adminId, updateDisputeDto.status, updateDisputeDto.resolution);
	}

	// Audit Log Endpoints
	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Get("audit-logs")
	async getAuditLogs(
		@Query("limit", new DefaultValuePipe(100), ParseIntPipe) limit: number,
		@Query("offset", new DefaultValuePipe(0), ParseIntPipe) offset: number,
		@Query("userId") userId?: string,
	) {
		if (userId) {
			const logs = await this.auditLogService.getAuditLogsByUserId(userId);
			return { logs, total: logs.length };
		}
		return this.auditLogService.getAuditLogs(limit, offset);
	}

	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Get("audit-logs/entity/:entity/:entityId")
	async getAuditLogsByEntity(@Param("entity") entity: string, @Param("entityId") entityId: string) {
		return this.auditLogService.getAuditLogsByEntity(entity, entityId);
	}

	// System Settings Endpoints
	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Get("settings")
	async getSettings() {
		return this.systemSettingService.getAllSettings();
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
		@Headers("x-admin-id") adminId: string,
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
	async getContactMessages(
		@Query("limit", new DefaultValuePipe(50), ParseIntPipe) limit: number,
		@Query("offset", new DefaultValuePipe(0), ParseIntPipe) offset: number,
		@Query("status") status?: string,
	) {
		return this.contactMessageService.getAllContactMessages(limit, offset, status);
	}

	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Get("contact/:id")
	async getContactMessageById(@Param("id") id: string) {
		return this.contactMessageService.getContactMessageById(id);
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
	async getContactMessagesByUserId(@Param("userId") userId: string) {
		return this.contactMessageService.getContactMessagesByUserId(userId);
	}

	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Patch("contact/:id")
	async updateContactMessage(
		@Param("id") id: string,
		@Body() updateContactMessageDto: UpdateContactMessageDto,
		@Headers("x-admin-id") adminId: string,
	) {
		return this.contactMessageService.updateContactMessage(id, updateContactMessageDto, adminId);
	}

	@Roles("admin")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Delete("contact/:id")
	async deleteContactMessage(@Param("id") id: string, @Headers("x-admin-id") adminId: string) {
		return this.contactMessageService.deleteContactMessage(id, adminId);
	}
}

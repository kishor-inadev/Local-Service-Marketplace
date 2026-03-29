import {
	Controller,
	Post,
	Get,
	Patch,
	Delete,
	Body,
	Param,
	Query,
	HttpCode,
	HttpStatus,
	ParseUUIDPipe,
	UseGuards,
	Req,
} from "@nestjs/common";
import { RequestService } from "../services/request.service";
import { CreateRequestDto } from "../dto/create-request.dto";
import { UpdateRequestDto } from "../dto/update-request.dto";
import { RequestQueryDto } from "../dto/request-query.dto";
import { RequestResponseDto, PaginatedRequestResponseDto } from "../dto/request-response.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";

@Controller("requests")
export class RequestController {
	constructor(private readonly requestService: RequestService) {}

	// Public — authenticated users supply user_id via JWT context; guests supply guest_info
	@Post()
	@HttpCode(HttpStatus.CREATED)
	async createRequest(@Body() createRequestDto: CreateRequestDto): Promise<RequestResponseDto> {
		return this.requestService.createRequest(createRequestDto);
	}

	// Admin stats endpoint
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles("admin")
	@Get("stats")
	@HttpCode(HttpStatus.OK)
	async getRequestStats() {
		return this.requestService.getRequestStats();
	}

	// Public — anyone can browse open requests
	@UseGuards(JwtAuthGuard)
	@Get()
	@HttpCode(HttpStatus.OK)
	async getRequests(@Query() queryDto: RequestQueryDto): Promise<PaginatedRequestResponseDto> {
		return this.requestService.getRequests(queryDto);
	}

	// Public — anyone can browse a single request
	@UseGuards(JwtAuthGuard)
	@Get(":id([0-9a-fA-F-]{36})")
	@HttpCode(HttpStatus.OK)
	async getRequestById(@Param("id", ParseUUIDPipe) id: string): Promise<RequestResponseDto> {
		return this.requestService.getRequestById(id);
	}

	// Authenticated — fetch only the calling user's requests
	@UseGuards(JwtAuthGuard)
	@Get("my")
	@HttpCode(HttpStatus.OK)
	async getMyRequests(
		@Req() req: any,
	): Promise<{ data: RequestResponseDto[]; total: number; page: number; limit: number }> {
		const result = await this.requestService.getRequestsByUser(req.user.userId);
		return { ...result, page: 1, limit: result.data.length || 1 };
	}

	// Authenticated — owner can update their own request
	@UseGuards(JwtAuthGuard)
	@Patch(":id([0-9a-fA-F-]{36})")
	@HttpCode(HttpStatus.OK)
	async updateRequest(
		@Param("id", ParseUUIDPipe) id: string,
		@Body() updateRequestDto: UpdateRequestDto,
		@Req() req: any,
	): Promise<RequestResponseDto> {
		return this.requestService.updateRequest(id, updateRequestDto, req.user.userId);
	}

	// Admin only — hard delete
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles("admin")
	@Delete(":id([0-9a-fA-F-]{36})")
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteRequest(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
		return this.requestService.deleteRequest(id);
	}

	// Authenticated — admin / internal lookup by user id
	@UseGuards(JwtAuthGuard)
	@Get("user/:userId")
	@HttpCode(HttpStatus.OK)
	async getRequestsByUser(
		@Param("userId", ParseUUIDPipe) userId: string,
	): Promise<{ data: RequestResponseDto[]; total: number; page: number; limit: number }> {
		const result = await this.requestService.getRequestsByUser(userId);
		return { ...result, page: 1, limit: result.data.length || 1 };
	}
}

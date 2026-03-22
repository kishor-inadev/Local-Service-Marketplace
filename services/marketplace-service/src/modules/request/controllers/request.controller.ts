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

	// Public — anyone can browse open requests
	@UseGuards(JwtAuthGuard)
	@Get()
	@HttpCode(HttpStatus.OK)
	async getRequests(@Query() queryDto: RequestQueryDto): Promise<PaginatedRequestResponseDto> {
		return this.requestService.getRequests(queryDto);
	}

	// Public — anyone can browse a single request
	@UseGuards(JwtAuthGuard)
	@Get(":id")
	@HttpCode(HttpStatus.OK)
	async getRequestById(@Param("id") id: string): Promise<RequestResponseDto> {
		return this.requestService.getRequestById(id);
	}

	// Authenticated — fetch only the calling user's requests
	@UseGuards(JwtAuthGuard)
	@Get("my")
	@HttpCode(HttpStatus.OK)
	async getMyRequests(@Req() req: any): Promise<RequestResponseDto[]> {
		return this.requestService.getRequestsByUser(req.user.userId);
	}

	// Authenticated — owner can update their own request
	@UseGuards(JwtAuthGuard)
	@Patch(":id")
	@HttpCode(HttpStatus.OK)
	async updateRequest(
		@Param("id") id: string,
		@Body() updateRequestDto: UpdateRequestDto,
		@Req() req: any,
	): Promise<RequestResponseDto> {
		return this.requestService.updateRequest(id, updateRequestDto, req.user.userId);
	}

	// Admin only — hard delete
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles("admin")
	@Delete(":id")
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteRequest(@Param("id") id: string): Promise<void> {
		return this.requestService.deleteRequest(id);
	}

	// Authenticated — admin / internal lookup by user id
	@UseGuards(JwtAuthGuard)
	@Get("user/:userId")
	@HttpCode(HttpStatus.OK)
	async getRequestsByUser(@Param("userId", ParseUUIDPipe) userId: string): Promise<RequestResponseDto[]> {
		return this.requestService.getRequestsByUser(userId);
	}
}

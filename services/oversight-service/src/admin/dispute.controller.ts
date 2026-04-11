import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	Query,
	Headers,
	UseGuards,
	HttpCode,
	HttpStatus,
} from "@nestjs/common";
import { FlexibleIdPipe } from "@/common/pipes/flexible-id.pipe";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { DisputeService } from "./services/dispute.service";
import { CreateDisputeDto } from "./dto/create-dispute.dto";

/**
 * User-facing dispute endpoints.
 * Accessible by any authenticated user (customer or provider).
 *
 * Routes:
 *   POST   /disputes            — File a new dispute
 *   GET    /disputes/my         — Get current user's disputes
 *   GET    /disputes/:id        — Get a single dispute (parties or admin)
 */
@UseGuards(JwtAuthGuard)
@Controller("disputes")
export class DisputeController {
	constructor(private readonly disputeService: DisputeService) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	async createDispute(
		@Body() dto: CreateDisputeDto,
		@Headers("x-user-id") userId: string,
	) {
		return this.disputeService.createDispute(dto.job_id, userId, dto.reason);
	}

	@Get("my")
	async getMyDisputes(
		@Headers("x-user-id") userId: string,
		@Query("status") status?: string,
		@Query("page") page?: string,
		@Query("limit") limit?: string,
	) {
		return this.disputeService.getUserDisputes(userId, {
			status,
			page: page ? parseInt(page, 10) : 1,
			limit: limit ? parseInt(limit, 10) : 20,
		});
	}

	@Get(":id")
	async getDisputeById(
		@Param("id", FlexibleIdPipe) id: string,
		@Headers("x-user-id") userId: string,
	) {
		return this.disputeService.getDisputeForUser(id, userId);
	}
}

import {
	Controller,
	Post,
	Get,
	Patch,
	Body,
	Param,
	Query,
	HttpCode,
	HttpStatus,
	ParseUUIDPipe,
	UseGuards,
	BadRequestException,
	Request,
} from "@nestjs/common";
import { ProposalService } from "../services/proposal.service";
import { CreateProposalDto } from "../dto/create-proposal.dto";
import { UpdateProposalDto } from "../dto/update-proposal.dto";
import { ProposalQueryDto } from "../dto/proposal-query.dto";
import { ProposalResponseDto, PaginatedProposalResponseDto } from "../dto/proposal-response.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller()
export class ProposalController {
	constructor(private readonly proposalService: ProposalService) {}

	@Post("proposals")
	@HttpCode(HttpStatus.CREATED)
	async createProposal(
		@Body() createProposalDto: CreateProposalDto,
		@Request() req: any,
	): Promise<ProposalResponseDto> {
		// Override provider_id with the authenticated user's provider ID
		if (req.user?.providerId) {
			createProposalDto.provider_id = req.user.providerId;
		}
		return this.proposalService.createProposal(createProposalDto);
	}

	@Get("proposals")
	@HttpCode(HttpStatus.OK)
	async getProposals(@Query() queryDto: ProposalQueryDto): Promise<PaginatedProposalResponseDto> {
		return this.proposalService.getProposals(queryDto);
	}

	@Get("proposals/my")
	@HttpCode(HttpStatus.OK)
	async getMyProposals(
		@Request() req: any,
	): Promise<{ data: ProposalResponseDto[]; total: number; page: number; limit: number }> {
		const result = await this.proposalService.getMyProposals(req.user.userId);
		return { ...result, page: 1, limit: result.data.length || 1 };
	}

	@Get("requests/:requestId/proposals")
	@HttpCode(HttpStatus.OK)
	async getProposalsForRequest(
		@Param("requestId", ParseUUIDPipe) requestId: string,
	): Promise<PaginatedProposalResponseDto> {
		return this.proposalService.getProposalsForRequest(requestId);
	}

	@Post("proposals/:id([0-9a-fA-F-]{36})/accept")
	@HttpCode(HttpStatus.OK)
	async acceptProposal(@Param("id", ParseUUIDPipe) id: string, @Request() req: any): Promise<ProposalResponseDto> {
		return this.proposalService.acceptProposal(id, req.user.userId, req.user.role);
	}

	@Post("proposals/:id([0-9a-fA-F-]{36})/reject")
	@HttpCode(HttpStatus.OK)
	async rejectProposal(@Param("id", ParseUUIDPipe) id: string, @Request() req: any): Promise<ProposalResponseDto> {
		return this.proposalService.rejectProposal(id, req.user.userId, req.user.role);
	}

	@Post("proposals/:id([0-9a-fA-F-]{36})/withdraw")
	@HttpCode(HttpStatus.OK)
	async withdrawProposal(@Param("id", ParseUUIDPipe) id: string, @Request() req: any): Promise<ProposalResponseDto> {
		return this.proposalService.withdrawProposal(id, req.user.userId);
	}

	@Patch("proposals/:id([0-9a-fA-F-]{36})")
	@HttpCode(HttpStatus.OK)
	async updateProposal(
		@Param("id", ParseUUIDPipe) id: string,
		@Body() body: UpdateProposalDto,
		@Request() req: any,
	): Promise<ProposalResponseDto> {
		return this.proposalService.updateProposal(id, req.user.userId, body);
	}

	@Get("proposals/:id([0-9a-fA-F-]{36})")
	@HttpCode(HttpStatus.OK)
	async getProposalById(@Param("id", ParseUUIDPipe) id: string): Promise<ProposalResponseDto> {
		return this.proposalService.getProposalById(id);
	}
}

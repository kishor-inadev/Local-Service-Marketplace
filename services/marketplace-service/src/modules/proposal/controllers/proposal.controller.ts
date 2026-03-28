import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ProposalService } from '../services/proposal.service';
import { CreateProposalDto } from '../dto/create-proposal.dto';
import { ProposalQueryDto } from "../dto/proposal-query.dto";
import { ProposalResponseDto, PaginatedProposalResponseDto } from '../dto/proposal-response.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class ProposalController {
	constructor(private readonly proposalService: ProposalService) {}

	@Post("proposals")
	@HttpCode(HttpStatus.CREATED)
	async createProposal(@Body() createProposalDto: CreateProposalDto): Promise<ProposalResponseDto> {
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
		@Query("user_id", ParseUUIDPipe) userId: string,
	): Promise<{ data: ProposalResponseDto[]; total: number }> {
		if (!userId) {
			throw new Error("User ID is required");
		}
		return this.proposalService.getMyProposals(userId);
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
	async acceptProposal(@Param("id", ParseUUIDPipe) id: string): Promise<ProposalResponseDto> {
		return this.proposalService.acceptProposal(id);
	}

	@Post("proposals/:id([0-9a-fA-F-]{36})/reject")
	@HttpCode(HttpStatus.OK)
	async rejectProposal(@Param("id", ParseUUIDPipe) id: string): Promise<ProposalResponseDto> {
		return this.proposalService.rejectProposal(id);
	}

	@Get("proposals/:id([0-9a-fA-F-]{36})")
	@HttpCode(HttpStatus.OK)
	async getProposalById(@Param("id", ParseUUIDPipe) id: string): Promise<ProposalResponseDto> {
		return this.proposalService.getProposalById(id);
	}
}

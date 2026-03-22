import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ProposalService } from '../services/proposal.service';
import { CreateProposalDto } from '../dto/create-proposal.dto';
import { ProposalResponseDto, PaginatedProposalResponseDto } from '../dto/proposal-response.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class ProposalController {
  constructor(private readonly proposalService: ProposalService) {}

  @Post('proposals')
  @HttpCode(HttpStatus.CREATED)
  async createProposal(@Body() createProposalDto: CreateProposalDto): Promise<ProposalResponseDto> {
    return this.proposalService.createProposal(createProposalDto);
  }

  @Get('proposals/my')
  @HttpCode(HttpStatus.OK)
  async getMyProposals(@Query('user_id', ParseUUIDPipe) userId: string): Promise<ProposalResponseDto[]> {
    if (!userId) {
      throw new Error('User ID is required');
    }
    return this.proposalService.getMyProposals(userId);
  }

  @Get('requests/:requestId/proposals')
  @HttpCode(HttpStatus.OK)
  async getProposalsForRequest(@Param('requestId', ParseUUIDPipe) requestId: string): Promise<PaginatedProposalResponseDto> {
    return this.proposalService.getProposalsForRequest(requestId);
  }

  @Post('proposals/:id/accept')
  @HttpCode(HttpStatus.OK)
  async acceptProposal(@Param('id') id: string): Promise<ProposalResponseDto> {
    return this.proposalService.acceptProposal(id);
  }

  @Post('proposals/:id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectProposal(@Param('id') id: string): Promise<ProposalResponseDto> {
    return this.proposalService.rejectProposal(id);
  }

  @Get('proposals/:id')
  @HttpCode(HttpStatus.OK)
  async getProposalById(@Param('id') id: string): Promise<ProposalResponseDto> {
    return this.proposalService.getProposalById(id);
  }
}

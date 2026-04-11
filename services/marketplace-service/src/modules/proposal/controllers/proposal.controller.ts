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
  UseGuards,
  BadRequestException,
  Request,
} from "@nestjs/common";
import { FlexibleIdPipe } from "@/common/pipes/flexible-id.pipe";
import { StrictUuidPipe } from "@/common/pipes/strict-uuid.pipe";
import { ProposalService } from "../services/proposal.service";
import { CreateProposalDto } from "../dto/create-proposal.dto";
import { UpdateProposalDto } from "../dto/update-proposal.dto";
import { ProposalQueryDto } from "../dto/proposal-query.dto";
import {
  ProposalResponseDto,
  PaginatedProposalResponseDto,
} from "../dto/proposal-response.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { OwnershipGuard } from "@/common/guards/ownership.guard";
import { Ownership } from "@/common/decorators/ownership.decorator";

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
  async getProposals(
    @Query() queryDto: ProposalQueryDto,
    @Request() req: any,
  ): Promise<PaginatedProposalResponseDto> {
    return this.proposalService.getProposals(queryDto, req.user);
  }

  @Get("proposals/my")
  @HttpCode(HttpStatus.OK)
  async getMyProposals(@Request() req: any): Promise<{
    data: ProposalResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const result = await this.proposalService.getMyProposals(req.user.userId);
    return { ...result, page: 1, limit: result.data.length || 1 };
  }

  @Get("requests/:requestId/proposals")
  @HttpCode(HttpStatus.OK)
  async getProposalsForRequest(
    @Param("requestId", FlexibleIdPipe) requestId: string,
    @Request() req: any,
  ): Promise<PaginatedProposalResponseDto> {
    return this.proposalService.getProposalsForRequest(requestId, req.user);
  }

  @Post("proposals/:id/accept")
  @HttpCode(HttpStatus.OK)
  async acceptProposal(
    @Param("id", StrictUuidPipe) id: string,
    @Request() req: any,
  ): Promise<ProposalResponseDto> {
    return this.proposalService.acceptProposal(
      id,
      req.user.userId,
      req.user.role,
    );
  }

  @Post("proposals/:id/reject")
  @HttpCode(HttpStatus.OK)
  async rejectProposal(
    @Param("id", StrictUuidPipe) id: string,
    @Request() req: any,
  ): Promise<ProposalResponseDto> {
    return this.proposalService.rejectProposal(
      id,
      req.user.userId,
      req.user.role,
    );
  }

  @Post("proposals/:id/withdraw")
  @UseGuards(OwnershipGuard)
  @Ownership({ resourceType: "proposal", userIdField: "provider_id" })
  @HttpCode(HttpStatus.OK)
  async withdrawProposal(
    @Param("id", StrictUuidPipe) id: string,
    @Request() req: any,
  ): Promise<ProposalResponseDto> {
    // Resource already validated by OwnershipGuard
    return this.proposalService.withdrawProposal(id, req.user.userId);
  }

  @Patch("proposals/:id")
  @UseGuards(OwnershipGuard)
  @Ownership({ resourceType: "proposal", userIdField: "provider_id" })
  @HttpCode(HttpStatus.OK)
  async updateProposal(
    @Param("id", StrictUuidPipe) id: string,
    @Body() body: UpdateProposalDto,
    @Request() req: any,
  ): Promise<ProposalResponseDto> {
    // Resource already validated by OwnershipGuard
    return this.proposalService.updateProposal(id, req.user.userId, body);
  }

  @Get("proposals/:id")
  @HttpCode(HttpStatus.OK)
  async getProposalById(
    @Param("id", FlexibleIdPipe) id: string,
  ): Promise<ProposalResponseDto> {
    return this.proposalService.getProposalById(id);
  }

  @Delete("proposals/:id")
  @UseGuards(OwnershipGuard)
  @Ownership({ resourceType: "proposal", userIdField: "provider_id" })
  @HttpCode(HttpStatus.OK)
  async deleteProposal(
    @Param("id", StrictUuidPipe) id: string,
    @Request() req: any,
  ): Promise<{ success: boolean; message: string }> {
    // Resource already validated by OwnershipGuard
    await this.proposalService.deleteProposal(id, req.user.userId);
    return {
      success: true,
      message: "Proposal deleted successfully",
    };
  }
}

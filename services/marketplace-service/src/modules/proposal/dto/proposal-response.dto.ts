import { Proposal } from "../entities/proposal.entity";

export class ProposalResponseDto {
  id: string;
  request_id: string;
  provider_id: string;
  price: number;
  message: string;
  status: string;
  created_at: Date;

  static fromEntity(proposal: Proposal): ProposalResponseDto {
    return {
      id: proposal.id,
      request_id: proposal.request_id,
      provider_id: proposal.provider_id,
      price: proposal.price,
      message: proposal.message,
      status: proposal.status,
      created_at: proposal.created_at,
    };
  }
}

export class PaginatedProposalResponseDto {
  data: ProposalResponseDto[];
  total?: number;
  page?: number;
  limit?: number;
  nextCursor?: string;
  hasMore?: boolean;

  constructor(
    data: ProposalResponseDto[],
    nextCursor?: string,
    hasMore = false,
    total?: number,
    page?: number,
    limit?: number,
  ) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.nextCursor = nextCursor;
    this.hasMore = hasMore;
  }
}

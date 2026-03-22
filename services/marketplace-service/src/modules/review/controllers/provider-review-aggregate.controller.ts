import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  ParseFloatPipe,
  ParseIntPipe,
  UseGuards
} from '@nestjs/common';
import { ProviderReviewAggregateService } from '../services/provider-review-aggregate.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('review-aggregates')
export class ProviderReviewAggregateController {
  constructor(
    private readonly aggregateService: ProviderReviewAggregateService
  ) {}

  @Get('provider/:providerId')
  async getProviderAggregate(
    @Param('providerId', ParseUUIDPipe) providerId: string
  ) {
    const aggregate = await this.aggregateService.getProviderAggregate(providerId);

    // Transform field names for frontend compatibility
    const transformedAggregate = aggregate ? {
      ...aggregate,
      one_star_count: aggregate.rating_1_count,
      two_star_count: aggregate.rating_2_count,
      three_star_count: aggregate.rating_3_count,
      four_star_count: aggregate.rating_4_count,
      five_star_count: aggregate.rating_5_count
    } : null;

    return {
      success: true,
      data: transformedAggregate
    };
  }

  @Get('provider/:providerId/distribution')
  async getRatingDistribution(
    @Param('providerId', ParseUUIDPipe) providerId: string
  ) {
    const distribution = await this.aggregateService.getRatingDistribution(providerId);

    return {
      success: true,
      data: distribution
    };
  }

  @Get('provider/:providerId/trust-badge')
  async checkTrustBadge(
    @Param('providerId', ParseUUIDPipe) providerId: string
  ) {
    const eligibility = await this.aggregateService.checkTrustBadgeEligibility(
      providerId
    );

    return {
      success: true,
      data: eligibility
    };
  }

  @Get('top-rated')
  async getTopRatedProviders(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
  ) {
    const providers = await this.aggregateService.getTopRatedProviders(
      limit || 10
    );

    // Transform field names for frontend compatibility
    const transformedProviders = providers.map(aggregate => ({
      ...aggregate,
      one_star_count: aggregate.rating_1_count,
      two_star_count: aggregate.rating_2_count,
      three_star_count: aggregate.rating_3_count,
      four_star_count: aggregate.rating_4_count,
      five_star_count: aggregate.rating_5_count
    }));

    return {
      success: true,
      data: transformedProviders,
      count: transformedProviders.length
    };
  }

  @Get('by-rating')
  async getProvidersByRating(
    @Query('min', ParseFloatPipe) minRating: number,
    @Query('max', ParseFloatPipe) maxRating: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
  ) {
    const providers = await this.aggregateService.getProvidersByRating(
      minRating,
      maxRating,
      limit || 20
    );

    // Transform field names for frontend compatibility
    const transformedProviders = providers.map(aggregate => ({
      ...aggregate,
      one_star_count: aggregate.rating_1_count,
      two_star_count: aggregate.rating_2_count,
      three_star_count: aggregate.rating_3_count,
      four_star_count: aggregate.rating_4_count,
      five_star_count: aggregate.rating_5_count
    }));

    return {
      success: true,
      data: transformedProviders,
      count: transformedProviders.length
    };
  }
}



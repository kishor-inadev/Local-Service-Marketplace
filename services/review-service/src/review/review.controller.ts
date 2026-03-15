import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
} from '@nestjs/common';
import { ReviewService } from './services/review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  async createReview(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewService.createReview(createReviewDto);
  }

  @Get(':id')
  async getReviewById(@Param('id') id: string) {
    return this.reviewService.getReviewById(id);
  }
}

@Controller('providers')
export class ProviderReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get(':providerId/reviews')
  async getProviderReviews(
    @Param('providerId') providerId: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.reviewService.getProviderReviews(providerId, limit, offset);
  }

  @Get(':providerId/rating')
  async getProviderRating(@Param('providerId') providerId: string) {
    return this.reviewService.getProviderRating(providerId);
  }
}

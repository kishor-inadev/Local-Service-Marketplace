import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { FlexibleIdPipe } from "@/common/pipes/flexible-id.pipe";
import { StrictUuidPipe } from "@/common/pipes/strict-uuid.pipe";
import { ReviewService } from "./services/review.service";
import { ReviewRepository } from "./repositories/review.repository";
import { CreateReviewDto } from "./dto/create-review.dto";
import { UpdateReviewDto } from "./dto/update-review.dto";
import { RespondReviewDto } from "./dto/respond-review.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { PermissionsGuard as RolesGuard, Roles, RequirePermissions } from '@/common/rbac';
import { OwnershipGuard } from "@/common/guards/ownership.guard";
import { Ownership } from "@/common/decorators/ownership.decorator";
import { ForbiddenException, ConflictException } from "@/common/exceptions/http.exceptions";

@Controller("reviews")
export class ReviewController {
  constructor(
    private readonly reviewService: ReviewService,
    private readonly reviewRepository: ReviewRepository,
  ) {}

  @RequirePermissions('reviews.create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createReview(
    @Body() createReviewDto: CreateReviewDto,
    @Request() req: any,
  ) {
    // Override user_id with the authenticated user's ID
    createReviewDto.user_id = req.user.userId;
    const review = await this.reviewService.createReview(createReviewDto);
    return review;
  }

  /**
   * Get current authenticated user's sent reviews
   * GET /reviews/my
   */
  @UseGuards(JwtAuthGuard)
  @Get("my")
  async getMyReviews(
    @Request() req: any,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const userId = req.user.userId;
    const offset = (page - 1) * limit;
    const result = await this.reviewService.getReviewsByUser(userId, limit, offset);
    return {
      success: true,
      data: result.data ?? result,
      total: result.total ?? (result as any).length ?? 0,
      page,
      limit,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  async getReviewById(@Param("id", FlexibleIdPipe) id: string) {
    const review = await this.reviewService.getReviewById(id);
    return review;
  }

  /**
   * Get review for a specific job
   * GET /jobs/:jobId/review
   */
  @UseGuards(JwtAuthGuard)
  @Get("jobs/:jobId/review")
  async getJobReview(
    @Param("jobId", FlexibleIdPipe) jobId: string,
    @Request() req: any,
  ) {
    const review = await this.reviewRepository.getReviewByJobId(jobId);

    if (!review) {
      return null;
    }

    // RBAC: Only involved users or admin can see the review via this direct link
    const isCustomer = review.user_id === req.user.userId;
    // For provider, we might need providerId or userId depending on how it's stored
    // In this system, provider_id on review usually matches the provider's userId
    const isProvider = review.provider_id === req.user.userId || (req.user.providerId && review.provider_id === req.user.providerId);
    const isAdmin = req.user.permissions?.includes('reviews.manage');

    if (!isCustomer && !isProvider && !isAdmin) {
      throw new ForbiddenException(
        "You are not authorized to view the review for this job",
      );
    }

    return review;
  }

  /**
   * Provider responds to a review
   * POST /reviews/:id/respond
   */
  @UseGuards(JwtAuthGuard)
  @Post(":id/respond")
  @HttpCode(HttpStatus.OK)
  async respondToReview(
    @Param("id", StrictUuidPipe) id: string,
    @Body() respondReviewDto: RespondReviewDto,
    @Request() req: any,
  ) {
    const providerId = req.user.providerId;
    if (!providerId) {
      throw new ForbiddenException("Only providers can respond to reviews");
    }
    const review = await this.reviewRepository.respondToReview(
      id,
      respondReviewDto.response,
      providerId,
    );

    return review;
  }

  /**
   * Mark review as helpful
   * POST /reviews/:id/helpful
   */
  @UseGuards(JwtAuthGuard)
  @Post(":id/helpful")
  @HttpCode(HttpStatus.OK)
  async markHelpful(
    @Param("id", StrictUuidPipe) id: string,
    @Request() req: any,
  ) {
    const review = await this.reviewRepository.incrementHelpfulCount(id, req.user.userId);
    if (!review) {
      throw new ConflictException("You have already marked this review as helpful");
    }
    return review;
  }
  /**
   * Get reviews for a provider
   * GET /reviews/provider/:providerId
   */
  @Get("provider/:providerId")
  async getProviderReviews(
    @Param("providerId", FlexibleIdPipe) providerId: string,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query("offset", new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    const result = await this.reviewService.getProviderReviews(
      providerId,
      limit,
      offset,
    );
    return {
      success: true,
      message: "Provider reviews retrieved successfully",
      data: { reviews: result.data, averageRating: result.averageRating },
      meta: {
        page: Math.floor(offset / limit) + 1,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  /**
   * Get rating summary for a provider
   * GET /reviews/provider/:providerId/rating
   */
  @Get("provider/:providerId/rating")
  async getProviderRating(
    @Param("providerId", FlexibleIdPipe) providerId: string,
  ) {
    return this.reviewService.getProviderRating(providerId);
  }

  /**
   * Update a review (only by review author within 30 days)
   * PATCH /reviews/:id
   */
  @UseGuards(JwtAuthGuard, OwnershipGuard)
  @Ownership({ resourceType: "review", userIdField: "user_id" })
  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  async updateReview(
    @Param("id", StrictUuidPipe) id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @Request() req: any,
  ) {
    const updatedReview = await this.reviewService.updateReview(
      id,
      updateReviewDto,
    );
    
    return {
      success: true,
      message: "Review updated successfully",
      data: updatedReview,
    };
  }

  /**
   * Delete a review (only by review author or admin)
   * DELETE /reviews/:id
   */
  @UseGuards(JwtAuthGuard, OwnershipGuard)
  @Ownership({ resourceType: "review", userIdField: "user_id" })
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async deleteReview(
    @Param("id", StrictUuidPipe) id: string,
    @Request() req: any,
  ) {
    await this.reviewService.deleteReview(id);
    
    return {
      success: true,
      message: "Review deleted successfully",
    };
  }
}

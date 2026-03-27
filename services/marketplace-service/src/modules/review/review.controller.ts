import {
	Controller,
	Get,
	Post,
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
import { ReviewService } from "./services/review.service";
import { ReviewRepository } from "./repositories/review.repository";
import { CreateReviewDto } from "./dto/create-review.dto";
import { RespondReviewDto } from "./dto/respond-review.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("reviews")
export class ReviewController {
	constructor(
		private readonly reviewService: ReviewService,
		private readonly reviewRepository: ReviewRepository,
	) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	async createReview(@Body() createReviewDto: CreateReviewDto) {
		const review = await this.reviewService.createReview(createReviewDto);
		return review;
	}

	@Get(":id")
	async getReviewById(@Param("id") id: string) {
		const review = await this.reviewService.getReviewById(id);
		return review;
	}

	/**
	 * Get review for a specific job
	 * GET /jobs/:jobId/review
	 */
	@Get("jobs/:jobId/review")
	async getJobReview(@Param("jobId") jobId: string) {
		const review = await this.reviewRepository.getReviewByJobId(jobId);

		if (!review) {
			return null;
		}

		return review;
	}

	/**
	 * Provider responds to a review
	 * POST /reviews/:id/respond
	 */
	@Post(":id/respond")
	@HttpCode(HttpStatus.OK)
	async respondToReview(@Param("id") id: string, @Body() respondReviewDto: RespondReviewDto, @Request() req: any) {
		const review = await this.reviewRepository.respondToReview(id, respondReviewDto.response, req.user.id);

		return review;
	}

	/**
	 * Mark review as helpful
	 * POST /reviews/:id/helpful
	 */
	@Post(":id/helpful")
	@HttpCode(HttpStatus.OK)
	async markHelpful(@Param("id") id: string, @Request() req: any) {
		const review = await this.reviewRepository.incrementHelpfulCount(id);

		return review;
	}
	/**
	 * Get reviews for a provider
	 * GET /reviews/provider/:providerId
	 */
	@Get("provider/:providerId")
	async getProviderReviews(
		@Param("providerId") providerId: string,
		@Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
		@Query("offset", new DefaultValuePipe(0), ParseIntPipe) offset: number,
	) {
		return this.reviewService.getProviderReviews(providerId, limit, offset);
	}

	/**
	 * Get rating summary for a provider
	 * GET /reviews/provider/:providerId/rating
	 */
	@Get("provider/:providerId/rating")
	async getProviderRating(@Param("providerId") providerId: string) {
		return this.reviewService.getProviderRating(providerId);
	}
}

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
import { FlexibleIdPipe } from "@/common/pipes/flexible-id.pipe";
import { ReviewService } from "./services/review.service";
import { ReviewRepository } from "./repositories/review.repository";
import { CreateReviewDto } from "./dto/create-review.dto";
import { RespondReviewDto } from "./dto/respond-review.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { ForbiddenException } from "@/common/exceptions/http.exceptions";

@UseGuards(JwtAuthGuard)
@Controller("reviews")
export class ReviewController {
	constructor(
		private readonly reviewService: ReviewService,
		private readonly reviewRepository: ReviewRepository,
	) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	async createReview(@Body() createReviewDto: CreateReviewDto, @Request() req: any) {
		// Override user_id with the authenticated user's ID
		createReviewDto.user_id = req.user.userId;
		const review = await this.reviewService.createReview(createReviewDto);
		return review;
	}

	@Get(":id")
	async getReviewById(@Param("id", FlexibleIdPipe) id: string) {
		const review = await this.reviewService.getReviewById(id);
		return review;
	}

	/**
	 * Get review for a specific job
	 * GET /jobs/:jobId/review
	 */
	@Get("jobs/:jobId/review")
	async getJobReview(@Param("jobId", FlexibleIdPipe) jobId: string) {
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
	async respondToReview(
		@Param("id", FlexibleIdPipe) id: string,
		@Body() respondReviewDto: RespondReviewDto,
		@Request() req: any,
	) {
		const providerId = req.user.providerId;
		if (!providerId) {
			throw new ForbiddenException("Only providers can respond to reviews");
		}
		const review = await this.reviewRepository.respondToReview(id, respondReviewDto.response, providerId);

		return review;
	}

	/**
	 * Mark review as helpful
	 * POST /reviews/:id/helpful
	 */
	@Post(":id/helpful")
	@HttpCode(HttpStatus.OK)
	async markHelpful(@Param("id", FlexibleIdPipe) id: string, @Request() req: any) {
		const review = await this.reviewRepository.incrementHelpfulCount(id);

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
		const result = await this.reviewService.getProviderReviews(providerId, limit, offset);
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
	async getProviderRating(@Param("providerId", FlexibleIdPipe) providerId: string) {
		return this.reviewService.getProviderRating(providerId);
	}
}

import { Injectable, Inject, LoggerService } from "@nestjs/common";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { ReviewRepository } from "../repositories/review.repository";
import { CreateReviewDto } from "../dto/create-review.dto";
import { Review } from "../entities/review.entity";
import { NotFoundException } from "../../../common/exceptions/http.exceptions";
import { NotificationClient } from "../../../common/notification/notification.client";
import { UserClient } from "../../../common/user/user.client";

@Injectable()
export class ReviewService {
	constructor(
		private readonly reviewRepository: ReviewRepository,
		@Inject(WINSTON_MODULE_NEST_PROVIDER)
		private readonly logger: LoggerService,
		private readonly notificationClient: NotificationClient,
		private readonly userClient: UserClient,
	) {}

	async createReview(createReviewDto: CreateReviewDto): Promise<Review> {
		this.logger.log(`Creating review for provider ${createReviewDto.provider_id}`, "ReviewService");

		const review = await this.reviewRepository.createReview(createReviewDto);

		this.logger.log(`Review created successfully with ID ${review.id}`, "ReviewService");

		// Notify provider about new review
		const providerEmail = await this.userClient.getProviderEmail(createReviewDto.provider_id);
		if (providerEmail) {
			this.notificationClient
				.sendEmail({
					to: providerEmail,
					template: "newRequest",
					variables: {
						serviceName: "New Review Received",
						message: `You received a ${review.rating}-star review: ${review.comment || "No comment provided"}`,
						reviewUrl: `${process.env.FRONTEND_URL}/reviews/${review.id}`,
					},
				})
				.catch((err) => {
					this.logger.error(`Failed to send review notification: ${err.message}`, err.stack, "ReviewService");
				});
		}

		return review;
	}

	async getProviderReviews(
		providerId: string,
		limit: number = 20,
		offset: number = 0,
	): Promise<{ reviews: Review[]; total: number; averageRating: number }> {
		this.logger.log(
			`Fetching reviews for provider ${providerId} (limit: ${limit}, offset: ${offset})`,
			"ReviewService",
		);

		const reviews = await this.reviewRepository.getProviderReviews(providerId, limit, offset);

		const ratingData = await this.reviewRepository.getProviderRating(providerId);

		return { reviews, total: ratingData.totalReviews, averageRating: ratingData.averageRating };
	}

	async getProviderRating(providerId: string): Promise<{ averageRating: number; totalReviews: number }> {
		this.logger.log(`Calculating rating for provider ${providerId}`, "ReviewService");

		const ratingData = await this.reviewRepository.getProviderRating(providerId);

		return ratingData;
	}

	async getReviewById(id: string): Promise<Review> {
		this.logger.log(`Fetching review with ID ${id}`, "ReviewService");

		const review = await this.reviewRepository.getReviewById(id);

		if (!review) {
			throw new NotFoundException("Review not found");
		}

		return review;
	}
}

import { Injectable, Inject, LoggerService } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { ReviewRepository } from "../repositories/review.repository";
import { CreateReviewDto } from "../dto/create-review.dto";
import { UpdateReviewDto } from "../dto/update-review.dto";
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
    @InjectQueue('marketplace.notification') private readonly notificationQueue: Queue,
    @InjectQueue('marketplace.rating') private readonly ratingQueue: Queue,
  ) {}

  async createReview(createReviewDto: CreateReviewDto): Promise<Review> {
    this.logger.log(
      `Creating review for provider ${createReviewDto.provider_id}`,
      "ReviewService",
    );

    const review = await this.reviewRepository.createReview(createReviewDto);

    this.logger.log(
      `Review created successfully with ID ${review.id}`,
      "ReviewService",
    );

    // Enqueue provider review notification (non-blocking)
    this.notificationQueue
      .add('notify-review-created', {
        providerId: createReviewDto.provider_id,
        reviewId: review.id,
        rating: review.rating,
      })
      .catch((err) => {
        this.logger.warn(
          `Failed to enqueue review notification: ${err.message}`,
          'ReviewService',
        );
      });

    // Enqueue rating recalculation (non-blocking)
    this.ratingQueue
      .add('recalculate-provider-rating', { providerId: createReviewDto.provider_id })
      .catch(() => null);

    return review;
  }

  async getProviderReviews(
    providerId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ data: Review[]; total: number; averageRating: number }> {
    this.logger.log(
      `Fetching reviews for provider ${providerId} (limit: ${limit}, offset: ${offset})`,
      "ReviewService",
    );

    const reviews = await this.reviewRepository.getProviderReviews(
      providerId,
      limit,
      offset,
    );

    const ratingData =
      await this.reviewRepository.getProviderRating(providerId);

    return {
      data: reviews,
      total: ratingData.totalReviews,
      averageRating: ratingData.averageRating,
    };
  }

  async getProviderRating(
    providerId: string,
  ): Promise<{ averageRating: number; totalReviews: number }> {
    this.logger.log(
      `Calculating rating for provider ${providerId}`,
      "ReviewService",
    );

    const ratingData =
      await this.reviewRepository.getProviderRating(providerId);

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

  async updateReview(
    id: string,
    updateReviewDto: UpdateReviewDto,
  ): Promise<Review> {
    this.logger.log(`Updating review ${id}`, "ReviewService");

    const review = await this.reviewRepository.updateReview(id, updateReviewDto);

    if (!review) {
      throw new NotFoundException("Review not found");
    }

    // Enqueue rating recalculation if rating changed
    if (updateReviewDto.rating !== undefined) {
      this.ratingQueue
        .add("recalculate-provider-rating", { providerId: review.provider_id })
        .catch(() => null);
    }

    return review;
  }

  async deleteReview(id: string): Promise<void> {
    this.logger.log(`Deleting review ${id}`, "ReviewService");

    const review = await this.reviewRepository.getReviewById(id);
    if (!review) {
      throw new NotFoundException("Review not found");
    }

    await this.reviewRepository.deleteReview(id);

    // Enqueue rating recalculation
    this.ratingQueue
      .add("recalculate-provider-rating", { providerId: review.provider_id })
      .catch(() => null);

    this.logger.log(`Review ${id} deleted successfully`, "ReviewService");
  }
}

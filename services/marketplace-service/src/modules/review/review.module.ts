import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ReviewController } from "./review.controller";
import { ProviderReviewAggregateController } from "./controllers/provider-review-aggregate.controller";
import { ReviewService } from "./services/review.service";
import { ProviderReviewAggregateService } from "./services/provider-review-aggregate.service";
import { ReviewRepository } from "./repositories/review.repository";
import { ProviderReviewAggregateRepository } from "./repositories/provider-review-aggregate.repository";
import { NotificationModule } from "../../common/notification/notification.module";
import { UserModule } from "../../common/user/user.module";

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'marketplace.notification' },
      { name: 'marketplace.rating' },
    ),
    NotificationModule,
    UserModule,
  ],
  controllers: [ReviewController, ProviderReviewAggregateController],
  providers: [
    ReviewService,
    ProviderReviewAggregateService,
    ReviewRepository,
    ProviderReviewAggregateRepository,
  ],
  exports: [
    ReviewService,
    ProviderReviewAggregateService,
    ProviderReviewAggregateRepository,
  ],
})
export class ReviewModule {}

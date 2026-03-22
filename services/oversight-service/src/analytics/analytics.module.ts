import { Module } from "@nestjs/common";
import { AnalyticsController } from "./controllers/analytics.controller";
import { AnalyticsService } from "./services/analytics.service";
import { MetricsAggregationService } from "./services/metrics-aggregation.service";
import { UserActivityRepository } from "./repositories/user-activity.repository";
import { MetricsRepository } from "./repositories/metrics.repository";
import { DatabaseModule } from "../common/database/database.module";
import { EventConsumerService } from "../common/analytics/event-consumer.service";

@Module({
	imports: [DatabaseModule],
	controllers: [AnalyticsController],
	providers: [
		AnalyticsService,
		MetricsAggregationService,
		UserActivityRepository,
		MetricsRepository,
		EventConsumerService,
	],
	exports: [AnalyticsService, MetricsAggregationService],
})
export class AnalyticsModule {}

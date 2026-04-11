import {
	Controller,
	Get,
	Post,
	Body,
	Query,
	Param,
	Req,
	Inject,
	LoggerService,
	UseGuards,
	HttpCode,
	HttpStatus,
	ParseIntPipe,
	ParseUUIDPipe,
	DefaultValuePipe,
	Headers,
} from "@nestjs/common";
import { Request } from "express";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { AnalyticsService } from "../services/analytics.service";
import { MetricsAggregationService } from "../services/metrics-aggregation.service";
import { TrackActivityDto } from "../dto/track-activity.dto";
import { BackfillMetricsDto } from "../dto/backfill-metrics.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";
import { ForbiddenException, BadRequestException } from "@/common/exceptions/http.exceptions";
import { InternalServiceGuard } from "@/common/guards/internal-service.guard";

@Controller("analytics")
export class AnalyticsController {
	constructor(
		@Inject(WINSTON_MODULE_NEST_PROVIDER)
		private readonly logger: LoggerService,
		private readonly analyticsService: AnalyticsService,
		private readonly metricsAggregationService: MetricsAggregationService,
	) {}

	@Post("activity")
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.OK)
	async trackActivity(@Body() trackActivityDto: TrackActivityDto, @Headers("x-user-id") requestingUserId: string, @Headers("x-user-role") requestingUserRole: string, @Req() req: Request) {
		// Non-admins can only log their own activity
		if (requestingUserRole !== "admin") {
			trackActivityDto.user_id = requestingUserId;
		}
		// Capture IP address from forwarded header or direct connection
		if (!trackActivityDto.ip_address) {
			const forwarded = req.headers['x-forwarded-for'];
			trackActivityDto.ip_address = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]) ?? (req as any).ip ?? null;
		}
		this.logger.log(
			`POST /analytics/activity - Track activity for user ${trackActivityDto.user_id}`,
			"AnalyticsController",
		);

		const activity = await this.analyticsService.trackActivity(trackActivityDto);

		return activity;
	}

	@Get("user-activity")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles("admin")
	async getAllActivity(
		@Query("limit", new DefaultValuePipe(100), ParseIntPipe) limit: number,
		@Query("offset", new DefaultValuePipe(0), ParseIntPipe) offset: number,
	) {
		this.logger.log(`GET /analytics/user-activity - Retrieve all activity logs`, "AnalyticsController");

		const result = await this.analyticsService.getAllActivity(limit, offset);

		return { data: result.data, total: result.total, page: Math.floor(offset / limit) + 1, limit };
	}

	@Get("user-activity/:userId")
	@UseGuards(JwtAuthGuard)
	async getUserActivity(
		@Param("userId", ParseUUIDPipe) userId: string,
		@Headers("x-user-id") requestingUserId: string,
		@Headers("x-user-role") requestingUserRole: string,
		@Query("limit", new DefaultValuePipe(100), ParseIntPipe) limit: number,
		@Query("offset", new DefaultValuePipe(0), ParseIntPipe) offset: number,
	) {
		this.logger.log(`GET /analytics/user-activity/${userId} - Retrieve activity for user`, "AnalyticsController");

		if (requestingUserRole !== "admin" && requestingUserId !== userId) {
			throw new ForbiddenException("You can only view your own activity log");
		}

		const result = await this.analyticsService.getUserActivity(userId, limit, offset);

		return { data: result.data, total: result.total, page: Math.floor(offset / limit) + 1, limit };
	}

	@Get("user-activity/action/:action")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles("admin")
	async getActivityByAction(
		@Param("action") action: string,
		@Query("limit", new DefaultValuePipe(100), ParseIntPipe) limit: number,
	) {
		this.logger.log(
			`GET /analytics/user-activity/action/${action} - Retrieve activity by action`,
			"AnalyticsController",
		);

		const data = await this.analyticsService.getActivityByAction(action, limit);

		return { data, total: data.length, page: 1, limit };
	}

	@Get("metrics")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles("admin")
	async getDailyMetrics(
		@Query("startDate") startDate?: string,
		@Query("endDate") endDate?: string,
		@Query("limit", new DefaultValuePipe(30), ParseIntPipe) limit: number = 30,
	) {
		this.logger.log(`GET /analytics/metrics - Retrieve daily metrics`, "AnalyticsController");

		const data = await this.analyticsService.getDailyMetrics(startDate, endDate, limit);

		return { data, total: data.length, page: 1, limit };
	}

	@Get("metrics/:date")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles("admin")
	async getMetricByDate(@Param("date") date: string) {
		this.logger.log(`GET /analytics/metrics/${date} - Retrieve metric for specific date`, "AnalyticsController");

		const data = await this.analyticsService.getMetricByDate(date);

		return data;
	}

	// Worker endpoints for background job processing
	@Post("workers/aggregate-today")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles("admin")
	@HttpCode(HttpStatus.OK)
	async aggregateTodayMetrics() {
		this.logger.log(
			`POST /analytics/workers/aggregate-today - Trigger today metrics aggregation`,
			"AnalyticsController",
		);

		const metric = await this.metricsAggregationService.aggregateTodayMetrics();

		return metric;
	}

	@Post("workers/aggregate-yesterday")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles("admin")
	@HttpCode(HttpStatus.OK)
	async aggregateYesterdayMetrics() {
		this.logger.log(
			`POST /analytics/workers/aggregate-yesterday - Trigger yesterday metrics aggregation`,
			"AnalyticsController",
		);

		const metric = await this.metricsAggregationService.aggregateYesterdayMetrics();

		return metric;
	}

	@Post("workers/aggregate/:date")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles("admin")
	@HttpCode(HttpStatus.OK)
	async aggregateMetricsForDate(@Param("date") date: string) {
		this.logger.log(
			`POST /analytics/workers/aggregate/${date} - Trigger metrics aggregation for date`,
			"AnalyticsController",
		);

		const metric = await this.metricsAggregationService.aggregateMetricsForDate(date);

		return metric;
	}

	@Post("workers/backfill")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles("admin")
	@HttpCode(HttpStatus.OK)
	async backfillMetrics(@Body() body: BackfillMetricsDto) {
		const start = new Date(body.startDate);
		const end = new Date(body.endDate);

		if (start > end) {
			throw new BadRequestException("startDate must be before endDate");
		}

		const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
		if (daysDiff > 90) {
			throw new BadRequestException("Backfill range cannot exceed 90 days");
		}

		this.logger.log(
			`POST /analytics/workers/backfill - Backfill metrics from ${body.startDate} to ${body.endDate}`,
			"AnalyticsController",
		);

		const metrics = await this.metricsAggregationService.backfillMetrics(body.startDate, body.endDate);

		return metrics;
	}


	@Post("internal/track")
	@UseGuards(InternalServiceGuard)
	@HttpCode(HttpStatus.OK)
	async trackInternalEvent(@Body() trackActivityDto: TrackActivityDto) {
		this.logger.log(
			`POST /analytics/internal/track - Internal event: ${trackActivityDto.action} by user ${trackActivityDto.user_id}`,
			"AnalyticsController",
		);

		const activity = await this.analyticsService.trackActivity(trackActivityDto);

		return activity;
	}
}

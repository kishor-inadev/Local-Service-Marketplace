import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Inject, LoggerService, HttpCode, HttpStatus, UseGuards } from "@nestjs/common";
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard as RolesGuard, Roles, RequirePermissions } from '@/common/rbac';
import { FeatureFlagService } from '../services/feature-flag.service';
import { CreateFeatureFlagDto } from '../dto/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from '../dto/update-feature-flag.dto';
import { FeatureFlagQueryDto } from "../dto/feature-flag-query.dto";

@UseGuards(JwtAuthGuard, RolesGuard)
@RequirePermissions('admin.access')
@Controller("feature-flags")
export class FeatureFlagController {
	constructor(
		@Inject(WINSTON_MODULE_NEST_PROVIDER)
		private readonly logger: LoggerService,
		private readonly featureFlagService: FeatureFlagService,
	) {}

	@Post()
	async createFeatureFlag(@Body() createFlagDto: CreateFeatureFlagDto) {
		this.logger.log(`POST /feature-flags - Create feature flag: ${createFlagDto.key}`, "FeatureFlagController");

		const flag = await this.featureFlagService.createFeatureFlag(createFlagDto);

		return flag;
	}

	@Get()
	async getAllFeatureFlags(@Query() queryDto: FeatureFlagQueryDto) {
		this.logger.log("GET /feature-flags - Retrieve all feature flags", "FeatureFlagController");

		return this.featureFlagService.getAllFeatureFlags(queryDto);
	}

	@Get(":key/enabled")
	async isFeatureEnabled(@Param("key") key: string, @Query("userId") userId?: string) {
		this.logger.log(`GET /feature-flags/${key}/enabled - Check if feature is enabled`, "FeatureFlagController");

		const enabled = await this.featureFlagService.isFeatureEnabled(key, userId);

		return { enabled };
	}

	@Get(":key")
	async getFeatureFlagByKey(@Param("key") key: string) {
		this.logger.log(`GET /feature-flags/${key} - Retrieve feature flag by key`, "FeatureFlagController");

		const flag = await this.featureFlagService.getFeatureFlagByKey(key);

		return flag;
	}

	@Patch(":key")
	@HttpCode(HttpStatus.OK)
	async updateFeatureFlag(@Param("key") key: string, @Body() updateFlagDto: UpdateFeatureFlagDto) {
		this.logger.log(`PATCH /feature-flags/${key} - Update feature flag`, "FeatureFlagController");

		const flag = await this.featureFlagService.updateFeatureFlag(key, updateFlagDto);

		return flag;
	}

	@Delete(":key")
	@HttpCode(HttpStatus.OK)
	async deleteFeatureFlag(@Param("key") key: string) {
		this.logger.log(`DELETE /feature-flags/${key} - Delete feature flag`, "FeatureFlagController");

		await this.featureFlagService.deleteFeatureFlag(key);

		return { message: "Feature flag deleted successfully" };
	}
}

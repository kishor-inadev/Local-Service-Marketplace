/// <reference types="jest" />

import { FeatureFlagService } from "./feature-flag.service";

describe("FeatureFlagService", () => {
	const createService = () => {
		const featureFlagRepository = {
			createFeatureFlag: jest
				.fn()
				.mockResolvedValue({
					id: "ff-1",
					key: "new_feature",
					enabled: true,
					rollout_percentage: 100,
					created_at: new Date(),
				}),
			getFeatureFlagByKey: jest.fn().mockResolvedValue(null),
			findFeatureFlags: jest.fn().mockResolvedValue([]),
			countFeatureFlags: jest.fn().mockResolvedValue(0),
			updateFeatureFlag: jest.fn().mockResolvedValue(null),
			deleteFeatureFlag: jest.fn().mockResolvedValue(true),
		} as any;

		const redisService = {
			get: jest.fn().mockResolvedValue(null),
			set: jest.fn().mockResolvedValue("OK"),
			del: jest.fn().mockResolvedValue(1),
			addJob: jest.fn().mockResolvedValue(undefined),
		} as any;

		const logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() } as any;

		const service = new FeatureFlagService(logger, featureFlagRepository, redisService);

		return { service, featureFlagRepository, redisService, logger };
	};

	describe("createFeatureFlag", () => {
		it("creates a feature flag and caches it", async () => {
			const { service, featureFlagRepository, redisService } = createService();

			const result = await service.createFeatureFlag({
				key: "new_feature",
				enabled: true,
				rollout_percentage: 100,
			} as any);

			expect(featureFlagRepository.createFeatureFlag).toHaveBeenCalled();
			expect(redisService.set).toHaveBeenCalledWith("feature_flag:new_feature", expect.any(String), 300);
			expect(result.key).toBe("new_feature");
		});

		it("throws and logs on failure", async () => {
			const { service, featureFlagRepository, logger } = createService();
			featureFlagRepository.createFeatureFlag.mockRejectedValue(new Error("duplicate key"));

			await expect(service.createFeatureFlag({ key: "dup", enabled: true } as any)).rejects.toThrow("duplicate key");
			expect(logger.error).toHaveBeenCalled();
		});
	});

	describe("getFeatureFlagByKey", () => {
		it("returns cached flag if available", async () => {
			const { service, redisService, featureFlagRepository } = createService();
			const cachedFlag = { id: "ff-1", key: "cached_flag", enabled: true };
			redisService.get.mockResolvedValue(JSON.stringify(cachedFlag));

			const result = await service.getFeatureFlagByKey("cached_flag");

			expect(result).toEqual(cachedFlag);
			expect(featureFlagRepository.getFeatureFlagByKey).not.toHaveBeenCalled();
		});

		it("falls back to database on cache miss", async () => {
			const { service, redisService, featureFlagRepository } = createService();
			redisService.get.mockResolvedValue(null);
			const dbFlag = { id: "ff-2", key: "db_flag", enabled: false };
			featureFlagRepository.getFeatureFlagByKey.mockResolvedValue(dbFlag);

			const result = await service.getFeatureFlagByKey("db_flag");

			expect(result).toEqual(dbFlag);
			expect(featureFlagRepository.getFeatureFlagByKey).toHaveBeenCalledWith("db_flag");
			expect(redisService.set).toHaveBeenCalled();
		});

		it("returns null for non-existent flag", async () => {
			const { service } = createService();

			const result = await service.getFeatureFlagByKey("nonexistent");

			expect(result).toBeNull();
		});
	});

	describe("getAllFeatureFlags", () => {
		it("returns paginated feature flags", async () => {
			const { service, featureFlagRepository } = createService();
			featureFlagRepository.findFeatureFlags.mockResolvedValue([{ id: "ff-1" }]);
			featureFlagRepository.countFeatureFlags.mockResolvedValue(1);

			const result = await service.getAllFeatureFlags({} as any);

			expect(result.data).toHaveLength(1);
			expect(result.total).toBe(1);
			expect(result.page).toBe(1);
		});

		it("rejects invalid rollout percentage range", async () => {
			const { service } = createService();

			await expect(
				service.getAllFeatureFlags({ minRolloutPercentage: 80, maxRolloutPercentage: 20 } as any),
			).rejects.toThrow();
		});
	});
});

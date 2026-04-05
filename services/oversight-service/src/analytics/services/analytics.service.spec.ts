/// <reference types="jest" />

import { AnalyticsService } from "./analytics.service";

describe("AnalyticsService", () => {
	const createService = () => {
		const userActivityRepository = {
			trackActivity: jest
				.fn()
				.mockResolvedValue({
					id: "act-1",
					user_id: "user-1",
					action: "page_view",
					metadata: {},
					created_at: new Date(),
				}),
			getUserActivity: jest.fn().mockResolvedValue([]),
			getUserActivityCount: jest.fn().mockResolvedValue(0),
			getAllActivity: jest.fn().mockResolvedValue([]),
			getActivityCount: jest.fn().mockResolvedValue(0),
		} as any;

		const metricsRepository = {
			getDailyMetrics: jest.fn().mockResolvedValue([]),
			aggregateMetrics: jest.fn().mockResolvedValue({}),
		} as any;

		const logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() } as any;

		const service = new AnalyticsService(logger, userActivityRepository, metricsRepository);

		return { service, userActivityRepository, metricsRepository, logger };
	};

	describe("trackActivity", () => {
		it("tracks a user activity", async () => {
			const { service, userActivityRepository } = createService();
			const dto = { user_id: "user-1", action: "page_view", metadata: { page: "/home" } };

			const result = await service.trackActivity(dto as any);

			expect(userActivityRepository.trackActivity).toHaveBeenCalledWith(dto);
			expect(result.id).toBe("act-1");
		});

		it("throws and logs on repository failure", async () => {
			const { service, userActivityRepository, logger } = createService();
			userActivityRepository.trackActivity.mockRejectedValue(new Error("DB error"));

			await expect(service.trackActivity({ user_id: "u1", action: "test" } as any)).rejects.toThrow("DB error");
			expect(logger.error).toHaveBeenCalled();
		});
	});

	describe("getUserActivity", () => {
		it("returns paginated user activity", async () => {
			const { service, userActivityRepository } = createService();
			userActivityRepository.getUserActivity.mockResolvedValue([{ id: "a1" }]);
			userActivityRepository.getUserActivityCount.mockResolvedValue(1);

			const result = await service.getUserActivity("user-1", 10, 0);

			expect(result.data).toHaveLength(1);
			expect(result.total).toBe(1);
			expect(userActivityRepository.getUserActivity).toHaveBeenCalledWith("user-1", 10, 0);
		});

		it("uses default pagination values", async () => {
			const { service, userActivityRepository } = createService();

			await service.getUserActivity("user-1");

			expect(userActivityRepository.getUserActivity).toHaveBeenCalledWith("user-1", 100, 0);
		});
	});

	describe("getAllActivity", () => {
		it("returns all activity without user filter", async () => {
			const { service, userActivityRepository } = createService();
			userActivityRepository.getAllActivity.mockResolvedValue([{ id: "a1" }, { id: "a2" }]);
			userActivityRepository.getActivityCount.mockResolvedValue(2);

			const result = await service.getAllActivity(50, 0);

			expect(result.data).toHaveLength(2);
			expect(result.total).toBe(2);
		});
	});
});

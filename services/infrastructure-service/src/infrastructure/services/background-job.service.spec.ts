/// <reference types="jest" />

import { BackgroundJobService } from "./background-job.service";

describe("BackgroundJobService", () => {
	const createService = () => {
		const backgroundJobRepository = {
			createJob: jest
				.fn()
				.mockResolvedValue({
					id: "job-1",
					job_type: "send_email",
					status: "pending",
					payload: {},
					created_at: new Date(),
				}),
			getJobById: jest.fn().mockResolvedValue(null),
			findJobs: jest.fn().mockResolvedValue([]),
			countJobs: jest.fn().mockResolvedValue(0),
			getJobsByStatus: jest.fn().mockResolvedValue([]),
			updateJobStatus: jest.fn().mockResolvedValue(null),
		} as any;

		const jobQueue = {
			add: jest.fn().mockResolvedValue({ id: 'bullmq-job-1' }),
			getJobCounts: jest.fn().mockResolvedValue({ waiting: 0, active: 0, completed: 1, failed: 0 }),
		} as any;

		const logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() } as any;

		const service = new BackgroundJobService(logger, backgroundJobRepository, jobQueue);

		return { service, backgroundJobRepository, jobQueue, logger };
	};

	describe("createJob", () => {
		it("creates a job and adds to BullMQ queue", async () => {
			const { service, backgroundJobRepository, jobQueue } = createService();

			const result = await service.createJob({ jobType: "send_email", payload: { to: "test@test.com" } } as any);

			expect(backgroundJobRepository.createJob).toHaveBeenCalled();
			expect(jobQueue.add).toHaveBeenCalledWith(
				"send_email",
				expect.objectContaining({ jobId: "job-1" }),
			);
			expect(result.id).toBe("job-1");
		});

		it("throws and logs on failure", async () => {
			const { service, backgroundJobRepository, logger } = createService();
			backgroundJobRepository.createJob.mockRejectedValue(new Error("DB error"));

			await expect(service.createJob({ jobType: "fail", payload: {} } as any)).rejects.toThrow("DB error");
			expect(logger.error).toHaveBeenCalled();
		});
	});

	describe("getJobById", () => {
		it("retrieves a job by ID", async () => {
			const { service, backgroundJobRepository } = createService();
			backgroundJobRepository.getJobById.mockResolvedValue({ id: "job-1", status: "completed" });

			const result = await service.getJobById("job-1");

			expect(backgroundJobRepository.getJobById).toHaveBeenCalledWith("job-1");
			expect(result?.id).toBe("job-1");
		});

		it("returns null for non-existent job", async () => {
			const { service } = createService();

			const result = await service.getJobById("nonexistent");

			expect(result).toBeNull();
		});
	});

	describe("getAllJobs", () => {
		it("returns paginated jobs", async () => {
			const { service, backgroundJobRepository } = createService();
			backgroundJobRepository.findJobs.mockResolvedValue([{ id: "j1" }]);
			backgroundJobRepository.countJobs.mockResolvedValue(1);

			const result = await service.getAllJobs({} as any);

			expect(result.data).toHaveLength(1);
			expect(result.total).toBe(1);
			expect(result.page).toBe(1);
		});

		it("rejects invalid date range", async () => {
			const { service } = createService();

			await expect(
				service.getAllJobs({ createdFrom: new Date("2026-03-20"), createdTo: new Date("2026-03-10") } as any),
			).rejects.toThrow();
		});

		it("rejects invalid attempts range", async () => {
			const { service } = createService();

			await expect(service.getAllJobs({ minAttempts: 10, maxAttempts: 2 } as any)).rejects.toThrow();
		});
	});
});

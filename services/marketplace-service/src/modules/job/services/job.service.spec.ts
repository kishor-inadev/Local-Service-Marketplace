/// <reference types="jest" />

import { JobService } from "./job.service";
import { BadRequestException } from "../../../common/exceptions/http.exceptions";

describe("JobService list validation", () => {
	const createService = () => {
		const jobRepository = { getJobsPaginated: jest.fn(), countJobs: jest.fn() } as any;

		const service = new JobService(
			jobRepository,
			{} as any,
			{ isCacheEnabled: jest.fn().mockReturnValue(false) } as any,
			{} as any,
			{} as any,
			{ log: jest.fn(), warn: jest.fn() } as any,
		);

		return { service };
	};

	it("rejects started_from > started_to", async () => {
		const { service } = createService();
		await expect(service.getJobs({ started_from: "2026-03-20", started_to: "2026-03-10" } as any)).rejects.toThrow(
			BadRequestException,
		);
	});

	it("rejects completed_from > completed_to", async () => {
		const { service } = createService();
		await expect(service.getJobs({ completed_from: "2026-03-20", completed_to: "2026-03-10" } as any)).rejects.toThrow(
			BadRequestException,
		);
	});

	it("rejects cursor with page", async () => {
		const { service } = createService();
		await expect(service.getJobs({ cursor: "id", page: 2 } as any)).rejects.toThrow(BadRequestException);
	});
});

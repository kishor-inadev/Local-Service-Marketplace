/// <reference types="jest" />

import { ProposalService } from "./proposal.service";
import { BadRequestException } from "../../../common/exceptions/http.exceptions";

describe("ProposalService list validation", () => {
	const createService = () => {
		const proposalRepository = { getProposalsPaginated: jest.fn(), countProposals: jest.fn() } as any;

		const service = new ProposalService(
			proposalRepository,
			{} as any,
			{} as any,
			{} as any,
			{ log: jest.fn(), warn: jest.fn() } as any,
		);

		return { service };
	};

	it("rejects min_price > max_price", async () => {
		const { service } = createService();
		await expect(service.getProposals({ min_price: 500, max_price: 100 } as any)).rejects.toThrow(BadRequestException);
	});

	it("rejects created_from > created_to", async () => {
		const { service } = createService();
		await expect(service.getProposals({ created_from: "2026-03-20", created_to: "2026-03-10" } as any)).rejects.toThrow(
			BadRequestException,
		);
	});

	it("rejects cursor with page", async () => {
		const { service } = createService();
		await expect(service.getProposals({ cursor: "id", page: 2 } as any)).rejects.toThrow(BadRequestException);
	});
});

/// <reference types="jest" />

import { PaymentService } from "./payment.service";
import { BadRequestException } from "../../common/exceptions/http.exceptions";

describe("PaymentService list validation", () => {
	const createService = () => {
		const paymentRepository = {
			getPaymentsByUserPaginated: jest.fn(),
			countPaymentsByUser: jest.fn(),
			getProviderTransactions: jest.fn(),
		} as any;

		const service = new PaymentService(
			{ log: jest.fn() } as any,
			paymentRepository,
			{} as any,
			{} as any,
			{} as any,
			{} as any,
		);

		return { service };
	};

	it("rejects invalid date range for my payments", async () => {
		const { service } = createService();
		await expect(
			service.getPaymentsByUserPaginated("user-1", { created_from: "2026-03-20", created_to: "2026-03-10" } as any),
		).rejects.toThrow(BadRequestException);
	});

	it("rejects cursor with page for provider transactions", async () => {
		const { service } = createService();
		await expect(service.getProviderTransactions("provider-1", { cursor: "x", page: 2 } as any)).rejects.toThrow(
			BadRequestException,
		);
	});
});

import { BadRequestException } from "../exceptions/http.exceptions";
import { resolvePagination, validateDateRange } from "./list-query-validation.util";

describe("list-query-validation.util", () => {
	it("derives offset from page and limit", () => {
		expect(resolvePagination({ page: 3, limit: 25 })).toEqual({ page: 3, limit: 25, offset: 50 });
	});

	it("derives page from offset when page is omitted", () => {
		expect(resolvePagination({ limit: 10, offset: 30 })).toEqual({ page: 4, limit: 10, offset: 30 });
	});

	it("rejects conflicting page and offset values", () => {
		expect(() => resolvePagination({ page: 2, limit: 20, offset: 5 })).toThrow(BadRequestException);
	});

	it("rejects invalid date ranges", () => {
		expect(() => validateDateRange(new Date("2024-01-02"), new Date("2024-01-01"), "createdAt")).toThrow(
			BadRequestException,
		);
	});
});

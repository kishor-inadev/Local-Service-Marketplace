/// <reference types="jest" />

import { BadRequestException } from "../exceptions/http.exceptions";
import { validateCursorMode, validateDateRange, validateMinMaxRange } from "./list-query-validation.util";

describe("list-query-validation.util", () => {
	it("throws when min is greater than max", () => {
		expect(() => validateMinMaxRange(10, 5, "min_budget", "max_budget")).toThrow(BadRequestException);
	});

	it("throws when date range is invalid", () => {
		expect(() => validateDateRange("2026-03-30", "2026-03-01", "created_from", "created_to")).toThrow(
			BadRequestException,
		);
	});

	it("throws when cursor and page are both provided", () => {
		expect(() => validateCursorMode("abc", 1, "created_at", "desc", "created_at", "desc")).toThrow(BadRequestException);
	});

	it("throws when cursor sortBy is unsupported", () => {
		expect(() => validateCursorMode("abc", undefined, "price", "desc", "created_at", "desc")).toThrow(
			BadRequestException,
		);
	});

	it("throws when cursor sortOrder is unsupported", () => {
		expect(() => validateCursorMode("abc", undefined, "created_at", "asc", "created_at", "desc")).toThrow(
			BadRequestException,
		);
	});

	it("does not throw for valid cursor mode", () => {
		expect(() => validateCursorMode("abc", undefined, "created_at", "desc", "created_at", "desc")).not.toThrow();
	});
});

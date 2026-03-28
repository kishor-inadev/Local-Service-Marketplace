import { BadRequestException } from "../exceptions/http.exceptions";

export interface PaginationQuery {
	page?: number;
	limit?: number;
	offset?: number;
}

export interface ResolvedPagination {
	page: number;
	limit: number;
	offset: number;
}

export function resolvePagination(
	query: PaginationQuery,
	defaults: { page?: number; limit?: number } = {},
): ResolvedPagination {
	const limit = query.limit ?? defaults.limit ?? 20;

	if (query.page !== undefined && query.offset !== undefined) {
		const expectedOffset = (query.page - 1) * limit;

		if (query.offset !== expectedOffset) {
			throw new BadRequestException("offset must match page and limit when both are provided");
		}
	}

	const offset = query.offset ?? Math.max(((query.page ?? defaults.page ?? 1) - 1) * limit, 0);
	const page = query.page ?? Math.floor(offset / limit) + 1;

	return { page, limit, offset };
}

export function validateDateRange(from?: Date, to?: Date, label: string = "date"): void {
	if (from && to && from > to) {
		throw new BadRequestException(`${label} start must be before or equal to ${label} end`);
	}
}

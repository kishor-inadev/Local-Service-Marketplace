import { BadRequestException } from "../exceptions/http.exceptions";

export function validateMinMaxRange(
  minValue: number | undefined,
  maxValue: number | undefined,
  minLabel: string,
  maxLabel: string,
): void {
  if (minValue !== undefined && maxValue !== undefined && minValue > maxValue) {
    throw new BadRequestException(
      `${minLabel} cannot be greater than ${maxLabel}`,
    );
  }
}

export function validateDateRange(
  from: string | undefined,
  to: string | undefined,
  fromLabel: string,
  toLabel: string,
): void {
  if (!from || !to) {
    return;
  }

  const fromTime = new Date(from).getTime();
  const toTime = new Date(to).getTime();

  if (fromTime > toTime) {
    throw new BadRequestException(
      `${fromLabel} cannot be greater than ${toLabel}`,
    );
  }
}

export function validateCursorMode(
  cursor: string | undefined,
  page: number | undefined,
  sortBy: string | undefined,
  sortOrder: string | undefined,
  cursorSortBy: string,
  cursorSortOrder: string,
): void {
  if (!cursor) {
    return;
  }

  if (page) {
    throw new BadRequestException("Use either cursor or page, not both");
  }

  if (sortBy && sortBy !== cursorSortBy) {
    throw new BadRequestException(
      `Cursor pagination supports sortBy=${cursorSortBy} only`,
    );
  }

  if (sortOrder && sortOrder !== cursorSortOrder) {
    throw new BadRequestException(
      `Cursor pagination supports sortOrder=${cursorSortOrder} only`,
    );
  }
}

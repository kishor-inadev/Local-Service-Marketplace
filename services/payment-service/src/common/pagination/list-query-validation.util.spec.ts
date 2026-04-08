/// <reference types="jest" />

import { BadRequestException } from "../exceptions/http.exceptions";
import {
  validateCursorMode,
  validateDateRange,
} from "./list-query-validation.util";

describe("payment list-query-validation.util", () => {
  it("throws when date range is invalid", () => {
    expect(() =>
      validateDateRange(
        "2026-03-30",
        "2026-03-01",
        "created_from",
        "created_to",
      ),
    ).toThrow(BadRequestException);
  });

  it("throws when cursor and page are both provided", () => {
    expect(() =>
      validateCursorMode("abc", 1, "created_at", "desc", "created_at", "desc"),
    ).toThrow(BadRequestException);
  });

  it("accepts valid cursor mode", () => {
    expect(() =>
      validateCursorMode(
        "abc",
        undefined,
        "created_at",
        "desc",
        "created_at",
        "desc",
      ),
    ).not.toThrow();
  });
});

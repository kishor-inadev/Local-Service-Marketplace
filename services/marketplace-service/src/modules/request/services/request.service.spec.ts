/// <reference types="jest" />

import { RequestService } from "./request.service";
import { BadRequestException } from "../../../common/exceptions/http.exceptions";

describe("RequestService list validation", () => {
  const createService = () => {
    const requestRepository = {
      getRequestsPaginated: jest.fn(),
      countRequests: jest.fn(),
    } as any;

    const service = new RequestService(
      requestRepository,
      {} as any,
      {} as any,
      {} as any,
      { isCacheEnabled: jest.fn().mockReturnValue(false) } as any,
      {} as any,
      {} as any,
      { log: jest.fn(), warn: jest.fn() } as any,
    );

    return { service };
  };

  it("rejects min_budget > max_budget", async () => {
    const { service } = createService();
    await expect(
      service.getRequests({ min_budget: 100, max_budget: 20 } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it("rejects created_from > created_to", async () => {
    const { service } = createService();
    await expect(
      service.getRequests({
        created_from: "2026-03-20",
        created_to: "2026-03-10",
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it("rejects cursor with page", async () => {
    const { service } = createService();
    await expect(
      service.getRequests({ cursor: "id", page: 2 } as any),
    ).rejects.toThrow(BadRequestException);
  });
});

/// <reference types="jest" />

import { SubscriptionService } from "./subscription.service";
import { BadRequestException } from "../../common/exceptions/http.exceptions";

describe("SubscriptionService list validation", () => {
  const createService = () => {
    const subscriptionRepository = {
      findByProviderPaginated: jest.fn(),
      countByProvider: jest.fn(),
    } as any;

    const service = new SubscriptionService(subscriptionRepository, {} as any);
    return { service };
  };

  it("rejects cursor with page for provider subscriptions", async () => {
    const { service } = createService();
    await expect(
      service.getProviderSubscriptionsPaginated("provider-1", {
        cursor: "x",
        page: 2,
      } as any),
    ).rejects.toThrow(BadRequestException);
  });
});

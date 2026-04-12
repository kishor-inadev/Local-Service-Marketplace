/// <reference types="jest" />

import { PaymentService } from "./payment.service";
import { BadRequestException } from "../../common/exceptions/http.exceptions";

const makeLogger = () =>
  ({ log: jest.fn(), warn: jest.fn(), error: jest.fn() }) as any;
const makeKafka = () =>
  ({ publishEvent: jest.fn().mockResolvedValue(undefined) }) as any;
const makeAnalytics = () => ({ track: jest.fn() }) as any;
const makeGateway = () =>
  ({
    charge: jest.fn().mockResolvedValue({
      transactionId: "txn_mock_123",
      status: "succeeded",
    }),
    chargeWith: jest.fn().mockResolvedValue({
      transactionId: "txn_mock_123",
      status: "succeeded",
    }),
    isMockMode: jest.fn().mockReturnValue(true),
    getActiveGatewayName: jest.fn().mockReturnValue("mock"),
  }) as any;

describe("PaymentService list validation", () => {
  const createService = () => {
    const paymentRepository = {
      getPaymentsByUserPaginated: jest.fn(),
      countPaymentsByUser: jest.fn(),
      getProviderTransactions: jest.fn(),
    } as any;

    const service = new PaymentService(
      makeLogger(),
      { add: jest.fn().mockResolvedValue({}) } as any, // notificationQueue
      { add: jest.fn().mockResolvedValue({}) } as any, // analyticsQueue
      paymentRepository,
      {} as any,
      makeKafka(),
      {} as any,
      { getUserById: jest.fn().mockResolvedValue(null) } as any, // userClient
      makeAnalytics(),
      makeGateway(),
    );

    return { service };
  };

  it("rejects invalid date range for my payments", async () => {
    const { service } = createService();
    await expect(
      service.getPaymentsByUserPaginated("user-1", {
        created_from: "2026-03-20",
        created_to: "2026-03-10",
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it("rejects cursor with page for provider transactions", async () => {
    const { service } = createService();
    await expect(
      service.getProviderTransactions("provider-1", {
        cursor: "x",
        page: 2,
      } as any),
    ).rejects.toThrow(BadRequestException);
  });
});

describe("PaymentService.createPayment", () => {
  const makePaymentEntity = (overrides = {}) => ({
    id: "pay-1",
    job_id: "job-1",
    amount: 100,
    currency: "USD",
    transaction_id: "txn_test_123",
    ...overrides,
  });

  const createService = (
    overrides: {
      couponService?: any;
      paymentRepository?: any;
      notificationClient?: any;
      userClient?: any;
      gateway?: any;
    } = {},
  ) => {
    const paymentRepository = overrides.paymentRepository ?? {
      createPayment: jest.fn().mockResolvedValue(makePaymentEntity()),
      updatePaymentStatus: jest.fn().mockResolvedValue(undefined),
      getPaymentsByJobId: jest.fn().mockResolvedValue([]),
    };
    const couponService = overrides.couponService ?? {
      validateAndUseCoupon: jest.fn().mockResolvedValue(10), // 10% discount
    };
    const notificationClient = overrides.notificationClient ?? {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };
    const userClient =
      overrides.userClient ??
      ({
        getUserById: jest.fn().mockResolvedValue({
          id: "user-1",
          email: "user@test.com",
          name: "Test User",
          role: "customer",
        }),
        getUserEmail: jest.fn().mockResolvedValue("user@test.com"),
      } as any);
    const gateway = overrides.gateway ?? makeGateway();
    const kafka = makeKafka();
    const analytics = makeAnalytics();
    const analyticsQueue = { add: jest.fn().mockResolvedValue({}) } as any;

    const service = new PaymentService(
      makeLogger(),
      { add: jest.fn().mockResolvedValue({}) } as any, // notificationQueue
      analyticsQueue,                                  // analyticsQueue
      paymentRepository,
      couponService,
      kafka,
      notificationClient,
      userClient,
      analytics,
      gateway,
    );

    return {
      service,
      kafka,
      analytics,
      analyticsQueue,
      paymentRepository,
      couponService,
      gateway,
    };
  };

  it("creates payment without coupon and tracks analytics", async () => {
    const { service, kafka, analyticsQueue, paymentRepository, gateway } =
      createService();

    await service.createPayment("job-1", 100, "USD", "user-1", "prov-1");

    expect(gateway.charge).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 100, currency: "USD" }),
    );
    expect(paymentRepository.createPayment).toHaveBeenCalledWith(
      "job-1",
      "user-1",
      "prov-1",
      100,
      "USD",
      "card",
      "txn_mock_123",
      "mock",
    );
    expect(paymentRepository.updatePaymentStatus).toHaveBeenCalledWith(
      "pay-1",
      "completed",
      "txn_mock_123",
    );
    expect(kafka.publishEvent).toHaveBeenCalledWith(
      "payment-events",
      expect.objectContaining({ eventType: "payment_completed" }),
    );
    expect(analyticsQueue.add).toHaveBeenCalledWith(
      "track-payment-completed",
      expect.objectContaining({
        action: "payment_completed",
        resource: "payment",
        userId: "user-1",
      }),
    );
  });

  it("applies coupon discount before creating payment", async () => {
    const { service, paymentRepository, couponService } = createService();

    await service.createPayment(
      "job-1",
      200,
      "USD",
      "user-1",
      "prov-1",
      "SAVE10",
    );

    expect(couponService.validateAndUseCoupon).toHaveBeenCalledWith(
      "SAVE10",
      "user-1",
    );
    // 200 * (1 - 10/100) = 180
    expect(paymentRepository.createPayment).toHaveBeenCalledWith(
      "job-1",
      "user-1",
      "prov-1",
      180,
      "USD",
      "card",
      expect.any(String),
      "mock",
    );
  });

  it("still creates payment when email notification fails", async () => {
    const notificationClient = {
      sendEmail: jest.fn().mockRejectedValue(new Error("SMTP error")),
    };
    const { service, paymentRepository } = createService({
      notificationClient,
    });

    await expect(
      service.createPayment("job-1", 100, "USD", "user-1", "prov-1"),
    ).resolves.toBeDefined();
    expect(paymentRepository.createPayment).toHaveBeenCalled();
  });
});

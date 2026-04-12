/// <reference types="jest" />

import { JobService } from "./job.service";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from "../../../common/exceptions/http.exceptions";
import { JobResponseDto } from "../dto/job-response.dto";

const makeLogger = () =>
  ({ log: jest.fn(), warn: jest.fn(), error: jest.fn() }) as any;
const makeKafka = () =>
  ({ publishEvent: jest.fn().mockResolvedValue(undefined) }) as any;
const makeRedis = () =>
  ({ isCacheEnabled: jest.fn().mockReturnValue(false) }) as any;
const makeAnalytics = () => ({ track: jest.fn() }) as any;
const makeQueue = () =>
  ({ add: jest.fn().mockResolvedValue(undefined) }) as any;

describe("JobService list validation", () => {
  const createService = () => {
    const jobRepository = {
      getJobsPaginated: jest.fn(),
      countJobs: jest.fn(),
    } as any;

    const service = new JobService(
      jobRepository,
      makeKafka(),
      makeRedis(),
      {} as any,
      {} as any,
      makeAnalytics(),
      makeLogger(),
      makeQueue(),
    );

    return { service };
  };

  it("rejects started_from > started_to", async () => {
    const { service } = createService();
    await expect(
      service.getJobs({
        started_from: "2026-03-20",
        started_to: "2026-03-10",
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it("rejects completed_from > completed_to", async () => {
    const { service } = createService();
    await expect(
      service.getJobs({
        completed_from: "2026-03-20",
        completed_to: "2026-03-10",
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it("rejects cursor with page", async () => {
    const { service } = createService();
    await expect(
      service.getJobs({ cursor: "id", page: 2 } as any),
    ).rejects.toThrow(BadRequestException);
  });
});

describe("JobService.createJob", () => {
  const makeJobEntity = (overrides = {}) => ({
    id: "job-1",
    request_id: "req-1",
    proposal_id: "prop-1",
    provider_id: "prov-1",
    customer_id: "cust-1",
    status: "scheduled",
    ...overrides,
  });

  it("throws ConflictException if job already exists for request", async () => {
    const jobRepository = {
      getJobByRequestId: jest.fn().mockResolvedValue(makeJobEntity()),
      createJob: jest.fn(),
    } as any;
    const service = new JobService(
      jobRepository,
      makeKafka(),
      makeRedis(),
      {} as any,
      {} as any,
      makeAnalytics(),
      makeLogger(),
      makeQueue(),
    );

    await expect(
      service.createJob({ request_id: "req-1" } as any),
    ).rejects.toThrow(ConflictException);
    expect(jobRepository.createJob).not.toHaveBeenCalled();
  });

  it("creates job, publishes kafka event, tracks analytics", async () => {
    const jobEntity = makeJobEntity();
    const jobRepository = {
      getJobByRequestId: jest.fn().mockResolvedValue(null),
      createJob: jest.fn().mockResolvedValue(jobEntity),
    } as any;
    const kafka = makeKafka();
    const analytics = makeAnalytics();
    const notificationClient = {
      sendNotification: jest.fn().mockResolvedValue(undefined),
    } as any;
    const userClient = {
      getUserEmail: jest.fn().mockResolvedValue(null),
      getProviderEmail: jest.fn().mockResolvedValue(null),
      getUserById: jest.fn().mockResolvedValue({ name: "Test Customer" }),
      getProviderById: jest.fn().mockResolvedValue({ name: "Test Provider" }),
    } as any;

    const service = new JobService(
      jobRepository,
      kafka,
      makeRedis(),
      notificationClient,
      userClient,
      analytics,
      makeLogger(),
      makeQueue(),
    );

    const dto = {
      request_id: "req-1",
      proposal_id: "prop-1",
      provider_id: "prov-1",
      customer_id: "cust-1",
    } as any;
    const result = await service.createJob(dto);

    expect(jobRepository.createJob).toHaveBeenCalledWith(dto);
    expect(kafka.publishEvent).toHaveBeenCalledWith(
      "job-events",
      expect.objectContaining({ eventType: "job_created" }),
    );
    expect(analytics.track).toHaveBeenCalledWith(
      expect.objectContaining({ action: "job_created", resource: "job" }),
    );
    expect(result).toBeInstanceOf(Object);
  });
});

describe("JobService.completeJob", () => {
  const makeJobEntity = (overrides = {}) => ({
    id: "job-2",
    request_id: "req-2",
    provider_id: "prov-2",
    customer_id: "cust-2",
    status: "in_progress",
    ...overrides,
  });

  it("throws NotFoundException when job not found", async () => {
    const jobRepository = {
      getJobById: jest.fn().mockResolvedValue(null),
    } as any;
    const service = new JobService(
      jobRepository,
      makeKafka(),
      makeRedis(),
      {} as any,
      {} as any,
      makeAnalytics(),
      makeLogger(),
      makeQueue(),
    );

    await expect(
      service.completeJob("job-none", "cust-2", "customer"),
    ).rejects.toThrow(NotFoundException);
  });

  it("throws ForbiddenException when non-owner tries to complete", async () => {
    const jobRepository = {
      getJobById: jest.fn().mockResolvedValue(makeJobEntity()),
    } as any;
    const service = new JobService(
      jobRepository,
      makeKafka(),
      makeRedis(),
      {} as any,
      {} as any,
      makeAnalytics(),
      makeLogger(),
      makeQueue(),
    );

    await expect(
      service.completeJob("job-2", "other-user", "customer"),
    ).rejects.toThrow(ForbiddenException);
  });

  it("throws BadRequestException when job already completed", async () => {
    const jobRepository = {
      getJobById: jest
        .fn()
        .mockResolvedValue(makeJobEntity({ status: "completed" })),
    } as any;
    const service = new JobService(
      jobRepository,
      makeKafka(),
      makeRedis(),
      {} as any,
      {} as any,
      makeAnalytics(),
      makeLogger(),
      makeQueue(),
    );

    await expect(
      service.completeJob("job-2", "cust-2", "customer"),
    ).rejects.toThrow(BadRequestException);
  });

  it("completes job, publishes kafka event, tracks analytics", async () => {
    const completedEntity = makeJobEntity({ status: "completed" });
    const jobRepository = {
      getJobById: jest.fn().mockResolvedValue(makeJobEntity()),
      completeJob: jest.fn().mockResolvedValue(completedEntity),
    } as any;
    const kafka = makeKafka();
    const analytics = makeAnalytics();
    const service = new JobService(
      jobRepository,
      kafka,
      makeRedis(),
      {} as any,
      {} as any,
      analytics,
      makeLogger(),
      makeQueue(),
    );

    await service.completeJob("job-2", "cust-2", "customer");

    expect(kafka.publishEvent).toHaveBeenCalledWith(
      "job-events",
      expect.objectContaining({ eventType: "job_completed" }),
    );
    expect(analytics.track).toHaveBeenCalledWith(
      expect.objectContaining({ action: "job_completed", userId: "cust-2" }),
    );
  });
});

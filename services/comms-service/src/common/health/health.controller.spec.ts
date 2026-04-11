import { HealthController } from "./health.controller";

describe("HealthController", () => {
  let controller: HealthController;
  const mockPool = {
    query: jest.fn().mockResolvedValue({ rows: [{ "?column?": 1 }] }),
  };
  const mockQueue = { getJobCounts: jest.fn().mockResolvedValue({ waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 }) };

  beforeEach(() => {
    controller = new HealthController(mockPool as any, mockQueue as any, mockQueue as any, mockQueue as any);
  });

  it("should return health status", async () => {
    const result = await controller.check();
    expect(result.status).toBe("ok");
    expect(result.service).toBe("comms-service");
    expect(result.timestamp).toBeDefined();
    expect(result.uptime).toBeDefined();
    expect(typeof result.uptime).toBe("number");
    expect(result.database.status).toBe("ok");
  });

  it("should return degraded when database is down", async () => {
    mockPool.query.mockRejectedValueOnce(new Error("connection refused"));
    const result = await controller.check();
    expect(result.status).toBe("degraded");
    expect(result.database.status).toBe("error");
  });
});

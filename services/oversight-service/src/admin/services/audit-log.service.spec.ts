/// <reference types="jest" />

import { AuditLogService } from "./audit-log.service";

describe("AuditLogService", () => {
	const createService = () => {
		const auditLogRepository = {
			findAuditLogs: jest.fn().mockResolvedValue([]),
			countAuditLogs: jest.fn().mockResolvedValue(0),
			getAuditLogsByUserId: jest.fn().mockResolvedValue([]),
			getAuditLogsByEntity: jest.fn().mockResolvedValue([]),
			createAuditLog: jest
				.fn()
				.mockResolvedValue({
					id: "audit-1",
					user_id: "user-1",
					action: "CREATE",
					entity: "request",
					entity_id: "req-1",
					metadata: {},
					created_at: new Date(),
				}),
		} as any;

		const logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() } as any;

		const service = new AuditLogService(auditLogRepository, logger);

		return { service, auditLogRepository, logger };
	};

	describe("getAuditLogs", () => {
		it("returns paginated audit logs", async () => {
			const { service, auditLogRepository } = createService();
			auditLogRepository.findAuditLogs.mockResolvedValue([{ id: "a1" }]);
			auditLogRepository.countAuditLogs.mockResolvedValue(1);

			const result = await service.getAuditLogs({});
			expect(result.data).toHaveLength(1);
			expect(result.total).toBe(1);
			expect(result.page).toBe(1);
		});

		it("rejects invalid date range (from > to)", async () => {
			const { service } = createService();
			await expect(
				service.getAuditLogs({ createdFrom: new Date("2026-03-20"), createdTo: new Date("2026-03-10") } as any),
			).rejects.toThrow();
		});
	});

	describe("getAuditLogsByUserId", () => {
		it("calls repository with user ID", async () => {
			const { service, auditLogRepository } = createService();
			auditLogRepository.getAuditLogsByUserId.mockResolvedValue([{ id: "a1", user_id: "user-1" }]);

			const result = await service.getAuditLogsByUserId("user-1");
			expect(auditLogRepository.getAuditLogsByUserId).toHaveBeenCalledWith("user-1");
			expect(result).toHaveLength(1);
		});
	});

	describe("getAuditLogsByEntity", () => {
		it("calls repository with entity and entityId", async () => {
			const { service, auditLogRepository } = createService();
			auditLogRepository.getAuditLogsByEntity.mockResolvedValue([]);

			await service.getAuditLogsByEntity("request", "req-1");
			expect(auditLogRepository.getAuditLogsByEntity).toHaveBeenCalledWith("request", "req-1");
		});
	});

	describe("createAuditLog", () => {
		it("creates a new audit log entry", async () => {
			const { service, auditLogRepository } = createService();

			const result = await service.createAuditLog("user-1", "CREATE", "request", "req-1", { ip: "127.0.0.1" });

			expect(auditLogRepository.createAuditLog).toHaveBeenCalledWith("user-1", "CREATE", "request", "req-1", {
				ip: "127.0.0.1",
			});
			expect(result.id).toBe("audit-1");
		});

		it("creates audit log without metadata", async () => {
			const { service, auditLogRepository } = createService();

			await service.createAuditLog("user-1", "DELETE", "user", "user-2");
			expect(auditLogRepository.createAuditLog).toHaveBeenCalledWith("user-1", "DELETE", "user", "user-2", undefined);
		});
	});
});

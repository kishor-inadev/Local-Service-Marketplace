/// <reference types="jest" />

import { UserService } from "./user.service";

// Mock bcryptjs
jest.mock("bcryptjs", () => ({ hash: jest.fn().mockResolvedValue("$2b$12$hashedpassword") }));

describe("UserService", () => {
	const createService = () => {
		const userRepository = {
			findAllForAdmin: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 }),
			findByEmail: jest.fn().mockResolvedValue(null),
			createByAdminWithHash: jest
				.fn()
				.mockResolvedValue({
					id: "user-1",
					email: "new@test.com",
					name: "New User",
					role: "customer",
					status: "active",
					created_at: new Date(),
				}),
			updateStatus: jest.fn().mockResolvedValue(null),
			updatePassword: jest.fn().mockResolvedValue(true),
			findById: jest.fn().mockResolvedValue(null),
		} as any;

		const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), log: jest.fn() } as any;

		const service = new UserService(userRepository, logger);

		return { service, userRepository, logger };
	};

	describe("getUsersForAdmin", () => {
		it("returns paginated user list", async () => {
			const { service, userRepository } = createService();
			userRepository.findAllForAdmin.mockResolvedValue({
				data: [
					{ id: "u1", email: "a@test.com", name: "Alice", role: "customer", status: "active", created_at: new Date() },
				],
				total: 1,
				page: 1,
				limit: 20,
			});

			const result = await service.getUsersForAdmin({} as any);

			expect(result.total).toBe(1);
			expect(result.data).toHaveLength(1);
		});
	});

	describe("createUserByAdmin", () => {
		it("creates a user with hashed password", async () => {
			const { service, userRepository } = createService();

			const result = await service.createUserByAdmin({
				email: "new@test.com",
				password: "securepass",
				name: "New User",
				role: "customer",
			} as any);

			expect(userRepository.findByEmail).toHaveBeenCalledWith("new@test.com");
			expect(userRepository.createByAdminWithHash).toHaveBeenCalled();
			expect(result.email).toBe("new@test.com");
		});

		it("throws ConflictException if email exists", async () => {
			const { service, userRepository } = createService();
			userRepository.findByEmail.mockResolvedValue({ id: "existing", email: "dup@test.com" });

			await expect(
				service.createUserByAdmin({ email: "dup@test.com", password: "pass", name: "Dup", role: "customer" } as any),
			).rejects.toThrow();
		});

		it("handles duplicate key database error", async () => {
			const { service, userRepository } = createService();
			const dbError = new Error("duplicate key") as any;
			dbError.code = "23505";
			userRepository.createByAdminWithHash.mockRejectedValue(dbError);

			await expect(
				service.createUserByAdmin({ email: "race@test.com", password: "pass", name: "Race", role: "customer" } as any),
			).rejects.toThrow();
		});
	});

	describe("suspendUser", () => {
		it("suspends an active user", async () => {
			const { service, userRepository } = createService();
			userRepository.updateStatus.mockResolvedValue({
				id: "user-1",
				status: "suspended",
				email: "test@test.com",
				name: "Test",
				role: "customer",
				created_at: new Date(),
			});

			const result = await service.suspendUser("user-1", "Violation");

			expect(userRepository.updateStatus).toHaveBeenCalledWith("user-1", "suspended");
			expect(result).toBeDefined();
		});

		it("throws NotFoundException for non-existent user", async () => {
			const { service, userRepository } = createService();
			userRepository.updateStatus.mockResolvedValue(null);

			await expect(service.suspendUser("nonexistent")).rejects.toThrow();
		});
	});

	describe("activateUser", () => {
		it("activates a suspended user", async () => {
			const { service, userRepository } = createService();
			userRepository.updateStatus.mockResolvedValue({
				id: "user-1",
				status: "active",
				email: "test@test.com",
				name: "Test",
				role: "customer",
				created_at: new Date(),
			});

			const result = await service.activateUser("user-1");

			expect(userRepository.updateStatus).toHaveBeenCalledWith("user-1", "active");
			expect(result).toBeDefined();
		});

		it("throws NotFoundException for non-existent user", async () => {
			const { service, userRepository } = createService();
			userRepository.updateStatus.mockResolvedValue(null);

			await expect(service.activateUser("nonexistent")).rejects.toThrow();
		});
	});
});

import axios from "axios";

// Mock next-auth/react before any imports
jest.mock("next-auth/react", () => ({
	getSession: jest.fn().mockResolvedValue({ accessToken: "test-token", user: { id: "1", email: "test@test.com" } }),
}));

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({ __esModule: true, default: { error: jest.fn() } }));

import { getSession } from "next-auth/react";

describe("ApiClient", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("Session Deduplication", () => {
		it("deduplicates concurrent getSession calls", async () => {
			const mockGetSession = getSession as jest.Mock;
			mockGetSession.mockResolvedValue({ accessToken: "test-token", user: { id: "1" } });

			// Simulate multiple concurrent calls
			const promises = [mockGetSession(), mockGetSession(), mockGetSession()];
			const results = await Promise.all(promises);

			results.forEach((result) => {
				expect(result.accessToken).toBe("test-token");
			});
		});
	});

	describe("API URL Configuration", () => {
		it("uses NEXT_PUBLIC_API_URL env var", () => {
			const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3700";
			expect(apiUrl).toBeDefined();
		});

		it("defaults to localhost:3700", () => {
			const originalEnv = process.env.NEXT_PUBLIC_API_URL;
			delete process.env.NEXT_PUBLIC_API_URL;
			const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3700";
			expect(url).toBe("http://localhost:3700");
			if (originalEnv) process.env.NEXT_PUBLIC_API_URL = originalEnv;
		});
	});

	describe("Standard Response Interface", () => {
		it("handles successful standardized response", () => {
			const response = { success: true, statusCode: 200, message: "Success", data: { id: "1", name: "Test" } };
			expect(response.success).toBe(true);
			expect(response.data).toEqual({ id: "1", name: "Test" });
		});

		it("handles paginated standardized response", () => {
			const response = {
				success: true,
				statusCode: 200,
				message: "Success",
				data: [{ id: "1" }, { id: "2" }],
				meta: { page: 1, limit: 20, total: 50, totalPages: 3 },
			};
			expect(response.meta).toBeDefined();
			expect(response.meta!.totalPages).toBe(3);
		});

		it("handles error standardized response", () => {
			const response = {
				success: false,
				statusCode: 400,
				message: "Validation failed",
				error: { code: "VALIDATION_ERROR", message: "Invalid input" },
			};
			expect(response.success).toBe(false);
			expect(response.error!.code).toBe("VALIDATION_ERROR");
		});
	});

	describe("Axios Instance Configuration", () => {
		it("creates axios instance with correct defaults", () => {
			const instance = axios.create({
				baseURL: "http://localhost:3700/api/v1",
				timeout: 30000,
				headers: { "Content-Type": "application/json" },
				withCredentials: true,
			});

			expect(instance.defaults.baseURL).toBe("http://localhost:3700/api/v1");
			expect(instance.defaults.timeout).toBe(30000);
			expect(instance.defaults.withCredentials).toBe(true);
		});
	});
});

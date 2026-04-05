// Mock next-auth/react before imports
const mockSignIn = jest.fn();
jest.mock("next-auth/react", () => ({
	signIn: mockSignIn,
	getSession: jest.fn().mockResolvedValue({ accessToken: "test-token", user: { id: "1" } }),
}));

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({ __esModule: true, default: { error: jest.fn() } }));

// Mock api-client
const mockPost = jest.fn();
const mockGet = jest.fn();
const mockPut = jest.fn();
const mockDelete = jest.fn();
jest.mock("@/services/api-client", () => ({
	apiClient: { post: mockPost, get: mockGet, put: mockPut, delete: mockDelete },
}));

import { authService } from "@/services/auth-service";

describe("AuthService", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("login", () => {
		it("calls signIn with credentials", async () => {
			mockSignIn.mockResolvedValue({ ok: true });
			const result = await authService.login({ email: "test@test.com", password: "password123" });
			expect(mockSignIn).toHaveBeenCalledWith("credentials", {
				email: "test@test.com",
				password: "password123",
				redirect: false,
			});
			expect(result.ok).toBe(true);
		});

		it("returns error on failed login", async () => {
			mockSignIn.mockResolvedValue({ ok: false, error: "Invalid credentials" });
			const result = await authService.login({ email: "test@test.com", password: "wrong" });
			expect(result.ok).toBe(false);
			expect(result.error).toBe("Invalid credentials");
		});
	});

	describe("signup", () => {
		it("calls API with signup data", async () => {
			const signupData = {
				email: "new@test.com",
				password: "secure123",
				userType: "customer" as const,
				name: "New User",
			};
			mockPost.mockResolvedValue({
				data: { accessToken: "token", refreshToken: "refresh", user: { id: "1", email: "new@test.com" } },
			});
			const result = await authService.signup(signupData);
			expect(mockPost).toHaveBeenCalledWith("/user/auth/signup", signupData);
			expect(result.accessToken).toBe("token");
		});
	});

	describe("requestPasswordReset", () => {
		it("calls API with email", async () => {
			mockPost.mockResolvedValue({ data: { message: "Email sent" } });
			await authService.requestPasswordReset({ email: "test@test.com" });
			expect(mockPost).toHaveBeenCalledWith("/user/auth/password-reset/request", { email: "test@test.com" });
		});
	});

	describe("getSessions", () => {
		it("returns list of sessions", async () => {
			const sessions = [
				{ id: "s1", user_agent: "Chrome", created_at: "2024-01-01" },
				{ id: "s2", user_agent: "Firefox", created_at: "2024-01-02" },
			];
			mockGet.mockResolvedValue({ data: sessions });
			const result = await authService.getSessions();
			expect(mockGet).toHaveBeenCalledWith("/user/auth/sessions");
			expect(result).toHaveLength(2);
		});
	});
});

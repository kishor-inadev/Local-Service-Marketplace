import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LoginPage from "@/app/(auth)/login/page";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";

jest.mock("@/hooks/useAuth");
jest.mock("next/navigation", () => ({ useRouter: jest.fn(), useSearchParams: jest.fn(() => new URLSearchParams()) }));
jest.mock("@/services/auth-service", () => ({ authService: { checkIdentifier: jest.fn() } }));

const createWrapper = () => {
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

	return ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
};

describe("LoginPage", () => {
	const mockLogin = jest.fn();
	const mockPush = jest.fn();

	beforeEach(() => {
		(useAuth as jest.Mock).mockReturnValue({
			user: null,
			login: mockLogin,
			loginWithPhone: jest.fn(),
			loginWithEmailOTP: jest.fn(),
			loginWithOTP: jest.fn(),
			requestEmailOTP: jest.fn(),
			requestOTP: jest.fn(),
			loginWithGoogle: jest.fn(),
			loginWithFacebook: jest.fn(),
			isAuthenticated: false,
		});
		(useRouter as jest.Mock).mockReturnValue({ push: mockPush });
		(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it("renders login heading and initial form", () => {
		render(<LoginPage />, { wrapper: createWrapper() });

		expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/email or phone/i)).toBeInTheDocument();
	});

	it("renders create account link", () => {
		render(<LoginPage />, { wrapper: createWrapper() });

		expect(screen.getByText(/create a new account/i)).toBeInTheDocument();
	});
});

// NextAuthOptions not imported directly to avoid @auth/core v5 type conflict.
// TypeScript infers the correct v4 type from NextAuth(authOptions) at call site.
import CredentialsProvider from "next-auth/providers/credentials";
import { TOKEN_CONFIG } from "@/types/auth-alignment";
import { serverAuthService } from "@/services/server-auth-service";

async function refreshAccessToken(token: any) {
	try {
		const data = await serverAuthService.refreshToken(token.refreshToken);
		if (!data) throw new Error("Token refresh failed");

		return {
			...token,
			accessToken: data.accessToken,
			accessTokenExpires: Date.now() + TOKEN_CONFIG.ACCESS_TOKEN_EXPIRATION,
			refreshToken: data.refreshToken ?? token.refreshToken,
		};
	} catch (error) {
		console.error('Error refreshing access token:', error);
		return { ...token, error: "RefreshAccessTokenError" as const };
	}
}

export const authOptions = {
	providers: [
		// Email + Password Login
		CredentialsProvider({
			id: "credentials",
			name: "Email & Password",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				try {
					if (!credentials?.email || !credentials?.password) return null;

					const auth = await serverAuthService.loginWithEmail(
						credentials.email as string,
						credentials.password as string,
					);
					if (!auth?.user) return null;

					return {
						id: auth.user.id,
						email: auth.user.email,
						name: auth.user.name || auth.user.email.split("@")[0],
						role: auth.user.role,
						emailVerified: auth.user.email_verified,
						image: auth.user.profile_picture_url || null,
						accessToken: auth.accessToken,
						refreshToken: auth.refreshToken,
					};
				} catch (error) {
					console.error("Authentication error:", error);
					return null;
				}
			},
		}),

		// Phone + Password Login
		CredentialsProvider({
			id: "phone-password",
			name: "Phone & Password",
			credentials: {
				phone: { label: "Phone", type: "tel" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				try {
					if (!credentials?.phone || !credentials?.password) return null;

					const auth = await serverAuthService.loginWithPhone(
						credentials.phone as string,
						credentials.password as string,
					);
					if (!auth?.user) return null;

					return {
						id: auth.user.id,
						email: auth.user.email,
						name: auth.user.name || "User",
						role: auth.user.role,
						emailVerified: auth.user.email_verified,
						image: auth.user.profile_picture_url || null,
						accessToken: auth.accessToken,
						refreshToken: auth.refreshToken,
					};
				} catch (error) {
					console.error("Phone authentication error:", error);
					return null;
				}
			},
		}),

		// Phone + OTP Login
		CredentialsProvider({
			id: "phone-otp",
			name: "Phone & OTP",
			credentials: {
				phone: { label: "Phone", type: "tel" },
				otp: { label: "OTP", type: "text" },
			},
			async authorize(credentials) {
				try {
					if (!credentials?.phone || !credentials?.otp) return null;

					const auth = await serverAuthService.verifyPhoneOtp(
						credentials.phone as string,
						credentials.otp as string,
					);
					if (!auth?.user) return null;

					return {
						id: auth.user.id,
						email: auth.user.email,
						name: auth.user.name || "User",
						role: auth.user.role,
						emailVerified: auth.user.email_verified,
						image: auth.user.profile_picture_url || null,
						accessToken: auth.accessToken,
						refreshToken: auth.refreshToken,
					};
				} catch (error) {
					console.error("OTP authentication error:", error);
					return null;
				}
			},
		}),

		// Email + OTP Login
		CredentialsProvider({
			id: "email-otp",
			name: "Email & OTP",
			credentials: {
				email: { label: "Email", type: "email" },
				otp: { label: "OTP", type: "text" },
			},
			async authorize(credentials) {
				try {
					if (!credentials?.email || !credentials?.otp) return null;

					const auth = await serverAuthService.verifyEmailOtp(
						credentials.email as string,
						credentials.otp as string,
					);
					if (!auth?.user) return null;

					return {
						id: auth.user.id,
						email: auth.user.email,
						name: auth.user.name || auth.user.email.split("@")[0],
						role: auth.user.role,
						emailVerified: auth.user.email_verified,
						image: auth.user.profile_picture_url || null,
						accessToken: auth.accessToken,
						refreshToken: auth.refreshToken,
					};
				} catch (error) {
					console.error("Email OTP authentication error:", error);
					return null;
				}
			},
		}),
	],
	session: {
		strategy: "jwt",
		maxAge: 7 * 24 * 60 * 60, // 7 days (matches refresh token)
	},
	callbacks: {
		async jwt({ token, user, trigger, session }: any) {
			// Initial sign in
			if (user) {
				return {
					...token,
					id: user.id,
					role: user.role,
					emailVerified: typeof user.emailVerified === "boolean" ? user.emailVerified : false,
					accessToken: user.accessToken,
					refreshToken: user.refreshToken,
					accessTokenExpires: Date.now() + TOKEN_CONFIG.ACCESS_TOKEN_EXPIRATION,
				};
			}

			// Handle session updates (e.g., from client-side session.update())
			if (trigger === "update" && session) {
				return { ...token, ...session };
			}

			// Return previous token if the access token has not expired yet
			if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
				return token;
			}

			// Access token has expired, try to refresh it
			return refreshAccessToken(token);
		},
		async session({ session, token }: any) {
			// Add custom fields to session
			if (token && session.user) {
				session.user.id = token.id || "";
				session.user.role = token.role || "customer";
				session.user.emailVerified = Boolean(token.emailVerified);
				session.accessToken = token.accessToken;
				session.refreshToken = token.refreshToken;
				session.accessTokenExpires = token.accessTokenExpires;
				session.error = token.error;
			}
			return session;
		},
	},
	pages: {
		signIn: "/login",
		error: "/error",
	},
	secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
};

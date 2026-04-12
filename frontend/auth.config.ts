// NextAuthOptions not imported directly to avoid @auth/core v5 type conflict.
// TypeScript infers the correct v4 type from NextAuth(authOptions) at call site.
import CredentialsProvider from "next-auth/providers/credentials";
import { TOKEN_CONFIG } from "@/types/auth-alignment";
import { serverAuthService } from "@/services/server-auth-service";

async function refreshAccessToken(token: any) {
	try {
		if (!token?.refreshToken) {
			console.error("No refresh token available");
			return { ...token, error: "RefreshAccessTokenError" as const };
		}
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
			credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
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
			credentials: { phone: { label: "Phone", type: "tel" }, password: { label: "Password", type: "password" } },
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
			credentials: { phone: { label: "Phone", type: "tel" }, otp: { label: "OTP", type: "text" } },
			async authorize(credentials) {
				try {
					if (!credentials?.phone || !credentials?.otp) return null;

					const auth = await serverAuthService.verifyPhoneOtp(credentials.phone as string, credentials.otp as string);
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
			credentials: { email: { label: "Email", type: "email" }, otp: { label: "OTP", type: "text" } },
			async authorize(credentials) {
				try {
					if (!credentials?.email || !credentials?.otp) return null;

					const auth = await serverAuthService.verifyEmailOtp(credentials.email as string, credentials.otp as string);
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

		// OAuth Token — used by /auth/callback after one-time code exchange
		// to establish NextAuth session from backend-issued tokens
		CredentialsProvider({
			id: "oauth-token",
			name: "OAuth Token",
			credentials: {
				token: { label: "Access Token", type: "text" },
				refreshToken: { label: "Refresh Token", type: "text" },
			},
			async authorize(credentials) {
				try {
					if (!credentials?.token) return null;

					const user = await serverAuthService.getProfileFromToken(credentials.token as string);
					if (!user) return null;

					return {
						id: user.id,
						email: user.email,
						name: user.name || user.email.split("@")[0],
						role: user.role,
						emailVerified: user.email_verified,
						image: user.profile_picture_url || null,
						accessToken: credentials.token as string,
						refreshToken: (credentials.refreshToken as string) || "",
					};
				} catch (error) {
					console.error("OAuth token authentication error:", error);
					return null;
				}
			},
		}),
	],
	session: {
		strategy: "jwt",
		maxAge: parseInt(process.env.SESSION_MAX_AGE_DAYS ?? '90', 10) * 24 * 60 * 60, // SESSION_MAX_AGE_DAYS env (default 90 days)
	},
	callbacks: {
		async jwt({ token, user, trigger, session }: any) {
			// Initial sign in — fetch full profile from /me to populate all user fields
			if (user) {
				// Enrich with complete profile data from /user/auth/me
				let profile: Awaited<ReturnType<typeof serverAuthService.getProfileFromToken>> = null;
				try {
					profile = await serverAuthService.getProfileFromToken(user.accessToken);
				} catch {
					// If /me fails, fall back to login response data
				}

				return {
					...token,
					id: profile?.id ?? user.id,
					email: profile?.email ?? user.email,
					name: profile?.name ?? user.name,
					image: profile?.profile_picture_url ?? user.image ?? null,
					role: profile?.role ?? user.role,
					emailVerified: profile !== null
						? Boolean(profile.email_verified)
						: typeof user.emailVerified === "boolean" ? user.emailVerified : false,
					phoneVerified: profile !== null ? Boolean(profile.phone_verified) : false,
					timezone: profile?.timezone ?? null,
					language: profile?.language ?? null,
					accessToken: user.accessToken,
					refreshToken: user.refreshToken,
					accessTokenExpires: Date.now() + TOKEN_CONFIG.ACCESS_TOKEN_EXPIRATION,
				};
			}

			// Handle session updates (e.g., from client-side session.update())
			if (trigger === "update" && session) {
				return { ...token, name: session?.user?.name ?? token.name, image: session?.user?.image ?? token.image };
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
				session.user.email = token.email || session.user.email;
				session.user.name = token.name || session.user.name;
				session.user.image = token.image || session.user.image;
				session.user.role = token.role || "customer";
				session.user.emailVerified = Boolean(token.emailVerified);
				session.user.phoneVerified = Boolean(token.phoneVerified);
				session.user.timezone = token.timezone ?? null;
				session.user.language = token.language ?? null;
				session.accessToken = token.accessToken;
				session.accessTokenExpires = token.accessTokenExpires;
				session.error = token.error;
			}
			return session;
		},
	},
	pages: { signIn: "/login", error: "/error" },
	secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
};

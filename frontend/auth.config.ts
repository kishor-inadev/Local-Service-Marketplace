import NextAuth, { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import {
  BackendAuthResponse,
  BackendRefreshResponse,
  isValidBackendAuthResponse,
  isValidBackendRefreshResponse,
  TOKEN_CONFIG,
  AUTH_ENDPOINTS,
} from "@/types/auth-alignment";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3500';

/**
 * Refresh the access token using the refresh token
 * Calls backend: POST /api/v1/auth/refresh
 */
async function refreshAccessToken(token: any) {
  try {
    const response = await fetch(`${API_URL}${AUTH_ENDPOINTS.REFRESH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: token.refreshToken,
      }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Refresh failed: ${response.status}`);
    }

    const data = await response.json();

    // Validate response format
    if (!isValidBackendRefreshResponse(data)) {
      throw new Error('Invalid refresh response format from backend');
    }

    return {
      ...token,
      accessToken: data.accessToken,
      accessTokenExpires: Date.now() + TOKEN_CONFIG.ACCESS_TOKEN_EXPIRATION,
      // Use new refresh token if provided (token rotation), otherwise keep existing
      refreshToken: data.refreshToken ?? token.refreshToken,
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);

    return {
      ...token,
      error: "RefreshAccessTokenError" as const,
    };
  }
}

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        try {
          // Validate credentials
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // Call backend auth service
          const response = await fetch(`${API_URL}${AUTH_ENDPOINTS.LOGIN}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
            credentials: 'include', // Important: include cookies
          });

          if (!response.ok) {
            console.error('Login failed:', response.status, response.statusText);
            return null;
          }

          const data: unknown = await response.json();

          // Runtime validation of backend response
          if (!isValidBackendAuthResponse(data)) {
            console.error('Invalid backend auth response format');
            return null;
          }

          // Type-safe after validation
          const authResponse: BackendAuthResponse = data;

          // Transform backend response to NextAuth user format
          if (authResponse.user) {
            return {
              id: authResponse.user.id,
              email: authResponse.user.email,
              name: authResponse.user.name || authResponse.user.email.split('@')[0],
              role: authResponse.user.role,
              emailVerified: authResponse.user.email_verified,
              image: authResponse.user.profile_picture_url || null,
              accessToken: authResponse.accessToken,
              refreshToken: authResponse.refreshToken,
            };
          }

          return null;
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days (matches refresh token)
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
          emailVerified: typeof user.emailVerified === 'boolean' ? user.emailVerified : false,
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
    async session({ session, token }) {
      // Add custom fields to session
      if (token && session.user) {
        session.user.id = token.id || '';
        session.user.role = token.role || 'customer';
        // @ts-ignore - Type conflict with default emailVerified
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
    error: "/login",
  },
  trustHost: true, // For development
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);

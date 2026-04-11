import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `auth`, etc.
   */
  interface Session {
		user: {
			id: string;
			role: string;
			emailVerified: boolean;
			phoneVerified: boolean;
			timezone: string | null;
			language: string | null;
		} & DefaultSession["user"];
		accessToken?: string;
		accessTokenExpires?: number; // Timestamp when access token expires
		error?: "RefreshAccessTokenError";
	}

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User extends DefaultUser {
    role: string;
    emailVerified: boolean | Date | null;
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `auth`, when using JWT sessions */
  interface JWT extends DefaultJWT {
    id?: string;
    role?: string;
    emailVerified?: boolean | Date | null;
    phoneVerified?: boolean;
    timezone?: string | null;
    language?: string | null;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number; // Timestamp when access token expires
    error?: "RefreshAccessTokenError";
  }
}

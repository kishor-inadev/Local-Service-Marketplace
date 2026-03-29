import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

type Role = "customer" | "provider" | "admin";

function getDashboardHomeByRole(role?: Role) {
	if (role === "admin") return "/dashboard/admin";
	if (role === "provider") return "/dashboard/provider";
	return "/dashboard/customer";
}

/**
 * Role-based route protection.
 * Checked with prefix matching — the most specific prefix wins.
 * Routes NOT listed here allow any authenticated user.
 */
const ROLE_ROUTES: Array<{ prefix: string; roles: Role[] }> = [
	// Admin-only
	{ prefix: "/dashboard/admin", roles: ["admin"] },

	// Provider-only
	{ prefix: "/dashboard/provider", roles: ["provider"] },
	{ prefix: "/dashboard/earnings", roles: ["provider"] },
	{ prefix: "/dashboard/availability", roles: ["provider"] },
	{ prefix: "/dashboard/browse-requests", roles: ["provider"] },
	{ prefix: "/dashboard/my-proposals", roles: ["provider"] },

	// Customer-only
	{ prefix: "/dashboard/customer", roles: ["customer"] },
	{ prefix: "/dashboard/requests", roles: ["customer"] },
	{ prefix: "/dashboard/favorites", roles: ["customer"] },
	{ prefix: "/dashboard/reviews/submit", roles: ["customer"] },
];

/** Routes that require ANY authenticated user */
const AUTH_REQUIRED_PREFIX = "/dashboard";

/** Routes that a logged-in user should be bounced away from */
const AUTH_REDIRECT_ROUTES = ["/login", "/signup"];

function matchRoleRoute(pathname: string) {
	// Sort by prefix length descending so the most specific match wins
	const sorted = [...ROLE_ROUTES].sort((a, b) => b.prefix.length - a.prefix.length);
	return sorted.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"));
}

export async function middleware(req: NextRequest) {
	const { nextUrl } = req;

	// Skip NextAuth internal API routes
	if (nextUrl.pathname.startsWith("/api/auth")) {
		return NextResponse.next();
	}

	const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET });

	const isLoggedIn = !!token;
	const userRole = token?.role as Role | undefined;
	const pathname = nextUrl.pathname;

	// ── 1. Bounce authenticated users away from login/signup ──────────────────
	if (AUTH_REDIRECT_ROUTES.includes(pathname) && isLoggedIn) {
		return NextResponse.redirect(new URL(getDashboardHomeByRole(userRole), nextUrl));
	}

	// Canonicalize generic dashboard route to role-specific home route
	if (pathname === "/dashboard" && isLoggedIn) {
		return NextResponse.redirect(new URL(getDashboardHomeByRole(userRole), nextUrl));
	}

	const isProtected = pathname === AUTH_REQUIRED_PREFIX || pathname.startsWith(AUTH_REQUIRED_PREFIX + "/");

	// ── 2. Unauthenticated → /login?callbackUrl=<path> ────────────────────────
	if (isProtected && !isLoggedIn) {
		const loginUrl = new URL("/login", nextUrl);
		loginUrl.searchParams.set("callbackUrl", pathname);
		return NextResponse.redirect(loginUrl);
	}

	// ── 3. Wrong role → /403?callbackUrl=<path> ───────────────────────────────
	if (isProtected && isLoggedIn) {
		const matched = matchRoleRoute(pathname);
		if (matched && (!userRole || !matched.roles.includes(userRole))) {
			const forbiddenUrl = new URL("/403", nextUrl);
			forbiddenUrl.searchParams.set("callbackUrl", pathname);
			return NextResponse.redirect(forbiddenUrl);
		}
	}

	return NextResponse.next();
}

export const config = { matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*|public).*)"] };

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

function getDashboardHomeByRole(role?: string) {
	if (role === "admin") return "/dashboard/admin";
	return "/dashboard";
}

/**
 * Permission-based route protection.
 * Each route prefix maps to the permission(s) required.
 * If multiple permissions listed, user needs ANY one (OR logic).
 * Routes NOT listed here allow any authenticated user.
 *
 * Fallback: if no permissions are present on the token yet (backward compat),
 * the role-based ROLE_ROUTES mapping is used as a safety net.
 */
const PERMISSION_ROUTES: Array<{ prefix: string; permissions: string[] }> = [
	// Admin
	{ prefix: "/dashboard/admin", permissions: ["admin.access"] },

	// Provider
	{ prefix: "/dashboard/provider", permissions: ["provider_profile.view"] },
	{ prefix: "/dashboard/earnings", permissions: ["earnings.view"] },
	{ prefix: "/dashboard/availability", permissions: ["provider_availability.manage"] },
	{ prefix: "/dashboard/browse-requests", permissions: ["requests.browse"] },
	{ prefix: "/dashboard/my-proposals", permissions: ["proposals.create", "proposals.update"] },
	{ prefix: "/dashboard/settings/subscription", permissions: ["subscriptions.manage"] },

	// Customer / shared
	{ prefix: "/dashboard/requests", permissions: ["requests.create", "requests.read", "requests.browse"] },
	{ prefix: "/dashboard/favorites", permissions: ["favorites.manage"] },
	{ prefix: "/dashboard/reviews/submit", permissions: ["reviews.create"] },
];

type Role = "customer" | "provider" | "admin";

/**
 * Legacy role-based route protection (fallback when permissions not in token).
 */
const ROLE_ROUTES: Array<{ prefix: string; roles: Role[] }> = [
	{ prefix: "/dashboard/admin", roles: ["admin"] },
	{ prefix: "/dashboard/provider", roles: ["provider"] },
	{ prefix: "/dashboard/earnings", roles: ["provider"] },
	{ prefix: "/dashboard/availability", roles: ["provider"] },
	{ prefix: "/dashboard/browse-requests", roles: ["provider"] },
	{ prefix: "/dashboard/my-proposals", roles: ["provider"] },
	{ prefix: "/dashboard/settings/subscription", roles: ["provider"] },
	{ prefix: "/dashboard/requests", roles: ["customer", "provider"] },
	{ prefix: "/dashboard/favorites", roles: ["customer"] },
	{ prefix: "/dashboard/reviews/submit", roles: ["customer"] },
];

/** Routes that require ANY authenticated user */
const AUTH_REQUIRED_PREFIXES = ["/dashboard", "/checkout", "/onboarding"];

/** Routes that a logged-in user should be bounced away from */
const AUTH_REDIRECT_ROUTES = ["/login", "/signup", "/phone-login", "/forgot-password", "/reset-password"];

function matchPermissionRoute(pathname: string) {
	const sorted = [...PERMISSION_ROUTES].sort((a, b) => b.prefix.length - a.prefix.length);
	return sorted.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"));
}

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
	const userRole = token?.role as string | undefined;
	const userPermissions: string[] = Array.isArray(token?.permissions) ? token.permissions as string[] : [];
	const pathname = nextUrl.pathname;

	// ── 1. Bounce authenticated users away from login/signup ──────────────────
	if (AUTH_REDIRECT_ROUTES.includes(pathname) && isLoggedIn) {
		return NextResponse.redirect(new URL(getDashboardHomeByRole(userRole), nextUrl));
	}

	// Only admins are canonicalized to their dedicated URL namespace.
	if (pathname === "/dashboard" && isLoggedIn && userRole === "admin") {
		return NextResponse.redirect(new URL(getDashboardHomeByRole(userRole), nextUrl));
	}

	const isProtected = AUTH_REQUIRED_PREFIXES.some(
		(prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
	);

	// ── 2. Unauthenticated → /login?callbackUrl=<path> ────────────────────────
	if (isProtected && !isLoggedIn) {
		const loginUrl = new URL("/login", nextUrl);
		loginUrl.searchParams.set("callbackUrl", pathname);
		return NextResponse.redirect(loginUrl);
	}

	// ── 3. Permission/role check → /403?callbackUrl=<path> ────────────────────
	if (isProtected && isLoggedIn) {
		// Prefer permission-based checks when permissions are available
		if (userPermissions.length > 0) {
			const matched = matchPermissionRoute(pathname);
			if (matched) {
				const hasAccess = matched.permissions.some((p) => userPermissions.includes(p));
				if (!hasAccess) {
					const forbiddenUrl = new URL("/403", nextUrl);
					forbiddenUrl.searchParams.set("callbackUrl", pathname);
					return NextResponse.redirect(forbiddenUrl);
				}
			}
		} else {
			// Fallback to role-based checks (backward compat for tokens without permissions)
			const matched = matchRoleRoute(pathname);
			if (matched && (!userRole || !(matched.roles as string[]).includes(userRole))) {
				const forbiddenUrl = new URL("/403", nextUrl);
				forbiddenUrl.searchParams.set("callbackUrl", pathname);
				return NextResponse.redirect(forbiddenUrl);
			}
		}
	}

	return NextResponse.next();
}

export const config = { matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*|public).*)"] };

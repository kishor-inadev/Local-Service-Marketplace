import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from "@/auth.config";

/**
 * Middleware Route Protection Configuration
 * 
 * PROTECTED ROUTES (require authentication):
 * - /dashboard and all sub-routes
 * 
 * PUBLIC ROUTES (no authentication required):
 * - Everything else! Including:
 *   - / (home page)
 *   - /login, /signup (auth pages)
 *   - /about, /contact, /terms, /privacy (static pages)
 *   - /services, /providers (public browsing)
 *   - Any other route not in protectedRoutes
 * 
 * AUTO-REDIRECTS:
 * - Logged-in users visiting /login or /signup → /dashboard
 * - Non-logged-in users visiting /dashboard → /login
 */

// Define routes that REQUIRE authentication (everything else is public)
const protectedRoutes = ['/dashboard'];

// Define routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/signup'];

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  
  // CRITICAL: Skip middleware for NextAuth API routes
  if (nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }
  
  // Get session using NextAuth
  const session = await auth();
  const isLoggedIn = !!session;

  // Check if current route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => 
    nextUrl.pathname === route || nextUrl.pathname.startsWith(route)
  );
  
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  // Redirect logged-in users away from auth pages to dashboard
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  // Redirect non-logged-in users to login ONLY for protected routes
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};

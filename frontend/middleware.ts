import { auth } from "@/auth.config";
import { NextResponse } from 'next/server';

// Define routes that don't require authentication
const publicRoutes = ['/', '/login', '/signup', '/auth/callback', '/verify-email'];

// Define routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/signup'];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isPublicRoute = publicRoutes.some(route => 
    nextUrl.pathname === route || nextUrl.pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  // Redirect non-logged-in users to login for protected routes
  if (!isPublicRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  return NextResponse.next();
});

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

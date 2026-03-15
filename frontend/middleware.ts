import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = ['/', '/login', '/signup', '/auth/callback'];

// Define routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Note: Token-based auth check removed because tokens are in localStorage
  // which is not accessible in middleware (server-side)
  // Auth checks are handled client-side in useAuth hook and page components
  
  // For now, middleware only handles route matching, not authentication
  // In production, implement cookie-based tokens for SSR auth
  
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};

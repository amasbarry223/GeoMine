import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { applyRateLimit } from '@/lib/rate-limit';
import { getCSRFToken } from '@/lib/csrf';

/**
 * Middleware to protect pages and API routes with authentication
 * Redirects unauthenticated users to login page
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/signin', '/auth/signout', '/auth/error'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Skip middleware for NextAuth API routes - they need to be accessible
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Get token from request
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // If user is not authenticated
  if (!token) {
    // Allow access to public routes
    if (isPublicRoute) {
      return NextResponse.next();
    }

    // For API routes, return JSON error
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Non authentifié', message: 'Vous devez être connecté pour accéder à cette ressource' },
        { status: 401 }
      );
    }

    // For pages, redirect to login with callback URL
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // User is authenticated
  // If trying to access login page, redirect to home
  if (pathname.startsWith('/auth/signin')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Set CSRF token cookie for authenticated users
  if (token && pathname.startsWith('/')) {
    const response = NextResponse.next();
    try {
      const csrfToken = getCSRFToken();
      response.cookies.set('csrf-token', csrfToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 hours
      });
      return response;
    } catch (error) {
      // If CSRF token generation fails, continue without it
      return response;
    }
  }

  // For API routes, add rate limiting and user headers
  if (pathname.startsWith('/api/')) {
    // Apply rate limiting
    const rateLimitResponse = await applyRateLimit(request, pathname);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Add user info to request headers for use in API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', token.id as string);
    requestHeaders.set('x-user-email', token.email as string);
    requestHeaders.set('x-user-role', (token.role as string) || 'VIEWER');

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // For pages, allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};


import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { applyRateLimit } from '@/lib/rate-limit';

/**
 * Middleware to protect API routes with authentication, permissions, and rate limiting
 * This runs before API route handlers
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect API routes (except auth routes)
  if (!pathname.startsWith('/api/') || pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Apply rate limiting
  const rateLimitResponse = applyRateLimit(request, pathname);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Get token from request
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Check if user is authenticated
  if (!token) {
    return NextResponse.json(
      { error: 'Non authentifié', message: 'Vous devez être connecté pour accéder à cette ressource' },
      { status: 401 }
    );
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


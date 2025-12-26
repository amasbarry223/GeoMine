import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { AuthUser } from '@/types/auth';
import { UserRole } from '@/types/geophysic';

/**
 * Extract authenticated user from Next.js request
 * Used in API routes to get current user information
 */
export async function getUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.id) {
      return null;
    }

    return {
      id: token.id as string,
      email: token.email as string,
      name: token.name as string | null,
      role: (token.role as UserRole) || UserRole.VIEWER,
    };
  } catch (error) {
    console.error('Error getting user from request:', error);
    return null;
  }
}


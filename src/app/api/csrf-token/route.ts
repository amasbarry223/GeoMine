import { NextRequest, NextResponse } from 'next/server';
import { getCSRFToken } from '@/lib/csrf';
import { createSuccessResponse } from '@/lib/api-error-handler';

/**
 * GET /api/csrf-token - Get or create CSRF token
 * This endpoint sets the CSRF token in a cookie and returns it
 */
export async function GET(request: NextRequest) {
  try {
    const token = getCSRFToken();
    
    const response = createSuccessResponse(
      { token },
      undefined,
      200
    );
    
    // Set token in cookie (not httpOnly so client can read it for CSRF protection)
    response.cookies.set('csrf-token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
    });
    
    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}


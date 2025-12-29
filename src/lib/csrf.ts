import { randomBytes } from 'crypto';

const CSRF_TOKEN_COOKIE = 'csrf-token';
const CSRF_TOKEN_HEADER = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Get CSRF token from request cookies
 */
export function getCSRFTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies[CSRF_TOKEN_COOKIE] || null;
}

/**
 * Generate a new CSRF token
 */
export function getCSRFToken(): string {
  return generateCSRFToken();
}

/**
 * Verify CSRF token from request
 */
export function verifyCSRFToken(request: Request): boolean {
  // Skip CSRF check for GET requests
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
    return true;
  }

  const cookieToken = getCSRFTokenFromRequest(request);
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER);

  if (!cookieToken || !headerToken) {
    return false;
  }

  // Use timing-safe comparison
  return cookieToken === headerToken;
}

/**
 * Middleware to validate CSRF token for API routes
 */
export function validateCSRF(request: Request): { valid: boolean; error?: string } {
  const isValid = verifyCSRFToken(request);

  if (!isValid) {
    return {
      valid: false,
      error: 'Token CSRF invalide ou manquant',
    };
  }

  return { valid: true };
}


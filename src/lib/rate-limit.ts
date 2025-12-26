import { NextRequest, NextResponse } from 'next/server';

// In-memory rate limit store (use Redis in production)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/projects': {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  '/api/datasets/import': {
    maxRequests: 5,
    windowMs: 60 * 1000,
  },
  '/api/inversion/run': {
    maxRequests: 3,
    windowMs: 60 * 1000,
  },
  '/api/reports/generate': {
    maxRequests: 5,
    windowMs: 60 * 1000,
  },
  default: {
    maxRequests: 20,
    windowMs: 60 * 1000,
  },
};

/**
 * Check rate limit for a given identifier (IP + path)
 */
export function checkRateLimit(
  identifier: string,
  path: string
): { allowed: boolean; remaining: number; resetTime: number } {
  // Find matching rate limit config
  let config = RATE_LIMITS.default;
  for (const [route, routeConfig] of Object.entries(RATE_LIMITS)) {
    if (path.startsWith(route)) {
      config = routeConfig;
      break;
    }
  }

  const key = `${identifier}:${path}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    // Create new entry
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // Increment count
  entry.count++;

  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get rate limit identifier from request (IP address)
 */
export function getRateLimitIdentifier(request: NextRequest): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to connection IP (may not be available in all environments)
  return request.ip || 'unknown';
}

/**
 * Middleware function to apply rate limiting
 */
export function applyRateLimit(request: NextRequest, path: string): NextResponse | null {
  const identifier = getRateLimitIdentifier(request);
  const result = checkRateLimit(identifier, path);

  if (!result.allowed) {
    const response = NextResponse.json(
      {
        error: 'Trop de requêtes',
        message: `Limite de ${RATE_LIMITS[path]?.maxRequests || RATE_LIMITS.default.maxRequests} requêtes par minute atteinte. Réessayez dans ${Math.ceil((result.resetTime - Date.now()) / 1000)} secondes.`,
      },
      { status: 429 }
    );

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', String(RATE_LIMITS[path]?.maxRequests || RATE_LIMITS.default.maxRequests));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetTime / 1000)));

    return response;
  }

  return null; // Rate limit passed
}


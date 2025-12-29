import { NextRequest, NextResponse } from 'next/server';
import { get, set, increment, exists } from './cache';

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
export async function checkRateLimit(
  identifier: string,
  path: string
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  // Find matching rate limit config
  let config = RATE_LIMITS.default;
  for (const [route, routeConfig] of Object.entries(RATE_LIMITS)) {
    if (path.startsWith(route)) {
      config = routeConfig;
      break;
    }
  }

  const key = `rate_limit:${identifier}:${path}`;
  const now = Date.now();
  const windowSeconds = Math.ceil(config.windowMs / 1000);

  // Check if key exists
  const keyExists = await exists(key);
  
  if (!keyExists) {
    // Create new entry
    const resetTime = now + config.windowMs;
    await set(key, { count: 1, resetTime }, { ttl: windowSeconds });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime,
    };
  }

  // Get current count
  const entry = await get<{ count: number; resetTime: number }>(key);
  
  if (!entry || entry.resetTime < now) {
    // Entry expired, create new one
    const resetTime = now + config.windowMs;
    await set(key, { count: 1, resetTime }, { ttl: windowSeconds });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime,
    };
  }

  // Increment count
  const newCount = await increment(`${key}:count`, 1);
  
  // Update entry
  await set(key, { count: newCount, resetTime: entry.resetTime }, { ttl: windowSeconds });

  if (newCount > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - newCount,
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
export async function applyRateLimit(request: NextRequest, path: string): Promise<NextResponse | null> {
  const identifier = getRateLimitIdentifier(request);
  const result = await checkRateLimit(identifier, path);

  if (!result.allowed) {
    const limit = RATE_LIMITS[path]?.maxRequests || RATE_LIMITS.default.maxRequests;
    const response = NextResponse.json(
      {
        error: 'Trop de requêtes',
        message: `Limite de ${limit} requêtes par minute atteinte. Réessayez dans ${Math.ceil((result.resetTime - Date.now()) / 1000)} secondes.`,
      },
      { status: 429 }
    );

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', String(limit));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetTime / 1000)));

    return response;
  }

  return null; // Rate limit passed
}


/**
 * Cache abstraction layer
 * Supports both in-memory cache (development) and Redis (production)
 */

interface CacheOptions {
  ttl?: number; // Time to live in seconds
}

// In-memory cache for development
const memoryCache = new Map<string, { value: any; expires: number }>();

// Clean up expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expires < now) {
      memoryCache.delete(key);
    }
  }
}, 60 * 1000);

let redisClient: any = null;

/**
 * Initialize Redis client if REDIS_URL is provided
 */
async function initRedis() {
  if (process.env.REDIS_URL && !redisClient) {
    try {
      const redis = await import('ioredis').catch(() => null);
      if (!redis) {
        // ioredis not installed, use memory cache only
        return;
      }
      redisClient = new redis.default(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      redisClient.on('error', (err: Error) => {
        console.error('Redis Client Error:', err);
      });

      redisClient.on('connect', () => {
        console.log('Redis Client Connected');
      });
    } catch (error) {
      console.warn('Redis not available, using in-memory cache:', error);
    }
  }
}

/**
 * Get value from cache
 */
export async function get<T = any>(key: string): Promise<T | null> {
  await initRedis();

  if (redisClient) {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  // Fallback to memory cache
  const entry = memoryCache.get(key);
  if (!entry) {
    return null;
  }

  if (entry.expires < Date.now()) {
    memoryCache.delete(key);
    return null;
  }

  return entry.value;
}

/**
 * Set value in cache
 */
export async function set(key: string, value: any, options?: CacheOptions): Promise<void> {
  await initRedis();

  const ttl = options?.ttl || 3600; // Default 1 hour

  if (redisClient) {
    try {
      await redisClient.setex(key, ttl, JSON.stringify(value));
      return;
    } catch (error) {
      console.error('Redis set error:', error);
      // Fallback to memory cache
    }
  }

  // Fallback to memory cache
  memoryCache.set(key, {
    value,
    expires: Date.now() + ttl * 1000,
  });
}

/**
 * Delete value from cache
 */
export async function del(key: string): Promise<void> {
  await initRedis();

  if (redisClient) {
    try {
      await redisClient.del(key);
      return;
    } catch (error) {
      console.error('Redis del error:', error);
    }
  }

  memoryCache.delete(key);
}

/**
 * Delete multiple keys matching a pattern
 */
export async function delPattern(pattern: string): Promise<void> {
  await initRedis();

  if (redisClient) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
      return;
    } catch (error) {
      console.error('Redis delPattern error:', error);
    }
  }

  // Fallback: delete from memory cache
  for (const key of memoryCache.keys()) {
    if (key.includes(pattern.replace('*', ''))) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Check if key exists in cache
 */
export async function exists(key: string): Promise<boolean> {
  await initRedis();

  if (redisClient) {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  const entry = memoryCache.get(key);
  return entry ? entry.expires >= Date.now() : false;
}

/**
 * Increment a numeric value in cache
 */
export async function increment(key: string, by: number = 1): Promise<number> {
  await initRedis();

  if (redisClient) {
    try {
      return await redisClient.incrby(key, by);
    } catch (error) {
      console.error('Redis increment error:', error);
    }
  }

  // Fallback to memory cache
  const current = await get<number>(key) || 0;
  const newValue = current + by;
  await set(key, newValue);
  return newValue;
}

/**
 * Get or set value (cache-aside pattern)
 */
export async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  const cached = await get<T>(key);
  if (cached !== null) {
    return cached;
  }

  const value = await fetcher();
  await set(key, value, options);
  return value;
}


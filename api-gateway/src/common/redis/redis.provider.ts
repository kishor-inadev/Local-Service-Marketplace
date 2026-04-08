import Redis from "ioredis";

let redisClient: Redis | null = null;

/**
 * Returns a shared Redis client for the API Gateway.
 * Used by rate limiters and any other component that needs Redis.
 * Returns null if Redis is not configured (falls back to in-memory).
 */
export function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const host = process.env.REDIS_HOST;
  const port = parseInt(process.env.REDIS_PORT || "6379", 10);

  if (!host) return null;

  redisClient = new Redis({
    host,
    port,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_RATE_LIMIT_DB || "1", 10),
    keyPrefix: "rl:",
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
  });

  redisClient.on("error", (err) => {
    console.error("[Redis] Rate limiter Redis error:", err.message);
  });

  redisClient.connect().catch(() => {
    // Silently fail — rate limiter will fall back to in-memory
    redisClient = null;
  });

  return redisClient;
}

import Redis from "ioredis";

let redis: Redis | null = null;

export async function initRedis(): Promise<void> {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  redis = new Redis(url, { lazyConnect: true });
  redis.on("error", (err) => console.error("Redis error:", err));
  await redis.connect();
}

export function getRedis(): Redis {
  if (!redis) throw new Error("Redis not initialized — call initRedis() first");
  return redis;
}

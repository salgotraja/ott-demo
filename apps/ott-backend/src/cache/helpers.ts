import { createHash } from "crypto";
import { getRedis } from "./redis";

const DEFAULT_TTL = parseInt(process.env.CACHE_TTL_SECONDS ?? "300", 10);

export function cacheKey(route: string, params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const hash = createHash("md5").update(sorted).digest("hex");
  return `public:${route}:${hash}`;
}

export async function getCache(key: string): Promise<string | null> {
  try {
    return await getRedis().get(key);
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: string, ttl = DEFAULT_TTL): Promise<void> {
  try {
    await getRedis().set(key, value, "EX", ttl);
  } catch {
    // cache failure is non-fatal
  }
}

export async function invalidatePublicCache(): Promise<void> {
  await invalidateByPattern("public:*");
}

export async function invalidateMovieCache(movieId?: number): Promise<void> {
  if (movieId !== undefined) {
    await invalidateByPattern(`public:movies:${movieId}`);
  }
  // Always invalidate the list cache since any movie change affects filtered results
  await invalidateByPattern("public:movies:*");
}

export async function invalidateTvCache(tvShowId?: number): Promise<void> {
  if (tvShowId !== undefined) {
    // Invalidate the specific show + its season/episode sub-keys
    await invalidateByPattern(`public:tv:${tvShowId}*`);
  }
  // Always invalidate the list cache since any show change affects filtered results
  await invalidateByPattern("public:tv:*");
}

export async function invalidateProviderCache(): Promise<void> {
  await invalidateByPattern("public:providers:*");
}

export async function invalidateGenreCache(): Promise<void> {
  await invalidateByPattern("public:genres:*");
}

async function invalidateByPattern(pattern: string): Promise<void> {
  try {
    const redis = getRedis();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    // cache failure is non-fatal
  }
}

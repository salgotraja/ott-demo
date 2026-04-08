import crypto from "crypto";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
export const REGION = "IN";
export const RATE_LIMIT_DELAY = 500;

export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function generateInternalId(tmdbId: number, prefix = "movie"): string {
  return crypto
    .createHash("md5")
    .update(`${prefix}_${tmdbId}`)
    .digest("hex")
    .toUpperCase();
}

export async function fetchTMDB<T>(endpoint: string): Promise<T | null> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error("TMDB_API_KEY is not set");

  try {
    const isBearer = apiKey.startsWith("eyJ");
    const url = isBearer
      ? `${TMDB_BASE_URL}${endpoint}`
      : `${TMDB_BASE_URL}${endpoint}${endpoint.includes("?") ? "&" : "?"}api_key=${apiKey}`;

    const headers: HeadersInit = isBearer
      ? { Authorization: `Bearer ${apiKey}`, Accept: "application/json" }
      : {};

    const response = await fetch(url, { headers });
    if (!response.ok) {
      console.error(`TMDB API error: ${response.status} ${endpoint}`);
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error(`Fetch error: ${endpoint}`, error);
    return null;
  }
}

export function genderLabel(gender: number): string {
  if (gender === 1) return "F";
  if (gender === 2) return "M";
  return "-";
}

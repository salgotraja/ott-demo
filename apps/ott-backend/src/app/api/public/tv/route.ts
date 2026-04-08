import { NextRequest, NextResponse } from "next/server";
import { findTvShows } from "@/lib/data/tv-shows";
import { cacheKey, getCache, setCache } from "@/cache/helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const sp = req.nextUrl.searchParams;

  const params: Record<string, string> = {};
  for (const [k, v] of sp.entries()) params[k] = v;

  const key = cacheKey("tv", params);
  const cached = await getCache(key);
  if (cached) {
    try { return NextResponse.json(JSON.parse(cached)); } catch { /* fall through */ }
  }

  const shows = await findTvShows({
    language: sp.get("language") ?? undefined,
    country: sp.get("country") ?? undefined,
    genres: sp.get("genres")?.split(",").map(Number).filter(Boolean) ?? [],
    providers: sp.get("providers")?.split(",").map(Number).filter(Boolean) ?? [],
    minRating: sp.has("minRating") ? parseFloat(sp.get("minRating")!) : undefined,
    maxRating: sp.has("maxRating") ? parseFloat(sp.get("maxRating")!) : undefined,
    minYear: sp.has("minYear") ? parseInt(sp.get("minYear")!, 10) : undefined,
    maxYear: sp.has("maxYear") ? parseInt(sp.get("maxYear")!, 10) : undefined,
    search: sp.get("search") ?? undefined,
    onlyWithProviders: sp.get("onlyWithProviders") === "true",
  });

  const result = shows.map((s) => {
    const poster = s.images.find((i) => i.type === "poster")?.url ?? null;
    const backdrop = s.images.find((i) => i.type === "backdrop")?.url ?? null;
    return {
      id: s.id,
      name: s.name,
      posterPath: poster,
      backdropPath: backdrop,
      firstAirDate: s.firstAirDate?.toISOString() ?? null,
      voteAverage: s.voteAverage,
      genres: s.genres.map((g) => g.genre),
    };
  });

  const json = JSON.stringify(result);
  await setCache(key, json);
  return NextResponse.json(result);
}

import { NextRequest, NextResponse } from "next/server";
import { findMovies } from "@/lib/data/movies";
import { cacheKey, getCache, setCache } from "@/cache/helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const sp = req.nextUrl.searchParams;

  const params: Record<string, string> = {};
  for (const [k, v] of sp.entries()) params[k] = v;

  const key = cacheKey("movies", params);
  const cached = await getCache(key);
  if (cached) {
    try { return NextResponse.json(JSON.parse(cached)); } catch { /* fall through */ }
  }

  const movies = await findMovies({
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

  const result = movies.map((m) => {
    const poster = m.images.find((i) => i.type === "poster")?.url ?? null;
    const backdrop = m.images.find((i) => i.type === "backdrop")?.url ?? null;
    return {
      id: m.id,
      title: m.title,
      posterPath: poster,
      backdropPath: backdrop,
      releaseDate: m.releaseDate?.toISOString() ?? null,
      voteAverage: m.voteAverage,
      genres: m.genres.map((g) => g.genre),
    };
  });

  const json = JSON.stringify(result);
  await setCache(key, json);
  return NextResponse.json(result);
}

import { NextRequest, NextResponse } from "next/server";
import { findTvShowById } from "@/lib/data/tv-shows";
import { getCache, setCache } from "@/cache/helpers";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { id } = await params;
  const tvShowId = parseInt(id, 10);
  if (isNaN(tvShowId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const key = `public:tv:${tvShowId}`;
  const cached = await getCache(key);
  if (cached) {
    try { return NextResponse.json(JSON.parse(cached)); } catch { /* fall through */ }
  }

  const show = await findTvShowById(tvShowId);

  if (!show) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = {
    id: show.id,
    name: show.name,
    originalName: show.originalName,
    tagline: show.tagline,
    description: show.description,
    firstAirDate: show.firstAirDate?.toISOString() ?? null,
    lastAirDate: show.lastAirDate?.toISOString() ?? null,
    numberOfSeasons: show.numberOfSeasons,
    numberOfEpisodes: show.numberOfEpisodes,
    status: show.status,
    adult: show.adult,
    keywords: show.keywords,
    voteAverage: show.voteAverage,
    voteCount: show.voteCount,
    popularity: show.popularity,
    originalLanguage: show.originalLanguage,
    imdbId: show.imdbId,
    genres: show.genres.map((g) => ({ id: g.genre.id, name: g.genre.name })),
    images: show.images,
    actors: show.actors,
    crew: show.crew,
    videos: show.videos,
    ratings: show.ratings,
    references: show.references
      ? {
          imdbId: show.references.imdbId,
          wikidataId: show.references.wikidataId,
          home: show.references.home,
        }
      : null,
    productions: show.productions,
    reviews: show.reviews.map((r) => ({
      ...r,
      createdAt: r.createdAt?.toISOString() ?? null,
    })),
    contentRatings: show.contentRatings,
    spokenLanguages: show.spokenLanguages,
    alternateTitles: show.alternateTitles,
    providers: show.providers.map((p) => ({
      id: p.provider.id,
      type: p.type,
      region: p.region,
      url: p.url,
      cost: p.cost,
      quality: p.quality,
      provider: p.provider,
    })),
    seasons: show.seasons.map((s) => ({
      ...s,
      airDate: s.airDate?.toISOString() ?? null,
    })),
  };

  const json = JSON.stringify(result);
  await setCache(key, json);
  return NextResponse.json(result);
}

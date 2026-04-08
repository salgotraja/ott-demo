import { NextRequest, NextResponse } from "next/server";
import { findSeason } from "@/lib/data/tv-shows";
import { getCache, setCache } from "@/cache/helpers";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string; seasonNumber: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { id, seasonNumber } = await params;
  const tvShowId = parseInt(id, 10);
  const seasonNum = parseInt(seasonNumber, 10);
  if (isNaN(tvShowId) || isNaN(seasonNum)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const key = `public:tv:${tvShowId}:season:${seasonNum}`;
  const cached = await getCache(key);
  if (cached) {
    try { return NextResponse.json(JSON.parse(cached)); } catch { /* fall through */ }
  }

  const season = await findSeason(tvShowId, seasonNum);

  if (!season) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tvCert = season.tvShow.contentRatings[0]?.code ?? null;

  const result = {
    id: season.id,
    tvShowId: season.tvShowId,
    seasonNumber: season.seasonNumber,
    name: season.name,
    overview: season.overview,
    airDate: season.airDate?.toISOString() ?? null,
    episodeCount: season.episodeCount,
    voteAverage: season.voteAverage,
    posterPath: season.posterPath,
    episodes: season.episodes.map((e) => ({
      id: e.id,
      episodeNumber: e.episodeNumber,
      name: e.name,
      overview: e.overview,
      airDate: e.airDate?.toISOString() ?? null,
      runtime: e.runtime,
      stillPath: e.stillPath,
      voteAverage: e.voteAverage,
      voteCount: e.voteCount,
    })),
    images: season.images.map((i) => ({ id: i.id, url: i.url, type: i.type })),
    videos: season.videos.map((v) => ({
      id: v.id,
      name: v.name,
      url: v.url,
      image: v.image,
      type: v.type,
    })),
    providers: season.providers.map((p) => ({
      type: p.type,
      region: p.region,
      url: p.url,
      provider: {
        id: p.provider.id,
        name: p.provider.name,
        logoPath: p.provider.logoPath,
        displayPriority: p.provider.displayPriority,
      },
    })),
    tvShow: { name: season.tvShow.name, adult: season.tvShow.adult, tvCert },
  };

  const json = JSON.stringify(result);
  await setCache(key, json);
  return NextResponse.json(result);
}

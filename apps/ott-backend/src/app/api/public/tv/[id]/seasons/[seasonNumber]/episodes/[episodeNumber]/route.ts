import { NextRequest, NextResponse } from "next/server";
import { findEpisode, findEpisodeContext, findAdjacentEpisodes } from "@/lib/data/tv-shows";
import { getCache, setCache } from "@/cache/helpers";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string; seasonNumber: string; episodeNumber: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { id, seasonNumber, episodeNumber } = await params;
  const tvShowId = parseInt(id, 10);
  const seasonNum = parseInt(seasonNumber, 10);
  const episodeNum = parseInt(episodeNumber, 10);

  if (isNaN(tvShowId) || isNaN(seasonNum) || isNaN(episodeNum)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const key = `public:tv:${tvShowId}:season:${seasonNum}:episode:${episodeNum}`;
  const cached = await getCache(key);
  if (cached) {
    try { return NextResponse.json(JSON.parse(cached)); } catch { /* fall through */ }
  }

  const episode = await findEpisode(tvShowId, seasonNum, episodeNum);

  if (!episode) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [{ tvShow, season }, { prevEpisode, nextEpisode }] = await Promise.all([
    findEpisodeContext(tvShowId, seasonNum, episodeNum),
    findAdjacentEpisodes(tvShowId, seasonNum, episodeNum),
  ]);

  if (!tvShow || !season) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tvCert = tvShow.contentRatings[0]?.code ?? null;

  const result = {
    episode: {
      id: episode.id,
      name: episode.name,
      overview: episode.overview,
      airDate: episode.airDate?.toISOString() ?? null,
      runtime: episode.runtime,
      stillPath: episode.stillPath,
      voteAverage: episode.voteAverage,
      voteCount: episode.voteCount,
    },
    tvShow: {
      name: tvShow.name,
      adult: tvShow.adult,
      tvCert,
      numberOfSeasons: tvShow.numberOfSeasons,
    },
    season: {
      name: season.name,
      posterPath: season.posterPath,
      episodeCount: season.episodeCount,
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
    },
    prevEpisode: prevEpisode
      ? { episodeNumber: prevEpisode.episodeNumber, name: prevEpisode.name, stillPath: prevEpisode.stillPath }
      : null,
    nextEpisode: nextEpisode
      ? { episodeNumber: nextEpisode.episodeNumber, name: nextEpisode.name, stillPath: nextEpisode.stillPath }
      : null,
  };

  const json = JSON.stringify(result);
  await setCache(key, json);
  return NextResponse.json(result);
}

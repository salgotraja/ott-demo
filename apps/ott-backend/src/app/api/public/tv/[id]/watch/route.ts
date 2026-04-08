import { NextRequest, NextResponse } from "next/server";
import { findTvShowWatchProviders } from "@/lib/data/tv-shows";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { id } = await params;
  const tvShowId = parseInt(id, 10);
  if (isNaN(tvShowId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const country = req.nextUrl.searchParams.get("country") ?? "IN";

  const show = await findTvShowWatchProviders(tvShowId, country);

  if (!show) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cert = show.contentRatings[0] ?? null;

  const buildProvider = (mp: (typeof show.providers)[number]) => ({
    provider_id: mp.provider.id,
    provider: mp.provider.name,
    logo: mp.provider.logoPath ? `https://image.tmdb.org/t/p/w92${mp.provider.logoPath}` : "",
    display_priority: mp.provider.displayPriority ?? 999,
    url: mp.url ?? "",
    cost: mp.cost ?? "",
    quality: mp.quality ?? "HD",
  });

  const countryData = {
    country,
    alternate_title: show.alternateTitles[0]?.title ?? null,
    release_date: null,
    certification: cert?.code || null,
    certification_type: "TV",
    certification_label: null,
    release_note: null,
    all_release_dates: cert
      ? [{ type: "TV", type_label: "TV Rating", release_date: null, certification: cert.code || null, note: null, language: null }]
      : [],
    stream: show.providers.filter((p) => p.type === "flatrate").map(buildProvider),
    rent: show.providers.filter((p) => p.type === "rent").map(buildProvider),
    buy: show.providers.filter((p) => p.type === "buy").map(buildProvider),
    tmdb_watch_link: `https://www.themoviedb.org/tv/${tvShowId}/watch?locale=${country}`,
  };

  return NextResponse.json({ error: 0, data: { country_data: countryData } });
}

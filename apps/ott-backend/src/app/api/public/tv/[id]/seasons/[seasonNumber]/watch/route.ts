import { NextRequest, NextResponse } from "next/server";
import { findSeasonWatchProviders } from "@/lib/data/tv-shows";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string; seasonNumber: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { id, seasonNumber } = await params;
  const tvShowId = parseInt(id, 10);
  const seasonNum = parseInt(seasonNumber, 10);
  if (isNaN(tvShowId) || isNaN(seasonNum)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const country = req.nextUrl.searchParams.get("country") ?? "IN";

  const season = await findSeasonWatchProviders(tvShowId, seasonNum, country);

  if (!season) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const buildProvider = (sp: (typeof season.providers)[number]) => ({
    provider_id: sp.provider.id,
    provider: sp.provider.name,
    logo: sp.provider.logoPath ? `https://image.tmdb.org/t/p/w92${sp.provider.logoPath}` : "",
    display_priority: sp.provider.displayPriority ?? 999,
    url: sp.url ?? "",
    cost: "",
    quality: "HD",
  });

  const countryData = {
    country,
    alternate_title: null,
    release_date: null,
    certification: null,
    certification_type: null,
    certification_label: null,
    release_note: null,
    all_release_dates: [],
    stream: season.providers.filter((p) => p.type === "flatrate").map(buildProvider),
    rent: season.providers.filter((p) => p.type === "rent").map(buildProvider),
    buy: season.providers.filter((p) => p.type === "buy").map(buildProvider),
    tmdb_watch_link: `https://www.themoviedb.org/tv/${tvShowId}/season/${seasonNum}/watch?locale=${country}`,
  };

  return NextResponse.json({ error: 0, data: { country_data: countryData } });
}

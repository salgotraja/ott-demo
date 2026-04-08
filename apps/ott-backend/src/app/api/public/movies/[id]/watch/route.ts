import { NextRequest, NextResponse } from "next/server";
import { findMovieWatchProviders } from "@/lib/data/movies";

export const dynamic = "force-dynamic";

const RELEASE_TYPE_LABELS: Record<string, string> = {
  "1": "Premiere",
  "2": "Theatrical (limited)",
  "3": "Theatrical",
  "4": "Digital",
  "5": "Physical",
  "6": "TV",
};

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { id } = await params;
  const movieId = parseInt(id, 10);
  if (isNaN(movieId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const country = req.nextUrl.searchParams.get("country") ?? "IN";

  let movie;
  try {
    movie = await findMovieWatchProviders(movieId, country);
  } catch (err) {
    console.error("watch route error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  if (!movie) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const inTheatrical = movie.contentRatings.find((r) => r.type === "3");
  const inPrimary = inTheatrical ?? movie.contentRatings[0] ?? null;

  const buildProvider = (mp: (typeof movie.providers)[number]) => ({
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
    alternate_title: movie.alternateTitles[0]?.title ?? null,
    release_date: inPrimary?.releaseDate?.toISOString() ?? null,
    certification: inPrimary?.code || null,
    certification_type: inPrimary?.type ?? null,
    certification_label: inPrimary?.type ? (RELEASE_TYPE_LABELS[inPrimary.type] ?? null) : null,
    release_note: inPrimary?.note || null,
    all_release_dates: movie.contentRatings.map((r) => ({
      type: r.type,
      type_label: RELEASE_TYPE_LABELS[r.type] ?? r.type,
      release_date: r.releaseDate?.toISOString() ?? null,
      certification: r.code || null,
      note: r.note || null,
      language: r.language || null,
    })),
    stream: movie.providers.filter((p) => p.type === "flatrate").map(buildProvider),
    rent: movie.providers.filter((p) => p.type === "rent").map(buildProvider),
    buy: movie.providers.filter((p) => p.type === "buy").map(buildProvider),
    tmdb_watch_link: `https://www.themoviedb.org/movie/${movieId}/watch?locale=${country}`,
  };

  return NextResponse.json({ error: 0, data: { country_data: countryData } });
}

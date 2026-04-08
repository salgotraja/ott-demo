import { NextRequest, NextResponse } from "next/server";
import { findMovieById } from "@/lib/data/movies";
import { getCache, setCache } from "@/cache/helpers";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const { id } = await params;
  const movieId = parseInt(id, 10);
  if (isNaN(movieId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const key = `public:movies:${movieId}`;
  const cached = await getCache(key);
  if (cached) {
    try { return NextResponse.json(JSON.parse(cached)); } catch { /* fall through */ }
  }

  const movie = await findMovieById(movieId);

  if (!movie) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = {
    id: movie.id,
    title: movie.title,
    originalTitle: movie.originalTitle,
    tagline: movie.tagline,
    description: movie.description,
    runtime: movie.runtime,
    releaseDate: movie.releaseDate?.toISOString() ?? null,
    status: movie.status,
    adult: movie.adult,
    keywords: movie.keywords,
    voteAverage: movie.voteAverage,
    voteCount: movie.voteCount,
    originalLanguage: movie.originalLanguage,
    budget: movie.budget,
    revenue: movie.revenue,
    genres: movie.genres.map((g) => ({ id: g.genre.id, name: g.genre.name })),
    images: movie.images.map((i) => ({
      id: i.id,
      type: i.type,
      url: i.url,
      ratio: i.ratio,
      height: i.height,
      width: i.width,
    })),
    actors: movie.actors.map((a) => ({
      id: a.id,
      name: a.name,
      image: a.image,
      characterName: a.characterName,
      priority: a.priority,
    })),
    crew: movie.crew.map((c) => ({ id: c.id, name: c.name, job: c.job })),
    videos: movie.videos.map((v) => ({
      id: v.id,
      name: v.name,
      url: v.url,
      image: v.image,
      type: v.type,
    })),
    ratings: movie.ratings.map((r) => ({ source: r.source, value: r.value })),
    references: movie.references
      ? {
          imdbId: movie.references.imdbId,
          wikidataId: movie.references.wikidataId,
          home: movie.references.home,
        }
      : null,
    productions: movie.productions.map((p) => ({
      id: p.id,
      name: p.name,
      logo: p.logo,
      country: p.country,
    })),
    reviews: movie.reviews.map((r) => ({
      id: r.id,
      author: r.author,
      rating: r.rating,
      content: r.content,
      url: r.url,
      source: r.source,
      createdAt: r.createdAt?.toISOString() ?? null,
    })),
    contentRatings: movie.contentRatings.map((c) => ({
      country: c.country,
      code: c.code,
      type: c.type,
      releaseDate: c.releaseDate?.toISOString() ?? null,
      note: c.note,
      language: c.language,
    })),
    alternateTitles: movie.alternateTitles.map((a) => ({
      country: a.country,
      title: a.title,
      type: a.type,
    })),
    providers: movie.providers.map((p) => ({
      id: p.provider.id,
      type: p.type,
      region: p.region,
      url: p.url,
      cost: p.cost,
      quality: p.quality,
      provider: {
        id: p.provider.id,
        name: p.provider.name,
        logoPath: p.provider.logoPath,
        displayPriority: p.provider.displayPriority,
      },
    })),
  };

  const json = JSON.stringify(result);
  await setCache(key, json);
  return NextResponse.json(result);
}

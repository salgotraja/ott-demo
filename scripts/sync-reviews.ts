import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
dotenv.config({ path: resolve(process.cwd(), ".env") });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const RATE_LIMIT_MS = 300;

const DRY_RUN = process.argv.includes("--dry-run");
const TYPE = process.argv.find((a) => a.startsWith("--type="))?.split("=")[1] ?? "all";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface TmdbReview {
  id: string;
  author: string;
  author_details: { rating: number | null };
  content: string;
  created_at: string | null;
  updated_at: string | null;
  url: string;
}

interface TmdbReviewsResponse {
  results: TmdbReview[];
  total_pages: number;
}

async function fetchTMDB<T>(endpoint: string): Promise<T | null> {
  try {
    const isBearerToken = TMDB_API_KEY?.startsWith("eyJ");
    let url: string;
    let headers: HeadersInit = {};

    if (isBearerToken) {
      url = `${TMDB_BASE_URL}${endpoint}`;
      headers = { Authorization: `Bearer ${TMDB_API_KEY}`, Accept: "application/json" };
    } else {
      url = `${TMDB_BASE_URL}${endpoint}${endpoint.includes("?") ? "&" : "?"}api_key=${TMDB_API_KEY}`;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.error(`TMDB error ${res.status}: ${endpoint}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`Fetch error: ${endpoint}`, err);
    return null;
  }
}

async function fetchAllReviews(endpoint: string): Promise<TmdbReview[]> {
  const first = await fetchTMDB<TmdbReviewsResponse>(`${endpoint}?page=1`);
  if (!first) return [];

  const all: TmdbReview[] = [...first.results];
  for (let page = 2; page <= first.total_pages; page++) {
    await delay(RATE_LIMIT_MS);
    const next = await fetchTMDB<TmdbReviewsResponse>(`${endpoint}?page=${page}`);
    if (next) all.push(...next.results);
  }
  return all;
}

async function syncMovieReviews() {
  const movies = await prisma.movie.findMany({ select: { id: true, title: true } });
  console.log(`Syncing reviews for ${movies.length} movies...`);
  let updated = 0;

  for (const movie of movies) {
    await delay(RATE_LIMIT_MS);
    const reviews = await fetchAllReviews(`/movie/${movie.id}/reviews`);
    if (!reviews.length) continue;

    if (DRY_RUN) {
      console.log(`  [dry] movie ${movie.id} "${movie.title}": ${reviews.length} reviews`);
      continue;
    }

    for (const r of reviews) {
      await prisma.review.upsert({
        where: { movieId_reviewId: { movieId: movie.id, reviewId: r.id } },
        create: {
          movieId: movie.id,
          reviewId: r.id,
          author: r.author,
          content: r.content,
          rating: r.author_details.rating ?? null,
          url: r.url,
          source: "tmdb",
          createdAt: r.created_at ? new Date(r.created_at) : null,
          updatedAt: r.updated_at ? new Date(r.updated_at) : null,
        },
        update: {
          author: r.author,
          content: r.content,
          rating: r.author_details.rating ?? null,
          url: r.url,
          updatedAt: r.updated_at ? new Date(r.updated_at) : null,
        },
      });
    }

    console.log(`  movie ${movie.id} "${movie.title}": ${reviews.length} reviews`);
    updated++;
  }

  console.log(`Movies: ${updated} with reviews.`);
}

async function syncTvReviews() {
  const shows = await prisma.tvShow.findMany({ select: { id: true, name: true } });
  console.log(`Syncing reviews for ${shows.length} TV shows...`);
  let updated = 0;

  for (const show of shows) {
    await delay(RATE_LIMIT_MS);
    const reviews = await fetchAllReviews(`/tv/${show.id}/reviews`);
    if (!reviews.length) continue;

    if (DRY_RUN) {
      console.log(`  [dry] tv ${show.id} "${show.name}": ${reviews.length} reviews`);
      continue;
    }

    for (const r of reviews) {
      await prisma.tvReview.upsert({
        where: { tvShowId_reviewId: { tvShowId: show.id, reviewId: r.id } },
        create: {
          tvShowId: show.id,
          reviewId: r.id,
          author: r.author,
          content: r.content,
          rating: r.author_details.rating ?? null,
          url: r.url,
          source: "tmdb",
          createdAt: r.created_at ? new Date(r.created_at) : null,
          updatedAt: r.updated_at ? new Date(r.updated_at) : null,
        },
        update: {
          author: r.author,
          content: r.content,
          rating: r.author_details.rating ?? null,
          url: r.url,
          updatedAt: r.updated_at ? new Date(r.updated_at) : null,
        },
      });
    }

    console.log(`  tv ${show.id} "${show.name}": ${reviews.length} reviews`);
    updated++;
  }

  console.log(`TV shows: ${updated} with reviews.`);
}

async function main() {
  if (!TMDB_API_KEY) {
    console.error("TMDB_API_KEY not set");
    process.exit(1);
  }

  console.log(`Starting review sync | type=${TYPE} | dry-run=${DRY_RUN}`);

  if (TYPE === "movie" || TYPE === "all") await syncMovieReviews();
  if (TYPE === "tv" || TYPE === "all") await syncTvReviews();

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

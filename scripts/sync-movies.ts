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

async function fetchTMDB<T>(endpoint: string): Promise<T | null> {
  try {
    const isBearerToken = TMDB_API_KEY?.startsWith("eyJ");
    let url: string;
    let headers: HeadersInit = {};

    if (isBearerToken) {
      url = `${TMDB_BASE_URL}${endpoint}`;
      headers = {
        Authorization: `Bearer ${TMDB_API_KEY}`,
        Accept: "application/json",
      };
    } else {
      url = `${TMDB_BASE_URL}${endpoint}${endpoint.includes("?") ? "&" : "?"}api_key=${TMDB_API_KEY}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      console.error(`TMDB API error: ${response.status} ${endpoint}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`Fetch error: ${endpoint}`, error);
    return null;
  }
}

async function syncMovieData(movieId: number) {
  try {
    const movieData = await fetchTMDB<any>(`/movie/${movieId}`);
    if (!movieData) return false;

    await prisma.movie.update({
      where: { id: movieId },
      data: {
        title: movieData.title,
        description: movieData.overview,
        voteAverage: movieData.vote_average,
        voteCount: movieData.vote_count,
        popularity: movieData.popularity,
      },
    });

    return true;
  } catch (error) {
    console.error(`Failed to sync movie ${movieId}:`, error);
    return false;
  }
}

async function syncAllMovies() {
  console.log("Starting periodic sync...");
  const startTime = Date.now();

  const movies = await prisma.movie.findMany({
    select: { id: true, title: true },
  });

  console.log(`Found ${movies.length} movies to sync`);

  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];
    const success = await syncMovieData(movie.id);

    if (success) {
      successCount++;
    } else {
      failedCount++;
    }

    if ((i + 1) % 10 === 0) {
      console.log(`Synced ${i + 1}/${movies.length} movies`);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const duration = Math.floor((Date.now() - startTime) / 1000);
  console.log(`\nSync completed in ${Math.floor(duration / 60)}m ${duration % 60}s`);
  console.log(`Success: ${successCount}, Failed: ${failedCount}`);
}

async function main() {
  if (!TMDB_API_KEY) {
    console.error("TMDB_API_KEY not found in environment variables");
    process.exit(1);
  }

  await syncAllMovies();
}

main()
  .catch((error) => {
    console.error("Sync failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

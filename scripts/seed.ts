import { fetchTMDB, delay, REGION, RATE_LIMIT_DELAY } from "./lib/tmdb-client";
import { createPrismaClient } from "./lib/seed-helpers";
import type {
  TmdbProvider,
  TmdbMovieDetail,
  TmdbMoviePage,
  TmdbProviderCountry,
} from "./lib/tmdb-types";

const { prisma, pool } = createPrismaClient();

const TOTAL_PAGES = 5;
const ORIGIN_COUNTRY = "IN";

async function seedProviders(): Promise<void> {
  console.log(`Fetching streaming providers available in region ${REGION}...`);
  const data = await fetchTMDB<{ results: TmdbProvider[] }>(`/watch/providers/movie?watch_region=${REGION}`);

  if (!data?.results) {
    console.error("Failed to fetch providers");
    return;
  }

  for (const provider of data.results) {
    await prisma.provider.upsert({
      where: { id: provider.provider_id },
      update: {
        name: provider.provider_name,
        logoPath: provider.logo_path,
        displayPriority: provider.display_priority,
      },
      create: {
        id: provider.provider_id,
        name: provider.provider_name,
        logoPath: provider.logo_path,
        displayPriority: provider.display_priority,
      },
    });
  }

  console.log(`Seeded ${data.results.length} providers`);
}

async function seedMovies(): Promise<void> {
  const movieIds: number[] = [];

  console.log(`Fetching Indian-produced movies (origin country: ${ORIGIN_COUNTRY})...`);

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    const data = await fetchTMDB<TmdbMoviePage>(
      `/discover/movie?with_origin_country=${ORIGIN_COUNTRY}&sort_by=popularity.desc&page=${page}`,
    );
    if (data?.results) {
      movieIds.push(...data.results.map((m) => m.id));
      console.log(`  Page ${page}: Found ${data.results.length} movies`);
    }
    await delay(RATE_LIMIT_DELAY);
  }

  console.log(`Fetched ${movieIds.length} Indian movie IDs`);

  let successCount = 0;
  let skippedCount = 0;
  const failedIds: number[] = [];

  for (let i = 0; i < movieIds.length; i++) {
    const movieId = movieIds[i];

    try {
      const movieData = await fetchTMDB<TmdbMovieDetail>(`/movie/${movieId}`);
      if (!movieData) {
        failedIds.push(movieId);
        continue;
      }

      await prisma.movie.upsert({
        where: { id: movieData.id },
        update: {
          title: movieData.title,
          originalTitle: movieData.original_title,
          description: movieData.overview,
          releaseDate: movieData.release_date ? new Date(movieData.release_date) : null,
          voteAverage: movieData.vote_average,
          voteCount: movieData.vote_count,
          popularity: movieData.popularity,
          adult: movieData.adult,
        },
        create: {
          id: movieData.id,
          internalId: `movie-${movieData.id}`,
          title: movieData.title,
          originalTitle: movieData.original_title,
          description: movieData.overview,
          releaseDate: movieData.release_date ? new Date(movieData.release_date) : null,
          voteAverage: movieData.vote_average,
          voteCount: movieData.vote_count,
          popularity: movieData.popularity,
          adult: movieData.adult,
        },
      });

      for (const genre of movieData.genres) {
        await prisma.genre.upsert({
          where: { id: genre.id },
          update: { name: genre.name },
          create: { id: genre.id, name: genre.name },
        });

        await prisma.genreOnMovie.upsert({
          where: {
            movieId_genreId: {
              movieId: movieData.id,
              genreId: genre.id,
            },
          },
          update: {},
          create: {
            movieId: movieData.id,
            genreId: genre.id,
          },
        });
      }

      await delay(RATE_LIMIT_DELAY);

      const providerData = await fetchTMDB<{ results: Record<string, TmdbProviderCountry> }>(`/movie/${movieId}/watch/providers`);
      const indianProviders = providerData?.results?.[REGION];

      if (indianProviders && (indianProviders.flatrate || indianProviders.rent || indianProviders.buy)) {
        const providerTypes = [
          { type: "flatrate", providers: indianProviders.flatrate || [] },
          { type: "rent", providers: indianProviders.rent || [] },
          { type: "buy", providers: indianProviders.buy || [] },
        ];

        for (const { type, providers } of providerTypes) {
          for (const provider of providers) {
            await prisma.movieProvider.upsert({
              where: {
                movieId_providerId_type_region: {
                  movieId: movieData.id,
                  providerId: provider.provider_id,
                  type,
                  region: REGION,
                },
              },
              update: {},
              create: {
                movieId: movieData.id,
                providerId: provider.provider_id,
                type,
                region: REGION,
              },
            });
          }
        }
      } else {
        skippedCount++;
      }

      successCount++;
      if ((i + 1) % 25 === 0) {
        console.log(`Seeded ${i + 1}/${movieIds.length} movies (${successCount} with Indian providers, ${skippedCount} skipped)`);
      }

      await delay(RATE_LIMIT_DELAY);
    } catch (error) {
      console.error(`Failed to seed movie ${movieId}:`, error);
      failedIds.push(movieId);
    }
  }

  console.log(`Seeded ${successCount}/${movieIds.length} movies`);
  console.log(`Movies with ${REGION} providers: ${successCount - skippedCount}`);
  console.log(`Movies without ${REGION} providers: ${skippedCount}`);
  if (failedIds.length > 0) {
    console.log(`Failed movie IDs: ${failedIds.join(", ")}`);
  }
}

async function main(): Promise<void> {
  if (!process.env.TMDB_API_KEY) {
    console.error("TMDB_API_KEY not found in environment variables");
    process.exit(1);
  }

  const startTime = Date.now();
  console.log("Starting seed...");

  await seedProviders();
  await seedMovies();

  const duration = Math.floor((Date.now() - startTime) / 1000);
  console.log(`Seed completed in ${Math.floor(duration / 60)}m ${duration % 60}s`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

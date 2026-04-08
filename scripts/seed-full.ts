import { fetchTMDB, delay, generateInternalId, TMDB_IMAGE_BASE, REGION, RATE_LIMIT_DELAY } from "./lib/tmdb-client";
import {
  createPrismaClient,
  seedImages,
  seedVideos,
  seedMovieActors,
  seedMovieCrew,
  seedMovieProviders,
  seedMovieReviews,
} from "./lib/seed-helpers";
import type {
  TmdbMovieDetail,
  TmdbMoviePage,
  TmdbCredits,
  TmdbVideos,
  TmdbImages,
  TmdbMovieKeywords,
  TmdbAlternateTitles,
  TmdbExternalIds,
  TmdbReleaseDates,
  TmdbProviderResults,
  TmdbReviews,
  TmdbProvider,
} from "./lib/tmdb-types";

const { prisma, pool } = createPrismaClient();

const INDIAN_MOVIES_PAGES = 3;
const POPULAR_MOVIES_PAGES = 2;
const ORIGIN_COUNTRY = "IN";

async function seedProviders(): Promise<void> {
  console.log("Fetching providers...");
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
  for (let page = 1; page <= INDIAN_MOVIES_PAGES; page++) {
    const data = await fetchTMDB<TmdbMoviePage>(
      `/discover/movie?with_origin_country=${ORIGIN_COUNTRY}&sort_by=popularity.desc&page=${page}`,
    );
    if (data?.results) {
      movieIds.push(...data.results.map((m) => m.id));
      console.log(`  Indian Page ${page}: Found ${data.results.length} movies`);
    }
    await delay(RATE_LIMIT_DELAY);
  }

  console.log(`Fetched ${movieIds.length} Indian movie IDs`);

  console.log(`\nFetching popular movies available in India...`);
  for (let page = 1; page <= POPULAR_MOVIES_PAGES; page++) {
    const data = await fetchTMDB<TmdbMoviePage>(
      `/movie/popular?region=${REGION}&page=${page}`,
    );
    if (data?.results) {
      const newIds = data.results.map((m) => m.id).filter((id) => !movieIds.includes(id));
      movieIds.push(...newIds);
      console.log(`  Popular Page ${page}: Found ${data.results.length} movies (${newIds.length} new, ${data.results.length - newIds.length} duplicates)`);
    }
    await delay(RATE_LIMIT_DELAY);
  }

  console.log(`\nTotal unique movie IDs: ${movieIds.length}`);

  let successCount = 0;
  const failedIds: number[] = [];

  for (let i = 0; i < movieIds.length; i++) {
    const movieId = movieIds[i];

    try {
      const [movieData, credits, videos, images, keywords, altTitles, externalIds, releaseDates, providers, reviews] = await Promise.all([
        fetchTMDB<TmdbMovieDetail>(`/movie/${movieId}`),
        fetchTMDB<TmdbCredits>(`/movie/${movieId}/credits`),
        fetchTMDB<TmdbVideos>(`/movie/${movieId}/videos`),
        fetchTMDB<TmdbImages>(`/movie/${movieId}/images`),
        fetchTMDB<TmdbMovieKeywords>(`/movie/${movieId}/keywords`),
        fetchTMDB<TmdbAlternateTitles>(`/movie/${movieId}/alternative_titles`),
        fetchTMDB<TmdbExternalIds>(`/movie/${movieId}/external_ids`),
        fetchTMDB<TmdbReleaseDates>(`/movie/${movieId}/release_dates`),
        fetchTMDB<TmdbProviderResults>(`/movie/${movieId}/watch/providers`),
        fetchTMDB<TmdbReviews>(`/movie/${movieId}/reviews`),
      ]);

      if (!movieData) {
        failedIds.push(movieId);
        continue;
      }

      const internalId = generateInternalId(movieId);
      const releaseYear = movieData.release_date ? new Date(movieData.release_date).getFullYear() : null;

      const existingMovie = await prisma.movie.findUnique({
        where: { id: movieData.id },
      });

      if (existingMovie) {
        await prisma.actor.deleteMany({ where: { movieId: movieData.id } });
        await prisma.crew.deleteMany({ where: { movieId: movieData.id } });
        await prisma.movieImage.deleteMany({ where: { movieId: movieData.id } });
        await prisma.video.deleteMany({ where: { movieId: movieData.id } });
        await prisma.rating.deleteMany({ where: { movieId: movieData.id } });
        await prisma.alternateTitle.deleteMany({ where: { movieId: movieData.id } });
        await prisma.contentRating.deleteMany({ where: { movieId: movieData.id } });
        await prisma.spokenLanguage.deleteMany({ where: { movieId: movieData.id } });
        await prisma.production.deleteMany({ where: { movieId: movieData.id } });
        await prisma.genreOnMovie.deleteMany({ where: { movieId: movieData.id } });
        await prisma.movieProvider.deleteMany({ where: { movieId: movieData.id } });
        await prisma.reference.deleteMany({ where: { movieId: movieData.id } });
        await prisma.movie.delete({ where: { id: movieData.id } });
      }

      await prisma.movie.create({
        data: {
          id: movieData.id,
          internalId,
          tmdbId: movieData.id.toString(),
          imdbId: externalIds?.imdb_id || null,
          title: movieData.title,
          originalTitle: movieData.original_title,
          tagline: movieData.tagline || null,
          status: movieData.status || null,
          description: movieData.overview,
          runtime: movieData.runtime,
          type: "movie",
          releaseYear,
          releaseDate: movieData.release_date ? new Date(movieData.release_date) : null,
          budget: movieData.budget ? `$${movieData.budget}` : null,
          revenue: movieData.revenue ? `$${movieData.revenue}` : null,
          adult: movieData.adult,
          keywords: keywords?.keywords?.map((k) => k.name).join(",") || null,
          voteAverage: movieData.vote_average,
          voteCount: movieData.vote_count,
          popularity: movieData.popularity,
          originalLanguage: movieData.original_language,
        },
      });

      if (altTitles?.titles) {
        for (const alt of altTitles.titles) {
          await prisma.alternateTitle.create({
            data: {
              movieId: movieData.id,
              country: alt.iso_3166_1,
              title: alt.title,
              type: alt.type || null,
            },
          });
        }
      }

      if (releaseDates?.results) {
        for (const release of releaseDates.results) {
          for (const date of release.release_dates || []) {
            await prisma.contentRating.create({
              data: {
                movieId: movieData.id,
                code: date.certification || "",
                country: release.iso_3166_1,
                type: String(date.type),
                releaseDate: date.release_date ? new Date(date.release_date) : null,
                note: date.note || null,
                language: date.iso_639_1 || null,
              },
            });
          }
        }
      }

      if (movieData.spoken_languages) {
        for (const lang of movieData.spoken_languages) {
          await prisma.spokenLanguage.create({
            data: {
              movieId: movieData.id,
              code: lang.iso_639_1,
            },
          });
        }
      }

      await prisma.rating.create({
        data: {
          movieId: movieData.id,
          source: "TMDB",
          value: Math.round((movieData.vote_average / 10) * 100),
          contentId: `https://www.themoviedb.org/movie/${movieData.id}`,
          sourceUrl: `https://www.themoviedb.org/movie/${movieData.id}`,
        },
      });

      if (externalIds?.imdb_id) {
        await prisma.rating.create({
          data: {
            movieId: movieData.id,
            source: "IMDB",
            value: Math.round((movieData.vote_average / 10) * 100),
            contentId: `https://www.imdb.com/title/${externalIds.imdb_id}/`,
            sourceUrl: `https://www.imdb.com/title/${externalIds.imdb_id}/`,
          },
        });
      }

      await seedImages(prisma, "movie", movieData.id, images);

      await prisma.reference.create({
        data: {
          movieId: movieData.id,
          home: movieData.homepage || null,
          imdbId: externalIds?.imdb_id || null,
          facebookId: externalIds?.facebook_id || null,
          instagramId: externalIds?.instagram_id || null,
          twitterId: externalIds?.twitter_id || null,
          wikidataId: externalIds?.wikidata_id || null,
          tmdbId: movieData.id.toString(),
          tiktokId: externalIds?.tiktok_id || null,
          youtubeId: externalIds?.youtube_channel_id || null,
        },
      });

      await seedMovieReviews(prisma, movieData.id, reviews);
      await seedVideos(prisma, "movie", movieData.id, videos);
      await seedMovieActors(prisma, movieData.id, credits);
      await seedMovieCrew(prisma, movieData.id, credits);

      if (movieData.production_companies) {
        for (const company of movieData.production_companies) {
          await prisma.production.create({
            data: {
              movieId: movieData.id,
              name: company.name,
              logo: company.logo_path ? `${TMDB_IMAGE_BASE}/w185${company.logo_path}` : null,
              country: company.origin_country || null,
            },
          });
        }
      }

      for (const genre of movieData.genres) {
        await prisma.genre.upsert({
          where: { id: genre.id },
          update: { name: genre.name },
          create: { id: genre.id, name: genre.name },
        });

        await prisma.genreOnMovie.create({
          data: {
            movieId: movieData.id,
            genreId: genre.id,
          },
        });
      }

      await seedMovieProviders(prisma, movieData.id, providers);

      successCount++;
      if ((i + 1) % 10 === 0) {
        console.log(`Seeded ${i + 1}/${movieIds.length} movies`);
      }

      await delay(RATE_LIMIT_DELAY);
    } catch (error) {
      console.error(`Failed to seed movie ${movieId}:`, error);
      failedIds.push(movieId);
    }
  }

  console.log(`Seeded ${successCount}/${movieIds.length} movies`);
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
  console.log("Starting full seed...");

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

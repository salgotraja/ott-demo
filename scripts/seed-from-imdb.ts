import { fetchTMDB, delay, generateInternalId, TMDB_IMAGE_BASE, RATE_LIMIT_DELAY } from "./lib/tmdb-client";
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
  TmdbCredits,
  TmdbVideos,
  TmdbImages,
  TmdbMovieKeywords,
  TmdbAlternateTitles,
  TmdbExternalIds,
  TmdbReleaseDates,
  TmdbProviderResults,
  TmdbReviews,
  TmdbMovieListItem,
} from "./lib/tmdb-types";

const { prisma, pool } = createPrismaClient();

async function resolveImdbToTmdb(imdbId: string): Promise<number | null> {
  console.log(`Resolving IMDb ID: ${imdbId}...`);

  const data = await fetchTMDB<{ movie_results: TmdbMovieListItem[] }>(`/find/${imdbId}?external_source=imdb_id`);

  if (!data) {
    console.error(`Failed to resolve IMDb ID: ${imdbId}`);
    return null;
  }

  if (data.movie_results && data.movie_results.length > 0) {
    const tmdbId = data.movie_results[0].id;
    const title = data.movie_results[0].title;
    console.log(`Resolved to TMDB ID: ${tmdbId} (${title})`);
    return tmdbId;
  }

  console.error(`No TMDB movie found for IMDb ID: ${imdbId}`);
  return null;
}

async function seedSingleMovie(movieId: number): Promise<boolean> {
  console.log(`Seeding movie ${movieId}...`);

  try {
    const existingMovie = await prisma.movie.findUnique({
      where: { id: movieId },
    });

    if (existingMovie) {
      console.log(`Movie ${movieId} already exists in database. Updating...`);
      await prisma.actor.deleteMany({ where: { movieId } });
      await prisma.crew.deleteMany({ where: { movieId } });
      await prisma.movieImage.deleteMany({ where: { movieId } });
      await prisma.video.deleteMany({ where: { movieId } });
      await prisma.rating.deleteMany({ where: { movieId } });
      await prisma.alternateTitle.deleteMany({ where: { movieId } });
      await prisma.contentRating.deleteMany({ where: { movieId } });
      await prisma.spokenLanguage.deleteMany({ where: { movieId } });
      await prisma.production.deleteMany({ where: { movieId } });
      await prisma.genreOnMovie.deleteMany({ where: { movieId } });
      await prisma.movieProvider.deleteMany({ where: { movieId } });
      await prisma.reference.deleteMany({ where: { movieId } });
      await prisma.review.deleteMany({ where: { movieId } });
      await prisma.movie.delete({ where: { id: movieId } });
    }

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
      console.error(`Failed to fetch movie data for ${movieId}`);
      return false;
    }

    const internalId = generateInternalId(movieId);
    const releaseYear = movieData.release_date ? new Date(movieData.release_date).getFullYear() : null;

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

    console.log(`  Created movie: ${movieData.title}`);

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
      console.log(`  Added ${altTitles.titles.length} alternate titles`);
    }

    if (releaseDates?.results) {
      let ratingCount = 0;
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
          ratingCount++;
        }
      }
      console.log(`  Added ${ratingCount} release date entries`);
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
      console.log(`  Added ${movieData.spoken_languages.length} spoken languages`);
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
    console.log(`  Added ${Math.min(reviews?.results?.length ?? 0, 10)} reviews`);

    await seedVideos(prisma, "movie", movieData.id, videos);
    console.log(`  Added ${videos?.results?.length ?? 0} videos`);

    await seedMovieActors(prisma, movieData.id, credits);
    console.log(`  Added ${Math.min(credits?.cast?.length ?? 0, 20)} cast members`);

    await seedMovieCrew(prisma, movieData.id, credits);
    const importantJobs = ["Director", "Producer", "Writer", "Screenplay", "Music", "Cinematography"];
    const filteredCrewCount = credits?.crew?.filter((c) => importantJobs.includes(c.job)).length ?? 0;
    console.log(`  Added ${filteredCrewCount} crew members`);

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
      console.log(`  Added ${movieData.production_companies.length} production companies`);
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
    console.log(`  Added ${movieData.genres.length} genres`);

    await seedMovieProviders(prisma, movieData.id, providers);

    console.log(`Successfully seeded movie ${movieId}: ${movieData.title}`);
    return true;
  } catch (error) {
    console.error(`Failed to seed movie ${movieId}:`, error);
    return false;
  }
}

async function main(): Promise<void> {
  if (!process.env.TMDB_API_KEY) {
    console.error("TMDB_API_KEY not found in environment variables");
    process.exit(1);
  }

  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: tsx scripts/seed-from-imdb.ts <imdb_id1> [imdb_id2] ...");
    console.log("Example: tsx scripts/seed-from-imdb.ts tt33014583 tt0111161");
    process.exit(1);
  }

  const startTime = Date.now();
  console.log(`Processing ${args.length} IMDb ID(s)...\n`);

  let successCount = 0;
  const failedIds: string[] = [];

  for (const imdbId of args) {
    const tmdbId = await resolveImdbToTmdb(imdbId);

    if (!tmdbId) {
      failedIds.push(imdbId);
      continue;
    }

    await delay(RATE_LIMIT_DELAY);

    const result = await seedSingleMovie(tmdbId);

    if (result) {
      successCount++;
    } else {
      failedIds.push(imdbId);
    }

    await delay(RATE_LIMIT_DELAY);
    console.log("");
  }

  const duration = Math.floor((Date.now() - startTime) / 1000);
  console.log(`\nProcessing complete in ${Math.floor(duration / 60)}m ${duration % 60}s`);
  console.log(`Successfully seeded: ${successCount}/${args.length} movies`);

  if (failedIds.length > 0) {
    console.log(`Failed IMDb IDs: ${failedIds.join(", ")}`);
  }
}

main()
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

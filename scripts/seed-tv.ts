import { fetchTMDB, delay, generateInternalId, TMDB_IMAGE_BASE, REGION, RATE_LIMIT_DELAY } from "./lib/tmdb-client";
import {
  createPrismaClient,
  seedImages,
  seedVideos,
  seedTvActors,
  seedTvCrew,
  seedTvProviders,
  seedTvReviews,
} from "./lib/seed-helpers";
import type {
  TmdbTvDetail,
  TmdbTvPage,
  TmdbCredits,
  TmdbVideos,
  TmdbImages,
  TmdbTvKeywords,
  TmdbAlternateTitles,
  TmdbExternalIds,
  TmdbContentRatings,
  TmdbProviderResults,
  TmdbReviews,
} from "./lib/tmdb-types";

const { prisma, pool } = createPrismaClient();

const INDIAN_TV_PAGES = 3;
const POPULAR_TV_PAGES = 2;
const ORIGIN_COUNTRY = "IN";

async function seedTvShows(): Promise<void> {
  const tvShowIds: number[] = [];

  console.log(`Fetching Indian-produced TV shows (origin country: ${ORIGIN_COUNTRY})...`);
  for (let page = 1; page <= INDIAN_TV_PAGES; page++) {
    const data = await fetchTMDB<TmdbTvPage>(
      `/discover/tv?with_origin_country=${ORIGIN_COUNTRY}&sort_by=popularity.desc&page=${page}`,
    );
    if (data?.results) {
      tvShowIds.push(...data.results.map((tv) => tv.id));
      console.log(`  Indian Page ${page}: Found ${data.results.length} TV shows`);
    }
    await delay(RATE_LIMIT_DELAY);
  }

  console.log(`Fetched ${tvShowIds.length} Indian TV show IDs`);

  console.log(`\nFetching popular TV shows available in India...`);
  for (let page = 1; page <= POPULAR_TV_PAGES; page++) {
    const data = await fetchTMDB<TmdbTvPage>(
      `/tv/popular?region=${REGION}&page=${page}`,
    );
    if (data?.results) {
      const newIds = data.results.map((tv) => tv.id).filter((id) => !tvShowIds.includes(id));
      tvShowIds.push(...newIds);
      console.log(`  Popular Page ${page}: Found ${data.results.length} TV shows (${newIds.length} new, ${data.results.length - newIds.length} duplicates)`);
    }
    await delay(RATE_LIMIT_DELAY);
  }

  console.log(`\nTotal unique TV show IDs: ${tvShowIds.length}`);

  let successCount = 0;
  const failedIds: number[] = [];

  for (let i = 0; i < tvShowIds.length; i++) {
    const tvShowId = tvShowIds[i];

    try {
      const [tvData, credits, videos, images, keywords, altTitles, externalIds, contentRatings, providers, reviews] = await Promise.all([
        fetchTMDB<TmdbTvDetail>(`/tv/${tvShowId}`),
        fetchTMDB<TmdbCredits>(`/tv/${tvShowId}/aggregate_credits`),
        fetchTMDB<TmdbVideos>(`/tv/${tvShowId}/videos`),
        fetchTMDB<TmdbImages>(`/tv/${tvShowId}/images`),
        fetchTMDB<TmdbTvKeywords>(`/tv/${tvShowId}/keywords`),
        fetchTMDB<TmdbAlternateTitles>(`/tv/${tvShowId}/alternative_titles`),
        fetchTMDB<TmdbExternalIds>(`/tv/${tvShowId}/external_ids`),
        fetchTMDB<TmdbContentRatings>(`/tv/${tvShowId}/content_ratings`),
        fetchTMDB<TmdbProviderResults>(`/tv/${tvShowId}/watch/providers`),
        fetchTMDB<TmdbReviews>(`/tv/${tvShowId}/reviews`),
      ]);

      if (!tvData) {
        failedIds.push(tvShowId);
        continue;
      }

      const internalId = generateInternalId(tvShowId, "tv");

      const existingShow = await prisma.tvShow.findUnique({
        where: { id: tvData.id },
      });

      if (existingShow) {
        await prisma.tvActor.deleteMany({ where: { tvShowId: tvData.id } });
        await prisma.tvCrew.deleteMany({ where: { tvShowId: tvData.id } });
        await prisma.tvShowImage.deleteMany({ where: { tvShowId: tvData.id } });
        await prisma.tvVideo.deleteMany({ where: { tvShowId: tvData.id } });
        await prisma.tvRating.deleteMany({ where: { tvShowId: tvData.id } });
        await prisma.tvAlternateTitle.deleteMany({ where: { tvShowId: tvData.id } });
        await prisma.tvContentRating.deleteMany({ where: { tvShowId: tvData.id } });
        await prisma.tvSpokenLanguage.deleteMany({ where: { tvShowId: tvData.id } });
        await prisma.tvProduction.deleteMany({ where: { tvShowId: tvData.id } });
        await prisma.genreOnTvShow.deleteMany({ where: { tvShowId: tvData.id } });
        await prisma.tvShowProvider.deleteMany({ where: { tvShowId: tvData.id } });
        await prisma.tvReference.deleteMany({ where: { tvShowId: tvData.id } });
        await prisma.tvReview.deleteMany({ where: { tvShowId: tvData.id } });
        await prisma.tvShow.delete({ where: { id: tvData.id } });
      }

      await prisma.tvShow.create({
        data: {
          id: tvData.id,
          internalId,
          tmdbId: tvData.id.toString(),
          imdbId: externalIds?.imdb_id || null,
          name: tvData.name,
          originalName: tvData.original_name,
          tagline: tvData.tagline || null,
          status: tvData.status || null,
          description: tvData.overview,
          type: "tv",
          firstAirDate: tvData.first_air_date ? new Date(tvData.first_air_date) : null,
          lastAirDate: tvData.last_air_date ? new Date(tvData.last_air_date) : null,
          numberOfSeasons: tvData.number_of_seasons,
          numberOfEpisodes: tvData.number_of_episodes,
          keywords: keywords?.results?.map((k) => k.name).join(",") || null,
          adult: tvData.adult || false,
          voteAverage: tvData.vote_average,
          voteCount: tvData.vote_count,
          popularity: tvData.popularity,
          originalLanguage: tvData.original_language,
        },
      });

      if (altTitles?.results) {
        for (const alt of altTitles.results) {
          await prisma.tvAlternateTitle.create({
            data: {
              tvShowId: tvData.id,
              country: alt.iso_3166_1,
              title: alt.title,
              type: alt.type || null,
            },
          });
        }
      }

      if (contentRatings?.results) {
        for (const rating of contentRatings.results) {
          await prisma.tvContentRating.create({
            data: {
              tvShowId: tvData.id,
              code: rating.rating || "",
              country: rating.iso_3166_1,
              type: "TV",
            },
          });
        }
      }

      if (tvData.spoken_languages) {
        for (const lang of tvData.spoken_languages) {
          await prisma.tvSpokenLanguage.create({
            data: {
              tvShowId: tvData.id,
              code: lang.iso_639_1,
            },
          });
        }
      }

      await prisma.tvRating.create({
        data: {
          tvShowId: tvData.id,
          source: "TMDB",
          value: Math.round((tvData.vote_average / 10) * 100),
          contentId: `https://www.themoviedb.org/tv/${tvData.id}`,
          sourceUrl: `https://www.themoviedb.org/tv/${tvData.id}`,
        },
      });

      if (externalIds?.imdb_id) {
        await prisma.tvRating.create({
          data: {
            tvShowId: tvData.id,
            source: "IMDB",
            value: Math.round((tvData.vote_average / 10) * 100),
            contentId: `https://www.imdb.com/title/${externalIds.imdb_id}/`,
            sourceUrl: `https://www.imdb.com/title/${externalIds.imdb_id}/`,
          },
        });
      }

      await seedImages(prisma, "tv", tvData.id, images);

      await prisma.tvReference.create({
        data: {
          tvShowId: tvData.id,
          home: tvData.homepage || null,
          imdbId: externalIds?.imdb_id || null,
          facebookId: externalIds?.facebook_id || null,
          instagramId: externalIds?.instagram_id || null,
          twitterId: externalIds?.twitter_id || null,
          wikidataId: externalIds?.wikidata_id || null,
          tiktokId: externalIds?.tiktok_id || null,
          youtubeId: externalIds?.youtube_id || null,
          tmdbId: tvData.id.toString(),
        },
      });

      await seedVideos(prisma, "tv", tvData.id, videos);
      await seedTvActors(prisma, tvData.id, credits);
      await seedTvCrew(prisma, tvData.id, credits);

      if (tvData.production_companies) {
        for (const company of tvData.production_companies) {
          await prisma.tvProduction.create({
            data: {
              tvShowId: tvData.id,
              name: company.name,
              logo: company.logo_path ? `${TMDB_IMAGE_BASE}/w185${company.logo_path}` : null,
              country: company.origin_country || null,
            },
          });
        }
      }

      for (const genre of tvData.genres) {
        await prisma.genre.upsert({
          where: { id: genre.id },
          update: { name: genre.name },
          create: { id: genre.id, name: genre.name },
        });

        await prisma.genreOnTvShow.create({
          data: {
            tvShowId: tvData.id,
            genreId: genre.id,
          },
        });
      }

      await seedTvProviders(prisma, tvData.id, providers);
      await seedTvReviews(prisma, tvData.id, reviews);

      successCount++;
      if ((i + 1) % 10 === 0) {
        console.log(`Seeded ${i + 1}/${tvShowIds.length} TV shows`);
      }

      await delay(RATE_LIMIT_DELAY);
    } catch (error) {
      console.error(`Failed to seed TV show ${tvShowId}:`, error);
      failedIds.push(tvShowId);
    }
  }

  console.log(`\nSuccessfully seeded ${successCount}/${tvShowIds.length} TV shows`);
  if (failedIds.length > 0) {
    console.log(`Failed IDs: ${failedIds.join(", ")}`);
  }
}

async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("TV Show Seeding Script");
  console.log("=".repeat(60));

  if (!process.env.TMDB_API_KEY) {
    console.error("TMDB_API_KEY not found in environment variables");
    process.exit(1);
  }

  const startTime = Date.now();

  console.log(`Region: ${REGION}`);
  console.log(`Target: ${INDIAN_TV_PAGES * 20} Indian TV shows + ${POPULAR_TV_PAGES * 20} popular TV shows`);
  console.log("");

  await seedTvShows();

  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log("\n" + "=".repeat(60));
  console.log(`TV Show seeding completed in ${duration} minutes`);
  console.log("=".repeat(60));

  await pool.end();
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

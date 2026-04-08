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
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const RATE_LIMIT_DELAY = 500;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

async function seedSeasons() {
  const tvShows = await prisma.tvShow.findMany({
    select: { id: true, name: true, numberOfSeasons: true },
    orderBy: { id: "asc" },
  });

  console.log(`Found ${tvShows.length} TV shows to process`);

  let showSuccess = 0;
  let totalSeasons = 0;
  let totalEpisodes = 0;

  for (let i = 0; i < tvShows.length; i++) {
    const tvShow = tvShows[i];
    const seasonCount = tvShow.numberOfSeasons ?? 0;

    if (seasonCount === 0) {
      console.log(`  [${i + 1}/${tvShows.length}] ${tvShow.name} — no seasons, skipping`);
      continue;
    }

    console.log(`[${i + 1}/${tvShows.length}] ${tvShow.name} (${seasonCount} seasons)`);

    // Delete existing season data for this show
    const existingSeasons = await prisma.season.findMany({
      where: { tvShowId: tvShow.id },
      select: { id: true },
    });
    if (existingSeasons.length > 0) {
      const seasonIds = existingSeasons.map((s) => s.id);
      await prisma.episode.deleteMany({ where: { seasonId: { in: seasonIds } } });
      await prisma.seasonImage.deleteMany({ where: { seasonId: { in: seasonIds } } });
      await prisma.seasonVideo.deleteMany({ where: { seasonId: { in: seasonIds } } });
      await prisma.seasonProvider.deleteMany({ where: { seasonId: { in: seasonIds } } });
      await prisma.season.deleteMany({ where: { tvShowId: tvShow.id } });
    }

    for (let seasonNum = 1; seasonNum <= seasonCount; seasonNum++) {
      try {
        // Parallel fetch of all season data
        const [seasonData, images, videos, providers] = await Promise.all([
          fetchTMDB<any>(`/tv/${tvShow.id}/season/${seasonNum}`),
          fetchTMDB<any>(`/tv/${tvShow.id}/season/${seasonNum}/images`),
          fetchTMDB<any>(`/tv/${tvShow.id}/season/${seasonNum}/videos`),
          fetchTMDB<any>(`/tv/${tvShow.id}/season/${seasonNum}/watch/providers`),
        ]);

        if (!seasonData) {
          console.log(`    Season ${seasonNum}: no data, skipping`);
          continue;
        }

        const season = await prisma.season.create({
          data: {
            tvShowId: tvShow.id,
            seasonNumber: seasonNum,
            name: seasonData.name || `Season ${seasonNum}`,
            overview: seasonData.overview || null,
            airDate: seasonData.air_date ? new Date(seasonData.air_date) : null,
            posterPath: seasonData.poster_path || null,
            voteAverage: seasonData.vote_average ?? null,
            episodeCount: seasonData.episodes?.length ?? null,
          },
        });

        // Store episodes
        if (seasonData.episodes) {
          for (const ep of seasonData.episodes) {
            if (!ep.episode_number) continue;
            await prisma.episode.create({
              data: {
                tvShowId: tvShow.id,
                seasonId: season.id,
                seasonNumber: seasonNum,
                episodeNumber: ep.episode_number,
                name: ep.name || `Episode ${ep.episode_number}`,
                overview: ep.overview || null,
                airDate: ep.air_date ? new Date(ep.air_date) : null,
                runtime: ep.runtime ?? null,
                stillPath: ep.still_path || null,
                voteAverage: ep.vote_average ?? null,
                voteCount: ep.vote_count ?? null,
              },
            });
          }
          totalEpisodes += seasonData.episodes.length;
        }

        // Season images
        if (images?.posters) {
          for (const poster of images.posters.slice(0, 5)) {
            await prisma.seasonImage.create({
              data: {
                seasonId: season.id,
                url: `${TMDB_IMAGE_BASE}/original${poster.file_path}`,
                type: "poster",
                ratio: poster.aspect_ratio,
                height: poster.height,
                width: poster.width,
              },
            });
          }
        }
        if (images?.backdrops) {
          for (const backdrop of images.backdrops.slice(0, 5)) {
            await prisma.seasonImage.create({
              data: {
                seasonId: season.id,
                url: `${TMDB_IMAGE_BASE}/original${backdrop.file_path}`,
                type: "backdrop",
                ratio: backdrop.aspect_ratio,
                height: backdrop.height,
                width: backdrop.width,
              },
            });
          }
        }

        // Season videos
        if (videos?.results) {
          for (const video of videos.results.slice(0, 3)) {
            await prisma.seasonVideo.create({
              data: {
                seasonId: season.id,
                name: video.name,
                source: video.site || null,
                type: video.type || null,
                url: `https://www.youtube.com/watch?v=${video.key}`,
                image: `https://img.youtube.com/vi/${video.key}/maxresdefault.jpg`,
                official: video.official || false,
              },
            });
          }
        }

        // Season providers — all countries
        if (providers?.results) {
          for (const [countryCode, countryData] of Object.entries(providers.results as Record<string, any>)) {
            const tmdbLink = countryData.link ?? `https://www.themoviedb.org/tv/${tvShow.id}/watch?locale=${countryCode}`;
            const providerTypes = [
              { type: "flatrate", list: countryData.flatrate || [] },
              { type: "rent", list: countryData.rent || [] },
              { type: "buy", list: countryData.buy || [] },
            ];
            for (const { type, list } of providerTypes) {
              for (const provider of list) {
                const providerId: number = provider.provider_id;
                const exists = await prisma.provider.findUnique({ where: { id: providerId } });
                if (!exists) continue;
                try {
                  await prisma.seasonProvider.create({
                    data: { seasonId: season.id, providerId, type, region: countryCode, url: tmdbLink },
                  });
                } catch { /* skip duplicate */ }
              }
            }
          }
        }

        totalSeasons++;
      } catch (error) {
        console.error(`    Failed season ${seasonNum} of ${tvShow.name}:`, error);
      }
    }

    showSuccess++;
    await delay(RATE_LIMIT_DELAY);
  }

  console.log(`\nDone: ${showSuccess}/${tvShows.length} shows, ${totalSeasons} seasons, ${totalEpisodes} episodes`);
}

async function main() {
  console.log("=".repeat(60));
  console.log("TV Season/Episode Seeding Script");
  console.log("=".repeat(60));

  if (!TMDB_API_KEY) {
    console.error("TMDB_API_KEY not found");
    process.exit(1);
  }

  const startTime = Date.now();
  await seedSeasons();
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log("\n" + "=".repeat(60));
  console.log(`Season seeding completed in ${duration} minutes`);
  console.log("=".repeat(60));

  await pool.end();
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

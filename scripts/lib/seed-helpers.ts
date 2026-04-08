import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { resolve } from "path";
import { TMDB_IMAGE_BASE } from "./tmdb-client";
import type {
  TmdbImages,
  TmdbVideos,
  TmdbCredits,
  TmdbProviderResults,
  TmdbReviews,
  TmdbCastMember,
  TmdbCrewMember,
} from "./tmdb-types";
import { generateInternalId, genderLabel } from "./tmdb-client";

const MOVIE_IMPORTANT_JOBS = ["Director", "Producer", "Writer", "Screenplay", "Music", "Cinematography"];
const TV_IMPORTANT_JOBS = ["Director", "Producer", "Writer", "Screenplay", "Music", "Cinematography", "Executive Producer"];

export interface PrismaClientWithPool {
  prisma: PrismaClient;
  pool: Pool;
}

export function createPrismaClient(): PrismaClientWithPool {
  dotenv.config({ path: resolve(process.cwd(), ".env.local") });
  dotenv.config({ path: resolve(process.cwd(), ".env") });

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  return { prisma, pool };
}

export async function seedImages(
  prisma: PrismaClient,
  entityType: "movie" | "tv",
  entityId: number,
  images: TmdbImages | null,
): Promise<void> {
  if (!images) return;

  const imageSpecs: Array<{ list: typeof images.posters; type: string; limit: number }> = [
    { list: images.posters, type: "poster", limit: 8 },
    { list: images.backdrops, type: "backdrop", limit: 10 },
    { list: images.logos, type: "logo", limit: 3 },
  ];

  for (const { list, type, limit } of imageSpecs) {
    if (!list) continue;
    for (const img of list.slice(0, limit)) {
      const data = {
        url: `${TMDB_IMAGE_BASE}/original${img.file_path}`,
        type,
        ratio: img.aspect_ratio,
        height: img.height,
        width: img.width,
      };

      if (entityType === "movie") {
        await prisma.movieImage.create({ data: { movieId: entityId, ...data } });
      } else {
        await prisma.tvShowImage.create({ data: { tvShowId: entityId, ...data } });
      }
    }
  }
}

export async function seedVideos(
  prisma: PrismaClient,
  entityType: "movie" | "tv",
  entityId: number,
  videos: TmdbVideos | null,
): Promise<void> {
  if (!videos?.results) return;

  for (const video of videos.results.slice(0, 5)) {
    const data = {
      name: video.name,
      description: null as string | null,
      duration: null as number | null,
      size: video.size || null,
      official: video.official || false,
      source: video.site,
      type: video.type,
      url: `https://www.youtube.com/watch?v=${video.key}`,
      image: `https://img.youtube.com/vi/${video.key}/maxresdefault.jpg`,
    };

    if (entityType === "movie") {
      await prisma.video.create({ data: { movieId: entityId, ...data } });
    } else {
      await prisma.tvVideo.create({ data: { tvShowId: entityId, ...data } });
    }
  }
}

export async function seedMovieActors(
  prisma: PrismaClient,
  movieId: number,
  credits: TmdbCredits | null,
): Promise<void> {
  if (!credits?.cast) return;

  for (let idx = 0; idx < Math.min(credits.cast.length, 20); idx++) {
    const actor: TmdbCastMember = credits.cast[idx];
    await prisma.actor.create({
      data: {
        movieId,
        actorId: actor.id,
        internalId: generateInternalId(actor.id),
        name: actor.name,
        originalName: actor.original_name,
        gender: genderLabel(actor.gender),
        image: actor.profile_path ? `${TMDB_IMAGE_BASE}/w185${actor.profile_path}` : null,
        characterName: actor.character,
        priority: idx,
      },
    });
  }
}

export async function seedMovieCrew(
  prisma: PrismaClient,
  movieId: number,
  credits: TmdbCredits | null,
): Promise<void> {
  if (!credits?.crew) return;

  const filteredCrew = credits.crew.filter((c: TmdbCrewMember) =>
    MOVIE_IMPORTANT_JOBS.includes(c.job),
  );

  for (const crew of filteredCrew) {
    await prisma.crew.create({
      data: {
        movieId,
        crewId: crew.id,
        internalId: generateInternalId(crew.id),
        name: crew.name,
        originalName: crew.original_name,
        gender: genderLabel(crew.gender),
        image: crew.profile_path ? `${TMDB_IMAGE_BASE}/w185${crew.profile_path}` : null,
        job: crew.job,
      },
    });
  }
}

export async function seedTvActors(
  prisma: PrismaClient,
  tvShowId: number,
  credits: TmdbCredits | null,
): Promise<void> {
  if (!credits?.cast) return;

  for (let idx = 0; idx < Math.min(credits.cast.length, 20); idx++) {
    const actor: TmdbCastMember = credits.cast[idx];
    await prisma.tvActor.create({
      data: {
        tvShowId,
        actorId: actor.id,
        internalId: generateInternalId(actor.id, "actor"),
        name: actor.name,
        originalName: actor.original_name,
        gender: genderLabel(actor.gender),
        image: actor.profile_path ? `${TMDB_IMAGE_BASE}/w185${actor.profile_path}` : null,
        characterName: actor.roles?.[0]?.character || null,
        priority: idx,
      },
    });
  }
}

export async function seedTvCrew(
  prisma: PrismaClient,
  tvShowId: number,
  credits: TmdbCredits | null,
): Promise<void> {
  if (!credits?.crew) return;

  const filteredCrew = credits.crew.filter((c: TmdbCrewMember) =>
    c.jobs?.some((j) => TV_IMPORTANT_JOBS.includes(j.job)),
  );

  for (const crew of filteredCrew) {
    const job = crew.jobs?.find((j) => TV_IMPORTANT_JOBS.includes(j.job))?.job || "Crew";
    await prisma.tvCrew.create({
      data: {
        tvShowId,
        crewId: crew.id,
        internalId: generateInternalId(crew.id, "crew"),
        name: crew.name,
        originalName: crew.original_name,
        gender: genderLabel(crew.gender),
        image: crew.profile_path ? `${TMDB_IMAGE_BASE}/w185${crew.profile_path}` : null,
        job,
      },
    });
  }
}

export async function seedMovieProviders(
  prisma: PrismaClient,
  movieId: number,
  providerData: TmdbProviderResults | null,
): Promise<void> {
  if (!providerData?.results) return;

  for (const [countryCode, countryData] of Object.entries(providerData.results)) {
    const tmdbLink = countryData.link ?? `https://www.themoviedb.org/movie/${movieId}/watch?locale=${countryCode}`;
    const providerTypes = [
      { type: "flatrate", list: countryData.flatrate || [] },
      { type: "rent", list: countryData.rent || [] },
      { type: "buy", list: countryData.buy || [] },
    ];
    for (const { type, list } of providerTypes) {
      for (const provider of list) {
        const providerId = provider.provider_id;
        const exists = await prisma.provider.findUnique({ where: { id: providerId } });
        if (!exists) continue;
        try {
          await prisma.movieProvider.create({
            data: { movieId, providerId, type, region: countryCode, url: tmdbLink },
          });
        } catch {
          // skip duplicate composite key
        }
      }
    }
  }
}

export async function seedTvProviders(
  prisma: PrismaClient,
  tvShowId: number,
  providerData: TmdbProviderResults | null,
): Promise<void> {
  if (!providerData?.results) return;

  for (const [countryCode, countryData] of Object.entries(providerData.results)) {
    const tmdbLink = countryData.link ?? `https://www.themoviedb.org/tv/${tvShowId}/watch?locale=${countryCode}`;
    const providerTypes = [
      { type: "flatrate", list: countryData.flatrate || [] },
      { type: "rent", list: countryData.rent || [] },
      { type: "buy", list: countryData.buy || [] },
    ];
    for (const { type, list } of providerTypes) {
      for (const provider of list) {
        const providerId = provider.provider_id;
        const exists = await prisma.provider.findUnique({ where: { id: providerId } });
        if (!exists) continue;
        try {
          await prisma.tvShowProvider.create({
            data: { tvShowId, providerId, type, region: countryCode, url: tmdbLink },
          });
        } catch {
          // skip duplicate composite key
        }
      }
    }
  }
}

export async function seedMovieReviews(
  prisma: PrismaClient,
  movieId: number,
  reviews: TmdbReviews | null,
): Promise<void> {
  if (!reviews?.results) return;

  for (const review of reviews.results.slice(0, 10)) {
    await prisma.review.upsert({
      where: { movieId_reviewId: { movieId, reviewId: review.id } },
      update: {
        author: review.author,
        content: review.content,
        rating: review.author_details?.rating ?? null,
        url: review.url,
        updatedAt: review.updated_at ? new Date(review.updated_at) : null,
      },
      create: {
        movieId,
        reviewId: review.id,
        author: review.author,
        content: review.content,
        rating: review.author_details?.rating ?? null,
        url: review.url,
        source: "tmdb",
        createdAt: review.created_at ? new Date(review.created_at) : null,
        updatedAt: review.updated_at ? new Date(review.updated_at) : null,
      },
    });
  }
}

export async function seedTvReviews(
  prisma: PrismaClient,
  tvShowId: number,
  reviews: TmdbReviews | null,
): Promise<void> {
  if (!reviews?.results) return;

  for (const review of reviews.results.slice(0, 10)) {
    await prisma.tvReview.upsert({
      where: { tvShowId_reviewId: { tvShowId, reviewId: review.id } },
      update: {
        author: review.author,
        content: review.content,
        rating: review.author_details?.rating ?? null,
        url: review.url,
        updatedAt: review.updated_at ? new Date(review.updated_at) : null,
      },
      create: {
        tvShowId,
        reviewId: review.id,
        author: review.author,
        content: review.content,
        rating: review.author_details?.rating ?? null,
        url: review.url,
        source: "tmdb",
        createdAt: review.created_at ? new Date(review.created_at) : null,
        updatedAt: review.updated_at ? new Date(review.updated_at) : null,
      },
    });
  }
}

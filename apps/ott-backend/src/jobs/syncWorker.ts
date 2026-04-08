import { prisma } from "@ott/database";
import { getRedis } from "@/cache/redis";
import { invalidatePublicCache } from "@/cache/helpers";

export type SyncType = "all" | "movies" | "tv";

let running = false;

export function initWorkerPool(): void {
  // no persistent pool — jobs are spawned on demand
}

export async function isSyncRunning(): Promise<boolean> {
  if (running) return true;
  const active = await prisma.syncJob.findFirst({ where: { status: "running" } });
  return active !== null;
}

export async function triggerSync(type: SyncType = "all"): Promise<boolean> {
  if (await isSyncRunning()) return false;

  const job = await prisma.syncJob.create({
    data: { status: "running", syncType: type },
  });

  running = true;
  void runSync(job.id, type);
  return true;
}

async function publish(event: string, payload: Record<string, unknown>): Promise<void> {
  try {
    await getRedis().publish(
      "ott:admin:notifications",
      JSON.stringify({ event, ...payload }),
    );
  } catch {
    // non-fatal
  }
}

async function runSync(jobId: string, type: SyncType): Promise<void> {
  await publish("sync:started", { jobId, type });

  let moviesAdded = 0;
  let moviesUpdated = 0;
  const errors: string[] = [];

  try {
    if (type === "movies" || type === "all") {
      const result = await performMovieSync();
      moviesAdded += result.added;
      moviesUpdated += result.updated;
    }
    if (type === "tv" || type === "all") {
      const result = await performTvSync();
      moviesAdded += result.added;
      moviesUpdated += result.updated;
    }
    await syncPersonBios();

    await prisma.syncJob.update({
      where: { id: jobId },
      data: {
        status: "success",
        completedAt: new Date(),
        moviesAdded,
        moviesUpdated,
        errors,
      },
    });

    await invalidatePublicCache();
    await publish("sync:completed", { jobId, type, moviesAdded, moviesUpdated });
    await notifyWebhook("completed", { jobId, type, moviesAdded, moviesUpdated, errors });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(message);

    await prisma.syncJob.update({
      where: { id: jobId },
      data: { status: "failed", completedAt: new Date(), errors },
    });

    await publish("sync:failed", { jobId, type, errors });
    await notifyWebhook("failed", { jobId, type, errors });
  } finally {
    running = false;
  }
}

async function notifyWebhook(
  outcome: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const url = process.env.SYNC_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome, ...payload }),
    });
  } catch {
    // non-fatal
  }
}

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const REGION = "IN";
const DELAY_MS = 500;
const PERSON_DELAY_MS = 200;

async function tmdbFetch<T>(path: string): Promise<T | null> {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY is not set");

  const isBearer = key.startsWith("eyJ");
  const url = isBearer
    ? `${TMDB_BASE}${path}`
    : `${TMDB_BASE}${path}${path.includes("?") ? "&" : "?"}api_key=${key}`;

  const headers: HeadersInit = isBearer
    ? { Authorization: `Bearer ${key}`, Accept: "application/json" }
    : {};

  const res = await fetch(url, { headers });
  if (!res.ok) {
    console.error(`TMDB ${res.status} ${path}`);
    return null;
  }
  return res.json() as Promise<T>;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface TmdbGenre {
  id: number;
  name: string;
}

interface TmdbProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority: number;
}

interface TmdbProviderResults {
  results: { IN?: { flatrate?: TmdbProvider[]; rent?: TmdbProvider[]; buy?: TmdbProvider[] } };
}

// ─── Movie sync ───────────────────────────────────────────────────────────────

interface TmdbMovieListItem {
  id: number;
  title: string;
  original_title: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  genre_ids: number[];
  original_language: string;
}

interface TmdbMoviePage {
  results: TmdbMovieListItem[];
  total_pages: number;
}

async function performMovieSync(): Promise<{ added: number; updated: number }> {
  let added = 0;
  let updated = 0;

  // Fetch genres
  const genreData = await tmdbFetch<{ genres: TmdbGenre[] }>("/genre/movie/list");
  if (genreData) {
    for (const g of genreData.genres) {
      await prisma.genre.upsert({
        where: { id: g.id },
        update: { name: g.name },
        create: { id: g.id, name: g.name },
      });
    }
  }
  await delay(DELAY_MS);

  // Collect movie IDs: 60 Indian-origin + 40 popular in India
  const seenIds = new Set<number>();
  const movieIds: number[] = [];

  for (let page = 1; page <= 3 && movieIds.length < 60; page++) {
    const data = await tmdbFetch<TmdbMoviePage>(
      `/discover/movie?with_origin_country=${REGION}&sort_by=popularity.desc&page=${page}`,
    );
    if (data) {
      for (const m of data.results) {
        if (!seenIds.has(m.id) && movieIds.length < 60) {
          seenIds.add(m.id);
          movieIds.push(m.id);
        }
      }
    }
    await delay(DELAY_MS);
  }

  for (let page = 1; page <= 2 && movieIds.length < 100; page++) {
    const data = await tmdbFetch<TmdbMoviePage>(`/movie/popular?region=${REGION}&page=${page}`);
    if (data) {
      for (const m of data.results) {
        if (!seenIds.has(m.id) && movieIds.length < 100) {
          seenIds.add(m.id);
          movieIds.push(m.id);
        }
      }
    }
    await delay(DELAY_MS);
  }

  for (const tmdbId of movieIds) {
    try {
      // TMDB API responses are untyped — suppress no-explicit-any for this block
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const [detail, credits, videos, images, keywords, altTitles, externalIds, releaseDates, providerData, reviews] = await Promise.all([
        tmdbFetch<any>(`/movie/${tmdbId}`),
        tmdbFetch<any>(`/movie/${tmdbId}/credits`),
        tmdbFetch<any>(`/movie/${tmdbId}/videos`),
        tmdbFetch<any>(`/movie/${tmdbId}/images`),
        tmdbFetch<any>(`/movie/${tmdbId}/keywords`),
        tmdbFetch<any>(`/movie/${tmdbId}/alternative_titles`),
        tmdbFetch<any>(`/movie/${tmdbId}/external_ids`),
        tmdbFetch<any>(`/movie/${tmdbId}/release_dates`),
        tmdbFetch<TmdbProviderResults>(`/movie/${tmdbId}/watch/providers`),
        tmdbFetch<any>(`/movie/${tmdbId}/reviews`),
      ]);
      await delay(DELAY_MS);

      if (!detail) continue;

      const existing = await prisma.movie.findFirst({
        where: { tmdbId: String(tmdbId) },
        select: { id: true, verifiedByTeam: true },
      });

      if (existing?.verifiedByTeam) continue;

      const releaseDate = detail.release_date ? new Date(detail.release_date) : null;
      const releaseYear = detail.release_date
        ? parseInt(detail.release_date.substring(0, 4), 10)
        : null;

      const movieData = {
        tmdbId: String(tmdbId),
        title: detail.title,
        originalTitle: detail.original_title,
        description: detail.overview,
        tagline: detail.tagline,
        imdbId: externalIds?.imdb_id || null,
        status: detail.status,
        runtime: detail.runtime,
        adult: detail.adult,
        voteAverage: detail.vote_average,
        voteCount: detail.vote_count,
        popularity: detail.popularity,
        originalLanguage: detail.original_language,
        releaseDate,
        releaseYear,
        budget: detail.budget ? `$${detail.budget}` : null,
        revenue: detail.revenue ? `$${detail.revenue}` : null,
        keywords: keywords?.keywords?.map((k: any) => k.name).join(",") ?? null,
      };

      let movieId: number;
      if (existing) {
        // Delete related data before update
        await prisma.actor.deleteMany({ where: { movieId: existing.id } });
        await prisma.crew.deleteMany({ where: { movieId: existing.id } });
        await prisma.movieImage.deleteMany({ where: { movieId: existing.id } });
        await prisma.video.deleteMany({ where: { movieId: existing.id } });
        await prisma.rating.deleteMany({ where: { movieId: existing.id } });
        await prisma.alternateTitle.deleteMany({ where: { movieId: existing.id } });
        await prisma.contentRating.deleteMany({ where: { movieId: existing.id } });
        await prisma.spokenLanguage.deleteMany({ where: { movieId: existing.id } });
        await prisma.production.deleteMany({ where: { movieId: existing.id } });
        await prisma.genreOnMovie.deleteMany({ where: { movieId: existing.id } });
        await prisma.movieProvider.deleteMany({ where: { movieId: existing.id } });
        await prisma.reference.deleteMany({ where: { movieId: existing.id } });
        await prisma.review.deleteMany({ where: { movieId: existing.id } });
        await prisma.movie.update({ where: { id: existing.id }, data: movieData });
        movieId = existing.id;
        updated++;
      } else {
        await prisma.movie.create({
          data: { id: tmdbId, internalId: `tmdb-${tmdbId}`, ...movieData },
        });
        movieId = tmdbId;
        added++;
      }

      // Alternate titles
      if (altTitles?.titles?.length) {
        await prisma.alternateTitle.createMany({
          data: altTitles.titles.map((alt: any) => ({
            movieId, country: alt.iso_3166_1, title: alt.title, type: alt.type || null,
          })),
          skipDuplicates: true,
        });
      }

      // Content ratings / release dates
      if (releaseDates?.results?.length) {
        const ratingData: Array<Record<string, unknown>> = [];
        for (const release of releaseDates.results) {
          for (const date of release.release_dates || []) {
            ratingData.push({
              movieId,
              code: date.certification || "",
              country: release.iso_3166_1,
              type: String(date.type),
              releaseDate: date.release_date ? new Date(date.release_date) : null,
              note: date.note || null,
              language: date.iso_639_1 || null,
            });
          }
        }
        if (ratingData.length) {
          await prisma.contentRating.createMany({ data: ratingData as any, skipDuplicates: true });
        }
      }

      // Spoken languages
      if (detail.spoken_languages?.length) {
        await prisma.spokenLanguage.createMany({
          data: detail.spoken_languages.map((lang: any) => ({ movieId, code: lang.iso_639_1 })),
          skipDuplicates: true,
        });
      }

      // Ratings
      await prisma.rating.create({
        data: {
          movieId,
          source: "TMDB",
          value: Math.round((detail.vote_average / 10) * 100),
          contentId: `https://www.themoviedb.org/movie/${tmdbId}`,
          sourceUrl: `https://www.themoviedb.org/movie/${tmdbId}`,
        },
      });
      if (externalIds?.imdb_id) {
        await prisma.rating.create({
          data: {
            movieId,
            source: "IMDB",
            value: Math.round((detail.vote_average / 10) * 100),
            contentId: `https://www.imdb.com/title/${externalIds.imdb_id}/`,
            sourceUrl: `https://www.imdb.com/title/${externalIds.imdb_id}/`,
          },
        });
      }

      // Images (batched)
      {
        const imageData: Array<{ movieId: number; url: string; type: string; ratio: number; height: number; width: number }> = [];
        for (const img of (images?.posters ?? []).slice(0, 8)) {
          imageData.push({ movieId, url: `${TMDB_IMAGE_BASE}/original${img.file_path}`, type: "poster", ratio: img.aspect_ratio, height: img.height, width: img.width });
        }
        for (const img of (images?.backdrops ?? []).slice(0, 10)) {
          imageData.push({ movieId, url: `${TMDB_IMAGE_BASE}/original${img.file_path}`, type: "backdrop", ratio: img.aspect_ratio, height: img.height, width: img.width });
        }
        for (const img of (images?.logos ?? []).slice(0, 3)) {
          imageData.push({ movieId, url: `${TMDB_IMAGE_BASE}/original${img.file_path}`, type: "logo", ratio: img.aspect_ratio, height: img.height, width: img.width });
        }
        if (imageData.length) {
          await prisma.movieImage.createMany({ data: imageData, skipDuplicates: true });
        }
      }

      // References (external links)
      await prisma.reference.create({
        data: {
          movieId,
          home: detail.homepage || null,
          imdbId: externalIds?.imdb_id || null,
          facebookId: externalIds?.facebook_id || null,
          instagramId: externalIds?.instagram_id || null,
          twitterId: externalIds?.twitter_id || null,
          wikidataId: externalIds?.wikidata_id || null,
          tmdbId: String(tmdbId),
          tiktokId: externalIds?.tiktok_id || null,
          youtubeId: externalIds?.youtube_channel_id || null,
        },
      });

      // Reviews
      if (reviews?.results) {
        for (const review of reviews.results.slice(0, 10)) {
          await prisma.review.upsert({
            where: { movieId_reviewId: { movieId, reviewId: review.id } },
            update: { author: review.author, content: review.content, rating: review.author_details?.rating ?? null, url: review.url, updatedAt: review.updated_at ? new Date(review.updated_at) : null },
            create: { movieId, reviewId: review.id, author: review.author, content: review.content, rating: review.author_details?.rating ?? null, url: review.url, source: "tmdb", createdAt: review.created_at ? new Date(review.created_at) : null, updatedAt: review.updated_at ? new Date(review.updated_at) : null },
          });
        }
      }

      // Videos (batched)
      if (videos?.results?.length) {
        await prisma.video.createMany({
          data: videos.results.slice(0, 5).map((v: any) => ({
            movieId,
            name: v.name,
            description: null,
            duration: null,
            size: v.size || null,
            official: v.official || false,
            source: v.site,
            type: v.type,
            url: `https://www.youtube.com/watch?v=${v.key}`,
            image: `https://img.youtube.com/vi/${v.key}/maxresdefault.jpg`,
          })),
          skipDuplicates: true,
        });
      }

      // Cast (batched)
      if (credits?.cast?.length) {
        const genderLabel = (g: number) => (g === 1 ? "F" : g === 2 ? "M" : "-");
        await prisma.actor.createMany({
          data: credits.cast.slice(0, 20).map((a: any, idx: number) => ({
            movieId,
            actorId: a.id,
            name: a.name,
            originalName: a.original_name,
            gender: genderLabel(a.gender),
            image: a.profile_path ? `${TMDB_IMAGE_BASE}/w185${a.profile_path}` : null,
            characterName: a.character,
            priority: idx,
          })),
          skipDuplicates: true,
        });
      }

      // Crew (batched)
      if (credits?.crew?.length) {
        const importantJobs = ["Director", "Producer", "Writer", "Screenplay", "Music", "Cinematography"];
        const genderLabel = (g: number) => (g === 1 ? "F" : g === 2 ? "M" : "-");
        const filteredCrew = credits.crew.filter((c: any) => importantJobs.includes(c.job));
        if (filteredCrew.length) {
          await prisma.crew.createMany({
            data: filteredCrew.map((m: any) => ({
              movieId,
              crewId: m.id,
              name: m.name,
              originalName: m.original_name,
              gender: genderLabel(m.gender),
              image: m.profile_path ? `${TMDB_IMAGE_BASE}/w185${m.profile_path}` : null,
              job: m.job,
            })),
            skipDuplicates: true,
          });
        }
      }

      // Production companies (batched)
      if (detail.production_companies?.length) {
        await prisma.production.createMany({
          data: detail.production_companies.map((c: any) => ({
            movieId,
            name: c.name,
            logo: c.logo_path ? `${TMDB_IMAGE_BASE}/w185${c.logo_path}` : null,
            country: c.origin_country || null,
          })),
          skipDuplicates: true,
        });
      }

      // Genres (upsert then batch link)
      for (const g of detail.genres) {
        await prisma.genre.upsert({
          where: { id: g.id },
          update: { name: g.name },
          create: { id: g.id, name: g.name },
        });
      }
      if (detail.genres.length) {
        await prisma.genreOnMovie.createMany({
          data: detail.genres.map((g: any) => ({ movieId, genreId: g.id })),
          skipDuplicates: true,
        });
      }

      // Providers
      if (providerData?.results) {
        for (const [countryCode, countryData] of Object.entries(providerData.results as Record<string, any>)) {
          const tmdbLink = countryData.link ?? `https://www.themoviedb.org/movie/${tmdbId}/watch?locale=${countryCode}`;
          const types = [
            { type: "flatrate", list: countryData.flatrate || [] },
            { type: "rent", list: countryData.rent || [] },
            { type: "buy", list: countryData.buy || [] },
          ];
          for (const { type, list } of types) {
            for (const p of list) {
              const exists = await prisma.provider.findUnique({ where: { id: p.provider_id } });
              if (!exists) continue;
              try {
                await prisma.movieProvider.create({
                  data: { movieId, providerId: p.provider_id, type, region: countryCode, url: tmdbLink },
                });
              } catch { /* skip duplicate */ }
            }
          }
        }
      }
    } catch (err) {
      console.error(`Movie sync error for tmdbId ${tmdbId}:`, err);
    }
  }

  return { added, updated };
}

// ─── TV sync ──────────────────────────────────────────────────────────────────

interface TmdbTvListItem {
  id: number;
  name: string;
  original_name: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  genre_ids: number[];
  original_language: string;
}

interface TmdbTvPage {
  results: TmdbTvListItem[];
  total_pages: number;
}

async function performTvSync(): Promise<{ added: number; updated: number }> {
  let added = 0;
  let updated = 0;

  // Fetch TV genres
  const genreData = await tmdbFetch<{ genres: TmdbGenre[] }>("/genre/tv/list");
  if (genreData) {
    for (const g of genreData.genres) {
      await prisma.genre.upsert({
        where: { id: g.id },
        update: { name: g.name },
        create: { id: g.id, name: g.name },
      });
    }
  }
  await delay(DELAY_MS);

  // Collect TV show IDs: 40 Indian-origin + 20 popular in India
  const seenIds = new Set<number>();
  const tvIds: number[] = [];

  for (let page = 1; page <= 2 && tvIds.length < 40; page++) {
    const data = await tmdbFetch<TmdbTvPage>(
      `/discover/tv?with_origin_country=${REGION}&sort_by=popularity.desc&page=${page}`,
    );
    if (data) {
      for (const s of data.results) {
        if (!seenIds.has(s.id) && tvIds.length < 40) {
          seenIds.add(s.id);
          tvIds.push(s.id);
        }
      }
    }
    await delay(DELAY_MS);
  }

  for (let page = 1; page <= 1 && tvIds.length < 60; page++) {
    const data = await tmdbFetch<TmdbTvPage>(`/tv/popular?region=${REGION}&page=${page}`);
    if (data) {
      for (const s of data.results) {
        if (!seenIds.has(s.id) && tvIds.length < 60) {
          seenIds.add(s.id);
          tvIds.push(s.id);
        }
      }
    }
    await delay(DELAY_MS);
  }

  for (const tmdbId of tvIds) {
    try {
      // TMDB API responses are untyped — suppress no-explicit-any for this block
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const [detail, credits, videos, images, keywords, altTitles, externalIds, contentRatings, providerData, reviews] = await Promise.all([
        tmdbFetch<any>(`/tv/${tmdbId}`),
        tmdbFetch<any>(`/tv/${tmdbId}/aggregate_credits`),
        tmdbFetch<any>(`/tv/${tmdbId}/videos`),
        tmdbFetch<any>(`/tv/${tmdbId}/images`),
        tmdbFetch<any>(`/tv/${tmdbId}/keywords`),
        tmdbFetch<any>(`/tv/${tmdbId}/alternative_titles`),
        tmdbFetch<any>(`/tv/${tmdbId}/external_ids`),
        tmdbFetch<any>(`/tv/${tmdbId}/content_ratings`),
        tmdbFetch<TmdbProviderResults>(`/tv/${tmdbId}/watch/providers`),
        tmdbFetch<any>(`/tv/${tmdbId}/reviews`),
      ]);
      await delay(DELAY_MS);

      if (!detail) continue;

      const existing = await prisma.tvShow.findFirst({
        where: { tmdbId: String(tmdbId) },
        select: { id: true, verifiedByTeam: true },
      });

      if (existing?.verifiedByTeam) continue;

      const tvData = {
        tmdbId: String(tmdbId),
        name: detail.name,
        originalName: detail.original_name,
        description: detail.overview,
        tagline: detail.tagline || null,
        status: detail.status || null,
        type: "tv" as const,
        firstAirDate: detail.first_air_date ? new Date(detail.first_air_date) : null,
        lastAirDate: detail.last_air_date ? new Date(detail.last_air_date) : null,
        numberOfSeasons: detail.number_of_seasons,
        numberOfEpisodes: detail.number_of_episodes,
        voteAverage: detail.vote_average,
        voteCount: detail.vote_count,
        popularity: detail.popularity,
        adult: detail.adult || false,
        originalLanguage: detail.original_language,
        imdbId: externalIds?.imdb_id || null,
        keywords: keywords?.results?.map((k: any) => k.name).join(",") ?? null,
      };

      let tvShowId: number;
      if (existing) {
        // Delete related data before update
        await prisma.tvActor.deleteMany({ where: { tvShowId: existing.id } });
        await prisma.tvCrew.deleteMany({ where: { tvShowId: existing.id } });
        await prisma.tvShowImage.deleteMany({ where: { tvShowId: existing.id } });
        await prisma.tvVideo.deleteMany({ where: { tvShowId: existing.id } });
        await prisma.tvRating.deleteMany({ where: { tvShowId: existing.id } });
        await prisma.tvAlternateTitle.deleteMany({ where: { tvShowId: existing.id } });
        await prisma.tvContentRating.deleteMany({ where: { tvShowId: existing.id } });
        await prisma.tvSpokenLanguage.deleteMany({ where: { tvShowId: existing.id } });
        await prisma.tvProduction.deleteMany({ where: { tvShowId: existing.id } });
        await prisma.genreOnTvShow.deleteMany({ where: { tvShowId: existing.id } });
        await prisma.tvShowProvider.deleteMany({ where: { tvShowId: existing.id } });
        await prisma.tvReference.deleteMany({ where: { tvShowId: existing.id } });
        await prisma.tvReview.deleteMany({ where: { tvShowId: existing.id } });
        await prisma.tvShow.update({ where: { id: existing.id }, data: tvData });
        tvShowId = existing.id;
        updated++;
      } else {
        await prisma.tvShow.create({
          data: { id: tmdbId, internalId: `tmdb-tv-${tmdbId}`, ...tvData },
        });
        tvShowId = tmdbId;
        added++;
      }

      // Alternate titles (batched)
      if (altTitles?.results?.length) {
        await prisma.tvAlternateTitle.createMany({
          data: altTitles.results.map((alt: any) => ({
            tvShowId, country: alt.iso_3166_1, title: alt.title, type: alt.type || null,
          })),
          skipDuplicates: true,
        });
      }

      // Content ratings (batched)
      if (contentRatings?.results?.length) {
        await prisma.tvContentRating.createMany({
          data: contentRatings.results.map((r: any) => ({
            tvShowId, code: r.rating || "", country: r.iso_3166_1, type: "TV",
          })),
          skipDuplicates: true,
        });
      }

      // Spoken languages (batched)
      if (detail.spoken_languages?.length) {
        await prisma.tvSpokenLanguage.createMany({
          data: detail.spoken_languages.map((lang: any) => ({ tvShowId, code: lang.iso_639_1 })),
          skipDuplicates: true,
        });
      }

      // Ratings
      await prisma.tvRating.create({
        data: {
          tvShowId,
          source: "TMDB",
          value: Math.round((detail.vote_average / 10) * 100),
          contentId: `https://www.themoviedb.org/tv/${tmdbId}`,
          sourceUrl: `https://www.themoviedb.org/tv/${tmdbId}`,
        },
      });
      if (externalIds?.imdb_id) {
        await prisma.tvRating.create({
          data: {
            tvShowId,
            source: "IMDB",
            value: Math.round((detail.vote_average / 10) * 100),
            contentId: `https://www.imdb.com/title/${externalIds.imdb_id}/`,
            sourceUrl: `https://www.imdb.com/title/${externalIds.imdb_id}/`,
          },
        });
      }

      // Images (batched)
      {
        const imageData: Array<{ tvShowId: number; url: string; type: string; ratio: number; height: number; width: number }> = [];
        for (const img of (images?.posters ?? []).slice(0, 8)) {
          imageData.push({ tvShowId, url: `${TMDB_IMAGE_BASE}/original${img.file_path}`, type: "poster", ratio: img.aspect_ratio, height: img.height, width: img.width });
        }
        for (const img of (images?.backdrops ?? []).slice(0, 10)) {
          imageData.push({ tvShowId, url: `${TMDB_IMAGE_BASE}/original${img.file_path}`, type: "backdrop", ratio: img.aspect_ratio, height: img.height, width: img.width });
        }
        for (const img of (images?.logos ?? []).slice(0, 3)) {
          imageData.push({ tvShowId, url: `${TMDB_IMAGE_BASE}/original${img.file_path}`, type: "logo", ratio: img.aspect_ratio, height: img.height, width: img.width });
        }
        if (imageData.length) {
          await prisma.tvShowImage.createMany({ data: imageData, skipDuplicates: true });
        }
      }

      // References (external links)
      await prisma.tvReference.create({
        data: {
          tvShowId,
          home: detail.homepage || null,
          imdbId: externalIds?.imdb_id || null,
          facebookId: externalIds?.facebook_id || null,
          instagramId: externalIds?.instagram_id || null,
          twitterId: externalIds?.twitter_id || null,
          wikidataId: externalIds?.wikidata_id || null,
          tiktokId: externalIds?.tiktok_id || null,
          youtubeId: externalIds?.youtube_id || null,
          tmdbId: String(tmdbId),
        },
      });

      // Videos (batched)
      if (videos?.results?.length) {
        await prisma.tvVideo.createMany({
          data: videos.results.slice(0, 5).map((v: any) => ({
            tvShowId,
            name: v.name,
            description: null,
            duration: null,
            size: v.size || null,
            official: v.official || false,
            source: v.site,
            type: v.type,
            url: `https://www.youtube.com/watch?v=${v.key}`,
            image: `https://img.youtube.com/vi/${v.key}/maxresdefault.jpg`,
          })),
          skipDuplicates: true,
        });
      }

      // Cast (batched)
      if (credits?.cast?.length) {
        const genderLabel = (g: number) => (g === 1 ? "F" : g === 2 ? "M" : "-");
        await prisma.tvActor.createMany({
          data: credits.cast.slice(0, 20).map((a: any, idx: number) => ({
            tvShowId,
            actorId: a.id,
            name: a.name,
            originalName: a.original_name,
            gender: genderLabel(a.gender),
            image: a.profile_path ? `${TMDB_IMAGE_BASE}/w185${a.profile_path}` : null,
            characterName: a.roles?.[0]?.character || null,
            priority: idx,
          })),
          skipDuplicates: true,
        });
      }

      // Crew (batched)
      if (credits?.crew?.length) {
        const importantJobs = ["Director", "Producer", "Writer", "Screenplay", "Music", "Cinematography", "Executive Producer"];
        const genderLabel = (g: number) => (g === 1 ? "F" : g === 2 ? "M" : "-");
        const filteredCrew = credits.crew
          .filter((c: any) => c.jobs?.some((job: any) => importantJobs.includes(job.job)))
          .map((m: any) => ({
            tvShowId,
            crewId: m.id,
            name: m.name,
            originalName: m.original_name,
            gender: genderLabel(m.gender),
            image: m.profile_path ? `${TMDB_IMAGE_BASE}/w185${m.profile_path}` : null,
            job: m.jobs?.find((j: any) => importantJobs.includes(j.job))?.job || "Crew",
          }));
        if (filteredCrew.length) {
          await prisma.tvCrew.createMany({ data: filteredCrew, skipDuplicates: true });
        }
      }

      // Production companies (batched)
      if (detail.production_companies?.length) {
        await prisma.tvProduction.createMany({
          data: detail.production_companies.map((c: any) => ({
            tvShowId,
            name: c.name,
            logo: c.logo_path ? `${TMDB_IMAGE_BASE}/w185${c.logo_path}` : null,
            country: c.origin_country || null,
          })),
          skipDuplicates: true,
        });
      }

      // Genres (upsert then batch link)
      for (const g of detail.genres) {
        await prisma.genre.upsert({
          where: { id: g.id },
          update: { name: g.name },
          create: { id: g.id, name: g.name },
        });
      }
      if (detail.genres.length) {
        await prisma.genreOnTvShow.createMany({
          data: detail.genres.map((g: any) => ({ tvShowId, genreId: g.id })),
          skipDuplicates: true,
        });
      }

      // Providers
      if (providerData?.results) {
        for (const [countryCode, countryData] of Object.entries(providerData.results as Record<string, any>)) {
          const tmdbLink = countryData.link ?? `https://www.themoviedb.org/tv/${tmdbId}/watch?locale=${countryCode}`;
          const types = [
            { type: "flatrate", list: countryData.flatrate || [] },
            { type: "rent", list: countryData.rent || [] },
            { type: "buy", list: countryData.buy || [] },
          ];
          for (const { type, list } of types) {
            for (const p of list) {
              const exists = await prisma.provider.findUnique({ where: { id: p.provider_id } });
              if (!exists) continue;
              try {
                await prisma.tvShowProvider.create({
                  data: { tvShowId, providerId: p.provider_id, type, region: countryCode, url: tmdbLink },
                });
              } catch { /* skip duplicate */ }
            }
          }
        }
      }

      // Reviews
      if (reviews?.results) {
        for (const review of reviews.results.slice(0, 10)) {
          await prisma.tvReview.upsert({
            where: { tvShowId_reviewId: { tvShowId, reviewId: review.id } },
            update: { author: review.author, content: review.content, rating: review.author_details?.rating ?? null, url: review.url, updatedAt: review.updated_at ? new Date(review.updated_at) : null },
            create: { tvShowId, reviewId: review.id, author: review.author, content: review.content, rating: review.author_details?.rating ?? null, url: review.url, source: "tmdb", createdAt: review.created_at ? new Date(review.created_at) : null, updatedAt: review.updated_at ? new Date(review.updated_at) : null },
          });
        }
      }
    } catch (err) {
      console.error(`TV sync error for tmdbId ${tmdbId}:`, err);
    }
  }

  return { added, updated };
}

// ─── Person bio sync ──────────────────────────────────────────────────────────

interface TmdbPerson {
  id: number;
  name: string;
  biography: string | null;
  also_known_as: string[];
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  imdb_id: string | null;
}

function computeAge(birthday: string | null, deathday: string | null): number | null {
  if (!birthday) return null;
  const birth = new Date(birthday);
  const ref = deathday ? new Date(deathday) : new Date();
  const age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) return age - 1;
  return age;
}

async function syncPersonBios(): Promise<void> {
  const [actors, crew, tvActors, tvCrew] = await Promise.all([
    prisma.actor.findMany({ where: { actorId: { gt: 0 }, bio: null }, select: { id: true, actorId: true }, take: 100 }),
    prisma.crew.findMany({ where: { crewId: { gt: 0 }, bio: null }, select: { id: true, crewId: true }, take: 100 }),
    prisma.tvActor.findMany({ where: { actorId: { gt: 0 }, bio: null }, select: { id: true, actorId: true }, take: 100 }),
    prisma.tvCrew.findMany({ where: { crewId: { gt: 0 }, bio: null }, select: { id: true, crewId: true }, take: 100 }),
  ]);

  const personIds = new Set<number>();
  for (const a of actors) personIds.add(a.actorId);
  for (const c of crew) personIds.add(c.crewId);
  for (const a of tvActors) personIds.add(a.actorId);
  for (const c of tvCrew) personIds.add(c.crewId);

  const personCache = new Map<number, TmdbPerson | null>();
  for (const pid of personIds) {
    const person = await tmdbFetch<TmdbPerson>(`/person/${pid}`);
    personCache.set(pid, person);
    await delay(PERSON_DELAY_MS);
  }

  function personUpdate(p: TmdbPerson | null | undefined) {
    if (!p) return null;
    return {
      bio: p.biography || null,
      nickname: p.also_known_as[0] ?? null,
      age: computeAge(p.birthday, p.deathday),
      image: p.profile_path ? `https://image.tmdb.org/t/p/w185${p.profile_path}` : undefined,
    };
  }

  for (const a of actors) {
    const u = personUpdate(personCache.get(a.actorId));
    if (u) await prisma.actor.update({ where: { id: a.id }, data: u });
  }
  for (const c of crew) {
    const u = personUpdate(personCache.get(c.crewId));
    if (u) await prisma.crew.update({ where: { id: c.id }, data: u });
  }
  for (const a of tvActors) {
    const u = personUpdate(personCache.get(a.actorId));
    if (u) await prisma.tvActor.update({ where: { id: a.id }, data: u });
  }
  for (const c of tvCrew) {
    const u = personUpdate(personCache.get(c.crewId));
    if (u) await prisma.tvCrew.update({ where: { id: c.id }, data: u });
  }
}

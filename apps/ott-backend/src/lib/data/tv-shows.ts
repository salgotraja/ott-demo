import { prisma } from "@ott/database";
import { Prisma } from "@ott/database";

export interface TvShowFilters {
  language?: string;
  country?: string;
  genres?: number[];
  providers?: number[];
  minRating?: number;
  maxRating?: number;
  minYear?: number;
  maxYear?: number;
  search?: string;
  onlyWithProviders?: boolean;
}

export async function findTvShows(filters: TvShowFilters) {
  const where: Prisma.TvShowWhereInput = {};

  if (filters.language) where.originalLanguage = filters.language;

  if (filters.country) {
    where.contentRatings = { some: { country: filters.country } };
  }

  if (filters.genres?.length) {
    where.genres = { some: { genreId: { in: filters.genres } } };
  }

  if (filters.providers?.length) {
    where.providers = { some: { providerId: { in: filters.providers }, region: "IN" } };
  } else if (filters.onlyWithProviders) {
    where.providers = { some: { region: "IN" } };
  }

  if (filters.minRating !== undefined || filters.maxRating !== undefined) {
    where.voteAverage = {};
    if (filters.minRating !== undefined) where.voteAverage.gte = filters.minRating;
    if (filters.maxRating !== undefined) where.voteAverage.lte = filters.maxRating;
  }

  if (filters.minYear !== undefined || filters.maxYear !== undefined) {
    where.firstAirDate = {};
    if (filters.minYear !== undefined) where.firstAirDate.gte = new Date(`${filters.minYear}-01-01`);
    if (filters.maxYear !== undefined) where.firstAirDate.lte = new Date(`${filters.maxYear}-12-31`);
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { originalName: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.tvShow.findMany({
    where,
    orderBy: { popularity: "desc" },
    select: {
      id: true,
      name: true,
      firstAirDate: true,
      voteAverage: true,
      images: {
        where: { type: { in: ["poster", "backdrop"] } },
        select: { type: true, url: true },
      },
      genres: { select: { genre: { select: { id: true, name: true } } } },
    },
  });
}

export async function findTvShowById(id: number) {
  return prisma.tvShow.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      originalName: true,
      tagline: true,
      description: true,
      firstAirDate: true,
      lastAirDate: true,
      numberOfSeasons: true,
      numberOfEpisodes: true,
      status: true,
      adult: true,
      keywords: true,
      voteAverage: true,
      voteCount: true,
      popularity: true,
      originalLanguage: true,
      imdbId: true,
      genres: {
        select: {
          genre: { select: { id: true, name: true } },
        },
      },
      images: {
        select: { id: true, type: true, url: true, ratio: true, height: true, width: true },
      },
      providers: {
        where: { region: "IN" },
        select: {
          type: true,
          region: true,
          url: true,
          cost: true,
          quality: true,
          provider: {
            select: { id: true, name: true, logoPath: true, displayPriority: true },
          },
        },
      },
      actors: {
        orderBy: { priority: "asc" },
        select: { id: true, name: true, image: true, characterName: true, priority: true },
      },
      crew: {
        select: { id: true, name: true, job: true },
      },
      videos: {
        select: { id: true, name: true, url: true, image: true, type: true },
      },
      ratings: {
        select: { source: true, value: true },
      },
      references: {
        select: { imdbId: true, wikidataId: true, home: true },
      },
      reviews: {
        select: { id: true, author: true, rating: true, content: true, url: true, source: true, createdAt: true },
      },
      contentRatings: {
        select: { country: true, code: true, type: true },
      },
      spokenLanguages: {
        select: { id: true, code: true },
      },
      productions: {
        select: { id: true, name: true, logo: true, country: true },
      },
      alternateTitles: {
        select: { country: true, title: true, type: true },
      },
      seasons: {
        orderBy: { seasonNumber: "asc" },
        select: { id: true, seasonNumber: true, name: true, posterPath: true, airDate: true, episodeCount: true },
      },
    },
  });
}

export async function findTvShowWatchProviders(id: number, country: string) {
  return prisma.tvShow.findUnique({
    where: { id },
    select: {
      alternateTitles: { where: { country }, take: 1 },
      contentRatings: { where: { country }, take: 1 },
      providers: {
        where: { region: country },
        select: {
          type: true, region: true, url: true, cost: true, quality: true,
          provider: { select: { id: true, name: true, logoPath: true, displayPriority: true } },
        },
      },
    },
  });
}

export async function findSeason(tvShowId: number, seasonNumber: number) {
  return prisma.season.findUnique({
    where: { tvShowId_seasonNumber: { tvShowId, seasonNumber } },
    include: {
      episodes: { orderBy: { episodeNumber: "asc" } },
      images: true,
      videos: true,
      providers: {
        where: { region: "IN" },
        select: {
          type: true, region: true, url: true,
          provider: { select: { id: true, name: true, logoPath: true, displayPriority: true } },
        },
      },
      tvShow: { select: { name: true, adult: true, contentRatings: { where: { country: "IN" }, take: 1 } } },
    },
  });
}

export async function findSeasonWatchProviders(tvShowId: number, seasonNumber: number, country: string) {
  return prisma.season.findUnique({
    where: { tvShowId_seasonNumber: { tvShowId, seasonNumber } },
    select: {
      providers: {
        where: { region: country },
        select: {
          type: true, region: true, url: true,
          provider: { select: { id: true, name: true, logoPath: true, displayPriority: true } },
        },
      },
    },
  });
}

export async function findEpisode(tvShowId: number, seasonNumber: number, episodeNumber: number) {
  return prisma.episode.findUnique({
    where: { tvShowId_seasonNumber_episodeNumber: { tvShowId, seasonNumber, episodeNumber } },
  });
}

export async function findEpisodeContext(tvShowId: number, seasonNumber: number, _episodeNumber: number) {
  const [tvShow, season] = await Promise.all([
    prisma.tvShow.findUnique({
      where: { id: tvShowId },
      select: {
        name: true,
        adult: true,
        numberOfSeasons: true,
        contentRatings: { where: { country: "IN" }, take: 1 },
      },
    }),
    prisma.season.findUnique({
      where: { tvShowId_seasonNumber: { tvShowId, seasonNumber } },
      select: {
        name: true,
        posterPath: true,
        episodeCount: true,
        providers: { where: { region: "IN" }, include: { provider: true } },
      },
    }),
  ]);

  return { tvShow, season };
}

export async function findAdjacentEpisodes(tvShowId: number, seasonNumber: number, episodeNumber: number) {
  const [prevEpisode, nextEpisode] = await Promise.all([
    episodeNumber > 1
      ? prisma.episode.findUnique({
          where: { tvShowId_seasonNumber_episodeNumber: { tvShowId, seasonNumber, episodeNumber: episodeNumber - 1 } },
          select: { episodeNumber: true, name: true, stillPath: true },
        })
      : null,
    prisma.episode.findUnique({
      where: { tvShowId_seasonNumber_episodeNumber: { tvShowId, seasonNumber, episodeNumber: episodeNumber + 1 } },
      select: { episodeNumber: true, name: true, stillPath: true },
    }),
  ]);

  return { prevEpisode, nextEpisode };
}

import { prisma } from "@ott/database";
import { Prisma } from "@ott/database";

export interface MovieFilters {
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

export async function findMovies(filters: MovieFilters) {
  const where: Prisma.MovieWhereInput = { type: "movie" };

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
    where.releaseYear = {};
    if (filters.minYear !== undefined) where.releaseYear.gte = filters.minYear;
    if (filters.maxYear !== undefined) where.releaseYear.lte = filters.maxYear;
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { originalTitle: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.movie.findMany({
    where,
    orderBy: { popularity: "desc" },
    select: {
      id: true,
      title: true,
      releaseDate: true,
      voteAverage: true,
      images: {
        where: { type: { in: ["poster", "backdrop"] } },
        select: { type: true, url: true },
      },
      genres: { select: { genre: { select: { id: true, name: true } } } },
    },
  });
}

export async function findMovieById(id: number) {
  return prisma.movie.findUnique({
    where: { id },
    include: {
      genres: { include: { genre: true } },
      providers: { where: { region: "IN" }, include: { provider: true } },
      images: true,
      actors: { orderBy: { priority: "asc" } },
      crew: true,
      videos: true,
      ratings: true,
      references: true,
      productions: true,
      reviews: true,
      contentRatings: true,
      alternateTitles: true,
    },
  });
}

export async function findMovieWatchProviders(id: number, country: string) {
  return prisma.movie.findUnique({
    where: { id },
    select: {
      alternateTitles: { where: { country }, take: 1 },
      contentRatings: { where: { country } },
      providers: {
        where: { region: country },
        select: {
          type: true,
          url: true,
          cost: true,
          quality: true,
          provider: {
            select: { id: true, name: true, logoPath: true, displayPriority: true },
          },
        },
      },
    },
  });
}

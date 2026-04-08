"use server";

import { fetchApi, MovieCard } from "@/lib/api";

interface FilterParams {
  genreIds?: number[];
  providerIds?: number[];
  minRating?: number;
  maxRating?: number;
  minYear?: number;
  maxYear?: number;
  search?: string;
  region?: string;
  country?: string;
  onlyWithProviders?: boolean;
}

export async function filterMovies(params: FilterParams): Promise<MovieCard[]> {
  const {
    genreIds, providerIds, minRating, maxRating,
    minYear, maxYear, search, region, country, onlyWithProviders,
  } = params;

  const q: Record<string, string | undefined> = {};
  if (region && region !== "ALL") q.language = region;
  if (country && country !== "ALL") q.country = country;
  if (genreIds?.length) q.genres = genreIds.join(",");
  if (providerIds?.length) q.providers = providerIds.join(",");
  if (minRating !== undefined) q.minRating = String(minRating);
  if (maxRating !== undefined) q.maxRating = String(maxRating);
  if (minYear !== undefined) q.minYear = String(minYear);
  if (maxYear !== undefined) q.maxYear = String(maxYear);
  if (search) q.search = search;
  if (onlyWithProviders) q.onlyWithProviders = "true";

  return fetchApi<MovieCard[]>("/api/public/movies", q);
}

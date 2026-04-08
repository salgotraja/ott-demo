import { fetchApi, MovieCard, Genre, Provider } from "@/lib/api";
import { HomePage } from "./HomePage";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const [movies, genres, providers] = await Promise.all([
    fetchApi<MovieCard[]>("/api/public/movies"),
    fetchApi<Genre[]>("/api/public/genres"),
    fetchApi<Provider[]>("/api/public/providers"),
  ]);

  const initialFilters = {
    region: typeof params.language === "string" ? params.language : undefined,
    country: typeof params.country === "string" ? params.country : undefined,
    onlyWithProviders: params.onlyWithProviders === "true",
    genreIds: typeof params.genres === "string" ? params.genres.split(",").map(Number).filter(Boolean) : undefined,
    providerIds: typeof params.providers === "string" ? params.providers.split(",").map(Number).filter(Boolean) : undefined,
    minRating: typeof params.minRating === "string" ? Number(params.minRating) : undefined,
    maxRating: typeof params.maxRating === "string" ? Number(params.maxRating) : undefined,
    minYear: typeof params.minYear === "string" ? Number(params.minYear) : undefined,
    maxYear: typeof params.maxYear === "string" ? Number(params.maxYear) : undefined,
    search: typeof params.search === "string" ? params.search : undefined,
  };

  return (
    <HomePage
      initialMovies={movies}
      genres={genres}
      providers={providers}
      initialFilters={initialFilters}
    />
  );
}

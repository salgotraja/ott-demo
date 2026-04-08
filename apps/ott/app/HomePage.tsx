"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MovieCard } from "@/components/MovieCard";
import { MovieCardSkeleton } from "@/components/MovieCardSkeleton";
import { CountryFilter } from "@/components/CountryFilter";
import { FilterSidebar } from "@/components/FilterSidebar";
import Header from "@/components/Header";
import { filterMovies } from "@/lib/actions";

interface Genre {
  id: number;
  name: string;
}

interface Provider {
  id: number;
  name: string;
  logoPath: string | null;
}

interface Movie {
  id: number;
  title: string;
  posterPath: string | null;
  releaseDate: string | null;
  voteAverage: number | null;
  genres: Genre[];
}

interface HomePageProps {
  initialMovies: Movie[];
  genres: Genre[];
  providers: Provider[];
  initialFilters?: {
    region?: string;
    country?: string;
    onlyWithProviders?: boolean;
    genreIds?: number[];
    providerIds?: number[];
    minRating?: number;
    maxRating?: number;
    minYear?: number;
    maxYear?: number;
    search?: string;
  };
}

export function HomePage({ initialMovies, genres, providers, initialFilters }: HomePageProps) {
  const router = useRouter();

  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [selectedLanguage, setSelectedLanguage] = useState(initialFilters?.region || "hi");
  const [selectedCountry, setSelectedCountry] = useState(initialFilters?.country || "IN");
  const [onlyWithProviders, setOnlyWithProviders] = useState(initialFilters?.onlyWithProviders || false);
  const [filterState, setFilterState] = useState<{
    genreIds: number[];
    providerIds: number[];
    minRating: number;
    maxRating: number;
    minYear: number;
    maxYear: number;
    search?: string;
  }>({
    genreIds: initialFilters?.genreIds || [],
    providerIds: initialFilters?.providerIds || [],
    minRating: initialFilters?.minRating || 0,
    maxRating: initialFilters?.maxRating || 10,
    minYear: initialFilters?.minYear || 1900,
    maxYear: initialFilters?.maxYear || new Date().getFullYear(),
    search: initialFilters?.search,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();

    if (selectedLanguage !== "ALL") params.set("language", selectedLanguage);
    if (selectedCountry !== "ALL") params.set("country", selectedCountry);
    if (onlyWithProviders) params.set("onlyWithProviders", "true");
    if (filterState.genreIds.length > 0) params.set("genres", filterState.genreIds.join(","));
    if (filterState.providerIds.length > 0) params.set("providers", filterState.providerIds.join(","));
    if (filterState.minRating !== 0) params.set("minRating", filterState.minRating.toString());
    if (filterState.maxRating !== 10) params.set("maxRating", filterState.maxRating.toString());
    if (filterState.minYear !== 1900) params.set("minYear", filterState.minYear.toString());
    if (filterState.maxYear !== new Date().getFullYear()) params.set("maxYear", filterState.maxYear.toString());
    if (filterState.search) params.set("search", filterState.search);

    const queryString = params.toString();
    router.replace(queryString ? `/?${queryString}` : "/", { scroll: false });

    async function fetchFilteredMovies() {
      setIsLoading(true);
      try {
        const filtered = await filterMovies({
          ...filterState,
          region: selectedLanguage === "ALL" ? undefined : selectedLanguage,
          country: selectedCountry === "ALL" ? undefined : selectedCountry,
          onlyWithProviders,
        });
        setMovies(filtered);
      } catch (error) {
        console.error("Filter error:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFilteredMovies();
  }, [selectedLanguage, selectedCountry, onlyWithProviders, filterState, router]);

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <CountryFilter
          selectedLanguage={selectedLanguage}
          selectedCountry={selectedCountry}
          onlyWithProviders={onlyWithProviders}
          onLanguageChange={setSelectedLanguage}
          onCountryChange={setSelectedCountry}
          onProviderFilterChange={setOnlyWithProviders}
        />
      </div>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 pb-8 sm:px-6 lg:px-8">
        <FilterSidebar
          genres={genres}
          providers={providers}
          onFilterChange={(filters) => setFilterState(filters)}
          mobileOpen={filterOpen}
          onMobileClose={() => setFilterOpen(false)}
        />

        <main className="flex-1 min-w-0">
          <div className="mb-4 flex items-center justify-between gap-2">
            <span className="text-sm text-zinc-400">
              {isLoading ? "Loading..." : `Showing ${movies.length} movies`}
            </span>
            {/* Mobile filter trigger */}
            <button
              onClick={() => setFilterOpen(true)}
              className="md:hidden flex items-center gap-1.5 text-sm text-zinc-300 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filters
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 20 }).map((_, i) => (
                <MovieCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {movies.map((movie) => (
                <MovieCard key={movie.id} {...movie} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

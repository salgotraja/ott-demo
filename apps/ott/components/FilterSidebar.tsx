"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface Genre {
  id: number;
  name: string;
}

interface Provider {
  id: number;
  name: string;
  logoPath: string | null;
}

interface FilterState {
  genreIds: number[];
  providerIds: number[];
  minRating: number;
  maxRating: number;
  minYear: number;
  maxYear: number;
  search?: string;
}

interface FilterSidebarProps {
  genres: Genre[];
  providers: Provider[];
  onFilterChange: (filters: FilterState) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w92";
const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1900;

export function FilterSidebar({ genres, providers, onFilterChange, mobileOpen, onMobileClose }: FilterSidebarProps) {
  const [genreIds, setGenreIds] = useState<number[]>([]);
  const [providerIds, setProviderIds] = useState<number[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [maxRating, setMaxRating] = useState(10);
  const [minYear, setMinYear] = useState(MIN_YEAR);
  const [maxYear, setMaxYear] = useState(CURRENT_YEAR);
  const [search, setSearch] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeCount =
    genreIds.length +
    providerIds.length +
    (minRating > 0 || maxRating < 10 ? 1 : 0) +
    (minYear > MIN_YEAR || maxYear < CURRENT_YEAR ? 1 : 0) +
    (search ? 1 : 0);

  const handleGenreToggle = (genreId: number) => {
    const newGenreIds = genreIds.includes(genreId)
      ? genreIds.filter((id) => id !== genreId)
      : [...genreIds, genreId];
    setGenreIds(newGenreIds);
    applyFilters({ genreIds: newGenreIds });
  };

  const handleProviderToggle = (providerId: number) => {
    const newProviderIds = providerIds.includes(providerId)
      ? providerIds.filter((id) => id !== providerId)
      : [...providerIds, providerId];
    setProviderIds(newProviderIds);
    applyFilters({ providerIds: newProviderIds });
  };

  const debounced = (fn: () => void, ms: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fn, ms);
  };

  const handleRatingChange = (min: number, max: number) => {
    setMinRating(min);
    setMaxRating(max);
    debounced(() => applyFilters({ minRating: min, maxRating: max }), 300);
  };

  const handleYearChange = (min: number, max: number) => {
    setMinYear(min);
    setMaxYear(max);
    debounced(() => applyFilters({ minYear: min, maxYear: max }), 300);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    debounced(() => applyFilters({ search: value || undefined }), 400);
  };

  const clearFilters = () => {
    setGenreIds([]);
    setProviderIds([]);
    setMinRating(0);
    setMaxRating(10);
    setMinYear(MIN_YEAR);
    setMaxYear(CURRENT_YEAR);
    setSearch("");
    onFilterChange({
      genreIds: [],
      providerIds: [],
      minRating: 0,
      maxRating: 10,
      minYear: MIN_YEAR,
      maxYear: CURRENT_YEAR,
      search: undefined,
    });
  };

  const applyFilters = (partial: Partial<FilterState>) => {
    onFilterChange({
      genreIds,
      providerIds,
      minRating,
      maxRating,
      minYear,
      maxYear,
      search: search || undefined,
      ...partial,
    });
  };

  const filterContent = (
    <div className="space-y-2">
      <details open className="group">
        <summary className="cursor-pointer list-none py-3 px-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">Search</h3>
            <span className="text-zinc-500 text-xs group-open:rotate-180 transition-transform">▼</span>
          </div>
        </summary>
        <div className="px-3 pt-3 pb-2">
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </details>

      <details className="group">
        <summary className="cursor-pointer list-none py-3 px-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">
              Genres {genreIds.length > 0 && <span className="text-xs text-blue-400">({genreIds.length})</span>}
            </h3>
            <span className="text-zinc-500 text-xs group-open:rotate-180 transition-transform">▼</span>
          </div>
        </summary>
        <div className="px-3 pt-3 pb-2 space-y-2 max-h-60 overflow-y-auto">
          {genres.map((genre) => (
            <label key={genre.id} className="flex cursor-pointer items-center gap-2 hover:bg-zinc-800/50 p-1 rounded">
              <input
                type="checkbox"
                checked={genreIds.includes(genre.id)}
                onChange={() => handleGenreToggle(genre.id)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm text-zinc-300">{genre.name}</span>
            </label>
          ))}
        </div>
      </details>

      <details className="group">
        <summary className="cursor-pointer list-none py-3 px-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">
              Providers {providerIds.length > 0 && <span className="text-xs text-blue-400">({providerIds.length})</span>}
            </h3>
            <span className="text-zinc-500 text-xs group-open:rotate-180 transition-transform">▼</span>
          </div>
        </summary>
        <div className="px-3 pt-3 pb-2 space-y-2 max-h-60 overflow-y-auto">
          {providers.map((provider) => (
            <label key={provider.id} className="flex cursor-pointer items-center gap-2 hover:bg-zinc-800/50 p-1 rounded">
              <input
                type="checkbox"
                checked={providerIds.includes(provider.id)}
                onChange={() => handleProviderToggle(provider.id)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500"
              />
              {provider.logoPath && (
                <Image
                  src={`${TMDB_IMAGE_BASE_URL}${provider.logoPath}`}
                  alt={provider.name}
                  width={20}
                  height={20}
                  className="rounded"
                />
              )}
              <span className="text-xs text-zinc-300">{provider.name}</span>
            </label>
          ))}
        </div>
      </details>

      <details className="group">
        <summary className="cursor-pointer list-none py-3 px-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">
              Rating{" "}
              {(minRating > 0 || maxRating < 10) && (
                <span className="text-xs text-blue-400">
                  ({minRating.toFixed(1)}-{maxRating.toFixed(1)})
                </span>
              )}
            </h3>
            <span className="text-zinc-500 text-xs group-open:rotate-180 transition-transform">▼</span>
          </div>
        </summary>
        <div className="px-3 pt-3 pb-2 space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Min: {minRating.toFixed(1)}</span>
            <span>Max: {maxRating.toFixed(1)}</span>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-zinc-500">Minimum Rating</label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={minRating}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val <= maxRating) handleRatingChange(val, maxRating);
              }}
              className="w-full accent-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-zinc-500">Maximum Rating</label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={maxRating}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= minRating) handleRatingChange(minRating, val);
              }}
              className="w-full accent-blue-500"
            />
          </div>
        </div>
      </details>

      <details className="group">
        <summary className="cursor-pointer list-none py-3 px-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">
              Release Year{" "}
              {(minYear > MIN_YEAR || maxYear < CURRENT_YEAR) && (
                <span className="text-xs text-blue-400">
                  ({minYear}-{maxYear})
                </span>
              )}
            </h3>
            <span className="text-zinc-500 text-xs group-open:rotate-180 transition-transform">▼</span>
          </div>
        </summary>
        <div className="px-3 pt-3 pb-2 space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>From: {minYear}</span>
            <span>To: {maxYear}</span>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-zinc-500">Start Year</label>
            <input
              type="range"
              min={MIN_YEAR}
              max={CURRENT_YEAR}
              step="1"
              value={minYear}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val <= maxYear) handleYearChange(val, maxYear);
              }}
              className="w-full accent-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-zinc-500">End Year</label>
            <input
              type="range"
              min={MIN_YEAR}
              max={CURRENT_YEAR}
              step="1"
              value={maxYear}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= minYear) handleYearChange(minYear, val);
              }}
              className="w-full accent-blue-500"
            />
          </div>
        </div>
      </details>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — sticky, hidden on mobile */}
      <aside className="hidden md:block shrink-0 w-64 self-start sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto bg-zinc-900 rounded-lg p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Filters</h2>
          <button
            onClick={clearFilters}
            className="text-xs text-zinc-400 hover:text-white transition"
          >
            Clear All
          </button>
        </div>
        {filterContent}
      </aside>

      {/* Mobile sheet — slide in from left, shown via mobileOpen prop */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-zinc-900 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Filters</h2>
                {activeCount > 0 && (
                  <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                    {activeCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={clearFilters}
                  className="text-xs text-zinc-400 hover:text-white transition"
                >
                  Clear All
                </button>
                <button
                  onClick={onMobileClose}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                  aria-label="Close filters"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {filterContent}
            </div>
          </div>
        </>
      )}
    </>
  );
}

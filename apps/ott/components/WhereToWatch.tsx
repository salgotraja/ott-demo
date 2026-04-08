"use client";

import { useState } from "react";
import Image from "next/image";
import { certColor, getCertLabel } from "@/utils/util";

interface ProviderEntry {
  provider_id: number;
  provider: string;
  logo: string;
  display_priority: number;
  url: string;
  cost: string;
  quality: string;
}

interface ReleaseDateEntry {
  type: string;
  type_label: string;
  release_date: string | null;
  certification: string | null;
  note: string | null;
  language: string | null;
}

interface CountryData {
  country: string;
  alternate_title: string | null;
  release_date: string | null;
  certification: string | null;
  certification_type: string | null;
  certification_label: string | null;
  release_note: string | null;
  all_release_dates: ReleaseDateEntry[];
  stream: ProviderEntry[];
  rent: ProviderEntry[];
  buy: ProviderEntry[];
  tmdb_watch_link: string;
}

interface WhereToWatchProps {
  apiPath: string;
  contentTitle: string;
  initialData: CountryData;
}

const SUPPORTED_COUNTRIES = [
  { code: "IN", label: "India", currency: "INR", symbol: "₹" },
  { code: "US", label: "United States", currency: "USD", symbol: "$" },
  { code: "GB", label: "United Kingdom", currency: "GBP", symbol: "£" },
  { code: "AU", label: "Australia", currency: "AUD", symbol: "A$" },
  { code: "CA", label: "Canada", currency: "CAD", symbol: "C$" },
  { code: "JP", label: "Japan", currency: "JPY", symbol: "¥" },
  { code: "DE", label: "Germany", currency: "EUR", symbol: "€" },
  { code: "FR", label: "France", currency: "EUR", symbol: "€" },
  { code: "KR", label: "South Korea", currency: "KRW", symbol: "₩" },
  { code: "BR", label: "Brazil", currency: "BRL", symbol: "R$" },
];


function formatCost(cost: string, symbol: string): string {
  if (!cost) return "";
  // If cost is already a formatted price, prefix symbol if it looks numeric
  const numeric = cost.replace(/[^0-9.]/g, "");
  if (numeric && !isNaN(parseFloat(numeric))) {
    return `${symbol}${numeric}`;
  }
  return cost;
}

function ProviderCard({ provider, tmdbLink, symbol }: { provider: ProviderEntry; tmdbLink: string; symbol: string }) {
  // Use TMDB watch page as the hyperlink (we don't have direct deep links)
  const href = provider.url || tmdbLink;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center gap-1 w-16 group"
      title={`Watch on ${provider.provider}${provider.cost ? ` — ${formatCost(provider.cost, symbol)}` : ""}`}
    >
      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 ring-1 ring-zinc-700 group-hover:ring-blue-500 group-hover:scale-105 transition-all">
        {provider.logo ? (
          <Image src={provider.logo} alt={provider.provider} fill className="object-cover" sizes="48px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500 font-bold">
            {provider.provider.substring(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition text-center leading-tight truncate w-full">
        {provider.provider}
      </span>
      {provider.cost && (
        <span className="text-xs text-emerald-400 font-medium">
          {formatCost(provider.cost, symbol)}
        </span>
      )}
    </a>
  );
}

function ProviderGrid({
  providers,
  label,
  tmdbLink,
  symbol,
}: {
  providers: ProviderEntry[];
  label: string;
  tmdbLink: string;
  symbol: string;
}) {
  if (providers.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex flex-wrap gap-3">
        {providers.map((p) => (
          <ProviderCard key={`${p.provider_id}-${label}`} provider={p} tmdbLink={tmdbLink} symbol={symbol} />
        ))}
      </div>
    </div>
  );
}

export function WhereToWatch({
  apiPath,
  contentTitle,
  initialData,
}: WhereToWatchProps) {
  const [data, setData] = useState<CountryData>(initialData);
  const [loading, setLoading] = useState(false);
  const [showAllDates, setShowAllDates] = useState(false);

  const currentCountry = SUPPORTED_COUNTRIES.find((c) => c.code === data.country) ?? SUPPORTED_COUNTRIES[0];
  const hasProviders = data.stream.length > 0 || data.rent.length > 0 || data.buy.length > 0;

  async function handleCountryChange(countryCode: string) {
    if (countryCode === data.country) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiPath}?country=${countryCode}`);
      const json = await res.json();
      if (json.error === 0 && json.data?.country_data) {
        setData(json.data.country_data);
      }
    } catch {
      // retain existing data on network error
    } finally {
      setLoading(false);
    }
  }

  const formattedDate = data.release_date
    ? new Date(data.release_date).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const certFullLabel = getCertLabel(data.certification, data.country);

  return (
    <div className="bg-zinc-900 rounded-lg p-5 space-y-5">
      {/* Country selector */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Region</h3>
        <select
          value={data.country}
          onChange={(e) => handleCountryChange(e.target.value)}
          disabled={loading}
          className="bg-zinc-800 text-white text-sm rounded-md px-3 py-1.5 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
        >
          {SUPPORTED_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label} ({c.code})
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-zinc-400 text-sm">
          <div className="w-4 h-4 border-2 border-zinc-600 border-t-blue-400 rounded-full animate-spin" />
          Loading {currentCountry.label}...
        </div>
      )}

      {/* Country-specific title */}
      {data.alternate_title && data.alternate_title !== contentTitle && (
        <div>
          <p className="text-xs text-zinc-500 mb-0.5">Title in {data.country}</p>
          <p className="text-sm font-medium text-white">{data.alternate_title}</p>
        </div>
      )}

      {/* Certification + Release date */}
      {(formattedDate || data.certification) && (
        <div className="border-t border-zinc-800 pt-4 space-y-3">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Release Info — {currentCountry.label}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {data.certification && (
              <span
                className={`px-2.5 py-1 rounded text-sm font-bold tracking-wide ${certColor(data.certification, data.country)}`}
                title={certFullLabel ?? undefined}
              >
                {data.certification}
              </span>
            )}
            {certFullLabel && certFullLabel !== data.certification && (
              <span className="text-xs text-zinc-400">{certFullLabel}</span>
            )}
            {formattedDate && (
              <span className="text-sm text-white font-medium">{formattedDate}</span>
            )}
            {data.release_note && (
              <span className="text-xs text-blue-400 italic">{data.release_note}</span>
            )}
          </div>

          {/* All release dates expandable */}
          {data.all_release_dates.length > 1 && (
            <div>
              <button
                onClick={() => setShowAllDates((v) => !v)}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition underline"
              >
                {showAllDates ? "Hide" : "Show"} all {data.all_release_dates.length} release dates
              </button>
              {showAllDates && (
                <div className="mt-2 space-y-1.5">
                  {data.all_release_dates.map((rd, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-zinc-500 w-32 shrink-0">{rd.type_label}</span>
                      {rd.certification && (
                        <span className={`px-1.5 py-0.5 rounded font-bold text-xs ${certColor(rd.certification, data.country)}`}>
                          {rd.certification}
                        </span>
                      )}
                      {rd.release_date && (
                        <span className="text-zinc-300">
                          {new Date(rd.release_date).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                      {rd.note && <span className="text-blue-400 italic">{rd.note}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Where to Watch */}
      <div className="border-t border-zinc-800 pt-4 space-y-4">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Where to Watch
          {currentCountry.symbol !== "$" && (
            <span className="ml-2 font-normal text-zinc-500 normal-case">
              (prices in {currentCountry.currency})
            </span>
          )}
        </p>

        {hasProviders ? (
          <>
            <ProviderGrid
              providers={data.stream}
              label="Stream (Subscription)"
              tmdbLink={data.tmdb_watch_link}
              symbol={currentCountry.symbol}
            />
            <ProviderGrid
              providers={data.rent}
              label="Rent"
              tmdbLink={data.tmdb_watch_link}
              symbol={currentCountry.symbol}
            />
            <ProviderGrid
              providers={data.buy}
              label="Buy"
              tmdbLink={data.tmdb_watch_link}
              symbol={currentCountry.symbol}
            />

            <a
              href={data.tmdb_watch_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition group"
            >
              <span>See all options with pricing</span>
              <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-zinc-500">
              Not available in {currentCountry.label}.
            </p>
            <a
              href={data.tmdb_watch_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition group"
            >
              <span>Check availability on TMDB</span>
              <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

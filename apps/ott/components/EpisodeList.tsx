"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatRuntime } from "@/utils/util";

interface Episode {
  id: number;
  episodeNumber: number;
  name: string;
  overview: string | null;
  airDate: Date | string | null;
  runtime: number | null;
  stillPath: string | null;
  voteAverage: number | null;
}

interface EpisodeListProps {
  episodes: Episode[];
  tvShowId: number;
  seasonNumber: number;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 20;

export function EpisodeList({ episodes, tvShowId, seasonNumber, pageSize = DEFAULT_PAGE_SIZE }: EpisodeListProps) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(episodes.length / pageSize);
  const start = (page - 1) * pageSize;
  const visible = episodes.slice(start, start + pageSize);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">
          Episodes ({episodes.length})
        </h2>
        {totalPages > 1 && (
          <span className="text-sm text-zinc-500">
            Page {page} of {totalPages}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {visible.map((ep) => {
          const stillUrl = ep.stillPath
            ? `https://image.tmdb.org/t/p/w300${ep.stillPath}`
            : null;
          const epCode = `S${String(seasonNumber).padStart(2, "0")}E${String(ep.episodeNumber).padStart(2, "0")}`;
          const airDateStr = ep.airDate
            ? new Date(ep.airDate).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
            : null;

          return (
            <Link
              key={ep.id}
              href={`/tv/${tvShowId}/season/${seasonNumber}/episode/${ep.episodeNumber}`}
              className="flex items-start gap-4 p-4 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition group"
            >
              {/* Still thumbnail */}
              <div className="relative w-32 h-20 rounded overflow-hidden bg-zinc-800 flex-shrink-0">
                {stillUrl ? (
                  <Image src={stillUrl} alt={ep.name} fill className="object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs font-mono">
                    {epCode}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs text-zinc-500 font-mono">{epCode}</span>
                  {ep.voteAverage != null && ep.voteAverage > 0 && (
                    <span className="text-xs text-yellow-400">★ {ep.voteAverage.toFixed(1)}</span>
                  )}
                  {ep.runtime && (
                    <span className="text-xs text-zinc-500">{formatRuntime(ep.runtime)}</span>
                  )}
                  {airDateStr && (
                    <span className="text-xs text-zinc-500">{airDateStr}</span>
                  )}
                </div>
                <p className="text-sm font-medium text-white group-hover:text-blue-300 transition truncate">
                  {ep.name}
                </p>
                {ep.overview && (
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{ep.overview}</p>
                )}
              </div>
              <svg className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
          );
        })}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm rounded-lg bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Previous
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                  p === page
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm rounded-lg bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}

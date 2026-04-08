import Link from "next/link";
import Image from "next/image";
import { GenreTag } from "./GenreTag";
import { StarRating } from "./StarRating";

interface Genre {
  id: number;
  name: string;
}

interface TvShowCardProps {
  id: number;
  name: string;
  posterPath: string | null;
  firstAirDate: string | null;
  voteAverage: number | null;
  genres: Genre[];
}

const FALLBACK_POSTER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='342' height='513'%3E%3Crect fill='%23374151' width='342' height='513'/%3E%3Ctext x='50%25' y='50%25' fill='%239CA3AF' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18'%3ENo Image%3C/text%3E%3C/svg%3E";

export function TvShowCard({ id, name, posterPath, firstAirDate, voteAverage, genres }: TvShowCardProps) {
  const posterUrl = posterPath || FALLBACK_POSTER;
  const year = firstAirDate ? new Date(firstAirDate).getFullYear() : null;

  return (
    <Link href={`/tv/${id}`} className="group block transition-transform hover:scale-105">
      <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-zinc-800">
        <Image
          src={posterUrl}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9PQAJAQI8cL/VAQAAAABJRU5ErkJggg=="
        />
      </div>

      <div className="mt-3 space-y-2">
        <h3 className="text-base font-semibold text-white line-clamp-2" title={name}>
          {name}
        </h3>

        {year && (
          <p className="text-sm text-zinc-400">{year}</p>
        )}

        {voteAverage && (
          <StarRating rating={voteAverage} size="sm" />
        )}

        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {genres.slice(0, 2).map((genre) => (
              <GenreTag key={genre.id} name={genre.name} />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

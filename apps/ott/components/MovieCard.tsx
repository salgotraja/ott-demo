import Image from "next/image";
import Link from "next/link";

interface Genre {
  id: number;
  name: string;
}

interface MovieCardProps {
  id: number;
  title: string;
  posterPath: string | null;
  releaseDate: string | null;
  voteAverage: number | null;
  genres: Genre[];
}

export function MovieCard({ id, title, posterPath, releaseDate, voteAverage, genres }: MovieCardProps) {
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
  const displayGenres = genres.slice(0, 2);

  return (
    <Link href={`/movies/${id}`}>
      <div className="group cursor-pointer">
        <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-zinc-900">
          {posterPath ? (
            <Image
              src={posterPath}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9PQAJAQI8cL/VAQAAAABJRU5ErkJggg=="
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-zinc-600 text-xs text-center px-2">{title}</span>
            </div>
          )}
        </div>
        <div className="mt-3">
          <h3 className="font-semibold text-white line-clamp-2">{title}</h3>
          {year && <p className="mt-1 text-sm text-zinc-400">{year}</p>}
          {voteAverage !== null && (
            <div className="mt-2 flex items-center gap-1.5">
              <svg className="h-4 w-4 fill-yellow-400" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm text-white">{voteAverage.toFixed(1)}</span>
            </div>
          )}
          {displayGenres.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {displayGenres.map((genre) => (
                <span
                  key={genre.id}
                  className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

import { notFound } from "next/navigation";
import Image from "next/image";
import { fetchApi, MovieDetail } from "@/lib/api";
import { GenreTag } from "@/components/GenreTag";
import { PhotoGallery } from "@/components/PhotoGallery";
import { WhereToWatch } from "@/components/WhereToWatch";
import { certColor, getCertLabel, formatRuntime } from "@/utils/util";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MovieDetailPage({ params }: PageProps) {
  const { id } = await params;
  const movieId = parseInt(id, 10);

  if (isNaN(movieId)) {
    notFound();
  }

  const DEFAULT_COUNTRY = "IN";

  let movie: MovieDetail;
  try {
    movie = await fetchApi<MovieDetail>(`/api/public/movies/${movieId}`);
  } catch {
    notFound();
  }

  const posterImage = movie.images.find((img) => img.type === "poster");
  const backdropImage = movie.images.find((img) => img.type === "backdrop");

  const backdropUrl = backdropImage?.url || null;
  const posterUrl = posterImage?.url || null;

  const RELEASE_TYPE_LABELS: Record<string, string> = {
    "1": "Premiere", "2": "Theatrical (limited)", "3": "Theatrical",
    "4": "Digital", "5": "Physical", "6": "TV",
  };

  const inRatings = movie.contentRatings.filter((r) => r.country === DEFAULT_COUNTRY);
  const inTheatrical = inRatings.find((r) => r.type === "3");
  const inPrimary = inTheatrical ?? inRatings[0] ?? null;
  const inAlternateTitle = movie.alternateTitles.find((t) => t.country === DEFAULT_COUNTRY);
  const inProviders = movie.providers.filter((p) => p.region === DEFAULT_COUNTRY);

  const buildProvider = (mp: typeof inProviders[number]) => ({
    provider_id: mp.provider.id,
    provider: mp.provider.name,
    logo: mp.provider.logoPath ? `https://image.tmdb.org/t/p/w92${mp.provider.logoPath}` : "",
    display_priority: mp.provider.displayPriority ?? 999,
    url: mp.url ?? "",
    cost: mp.cost ?? "",
    quality: mp.quality ?? "HD",
  });

  const initialCountryData = {
    country: DEFAULT_COUNTRY,
    alternate_title: inAlternateTitle?.title ?? null,
    release_date: inPrimary?.releaseDate ?? null,
    certification: inPrimary?.code || null,
    certification_type: inPrimary?.type ?? null,
    certification_label: inPrimary?.type ? (RELEASE_TYPE_LABELS[inPrimary.type] ?? null) : null,
    release_note: inPrimary?.note || null,
    all_release_dates: inRatings.map((r) => ({
      type: r.type,
      type_label: RELEASE_TYPE_LABELS[r.type] ?? r.type,
      release_date: r.releaseDate ?? null,
      certification: r.code || null,
      note: r.note || null,
      language: r.language || null,
    })),
    stream: inProviders.filter((p) => p.type === "flatrate").map(buildProvider),
    rent: inProviders.filter((p) => p.type === "rent").map(buildProvider),
    buy: inProviders.filter((p) => p.type === "buy").map(buildProvider),
    tmdb_watch_link: `https://www.themoviedb.org/movie/${movieId}/watch?locale=${DEFAULT_COUNTRY}`,
  };


  const certFullLabel = getCertLabel(initialCountryData.certification, initialCountryData.country);

  const topCast = movie.actors.slice(0, 10);
  const fullCast = movie.actors.slice(10);

  const directors = movie.crew.filter((c) => c.job === "Director");
  const writers = movie.crew.filter((c) => c.job === "Writer" || c.job === "Screenplay");
  const producers = movie.crew.filter((c) => c.job.includes("Producer"));

  const imdbRating = movie.ratings.find((r) => r.source === "IMDB");

  const keywords = movie.keywords?.split(",").filter(Boolean) || [];

  const photoImages = movie.images.filter((img) => ["poster", "backdrop"].includes(img.type));

  return (
    <div className="min-h-screen bg-black">
      <PageBreadcrumb crumbs={[{ label: "← Movies", href: "/" }]} />

      {backdropUrl && (
        <div className="relative h-125 w-full">
          <Image
            src={backdropUrl}
            alt={movie.title}
            fill
            className="object-cover"
            priority
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9PQAJAQI8cL/VAQAAAABJRU5ErkJggg=="
          />
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/70 to-black/30" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="mx-auto max-w-7xl">
              <div className="flex items-start gap-6">
                {posterUrl && (
                  <div className="hidden md:block relative w-32 h-48 rounded-lg overflow-hidden shadow-2xl shrink-0">
                    <Image
                      src={posterUrl}
                      alt={movie.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-5xl font-bold text-white mb-2">{movie.title}</h1>
                  {movie.originalTitle && movie.originalTitle !== movie.title && (
                    <p className="text-xl text-zinc-400 mb-3 italic">{movie.originalTitle}</p>
                  )}
                  {movie.tagline && (
                    <p className="text-lg text-zinc-300 mb-4 italic">&ldquo;{movie.tagline}&rdquo;</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-300 mb-4">
                    {movie.releaseDate && (
                      <span className="px-2 py-1 bg-zinc-800/80 rounded">
                        {new Date(movie.releaseDate).getFullYear()}
                      </span>
                    )}
                    {movie.runtime && (
                      <span className="px-2 py-1 bg-zinc-800/80 rounded">
                        {formatRuntime(movie.runtime)}
                      </span>
                    )}
                    {directors.length > 0 && (
                      <span className="px-2 py-1 bg-zinc-800/80 rounded">
                        Dir: {directors[0].name}
                      </span>
                    )}
                    {movie.voteAverage && (
                      <span className="px-3 py-1 bg-yellow-600/90 rounded font-semibold flex items-center gap-1">
                        ⭐ {movie.voteAverage.toFixed(1)}
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded font-semibold text-xs border uppercase tracking-wide ${
                      movie.adult
                        ? "bg-red-900/80 text-red-300 border-red-700"
                        : "bg-zinc-800/80 text-zinc-400 border-zinc-700"
                    }`}>
                      <span
                          className={`px-2.5 py-1 rounded text-sm font-bold tracking-wide ${certColor(initialCountryData.certification, initialCountryData.country)}`}
                          title={certFullLabel ?? undefined}
                      >
                        {initialCountryData.certification}
                      </span>
                    </span>
                  </div>
                  {movie.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {movie.genres.map((g) => (
                        <GenreTag key={g.id} name={g.name} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="border-b border-zinc-800 bg-zinc-900/30">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Photos Preview */}
            {photoImages.length > 0 && (
              <div>
                <a
                  href="#photos"
                  className="flex items-center gap-2 mb-3 text-sm font-semibold text-zinc-300 hover:text-white transition group"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  <span>Photos</span>
                  <span className="text-zinc-500">({photoImages.length})</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </a>
                <div className="grid grid-cols-4 gap-2">
                  {photoImages.slice(0, 4).map((img, idx) => (
                    <a
                      key={img.id}
                      href="#photos"
                      className="relative aspect-square bg-zinc-800 rounded overflow-hidden hover:ring-2 hover:ring-blue-500 transition"
                    >
                      <Image
                        src={img.url}
                        alt={`Photo ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Videos Preview */}
            {movie.videos.length > 0 && (
              <div>
                <a
                  href="#videos"
                  className="flex items-center gap-2 mb-3 text-sm font-semibold text-zinc-300 hover:text-white transition group"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                  <span>Videos</span>
                  <span className="text-zinc-500">({movie.videos.length})</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </a>
                <div className="grid grid-cols-3 gap-2">
                  {movie.videos.slice(0, 3).map((video) => (
                    <a
                      key={video.id}
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-video bg-zinc-800 rounded overflow-hidden hover:ring-2 hover:ring-red-500 transition group"
                    >
                      {video.image && (
                        <Image
                          src={video.image}
                          alt={video.name}
                          fill
                          className="object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Cast Preview */}
            {topCast.length > 0 && (
              <div>
                <a
                  href="#cast"
                  className="flex items-center gap-2 mb-3 text-sm font-semibold text-zinc-300 hover:text-white transition group"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  <span>Cast</span>
                  <span className="text-zinc-500">({movie.actors.length})</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </a>
                <div className="flex gap-2">
                  {topCast.slice(0, 5).map((actor) => (
                    <a
                      key={actor.id}
                      href="#cast"
                      className="relative w-12 h-12 rounded-full bg-zinc-800 overflow-hidden hover:ring-2 hover:ring-blue-500 transition flex-shrink-0"
                    >
                      {actor.image ? (
                        <Image
                          src={actor.image}
                          alt={actor.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600 text-lg">
                          ?
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <aside className="lg:col-span-1 space-y-6">
            {posterUrl && (
              <div className="relative aspect-2/3 w-full overflow-hidden rounded-lg shadow-xl md:hidden">
                <Image
                  src={posterUrl}
                  alt={movie.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Ratings */}
            <div className="bg-zinc-900 rounded-lg p-5 space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                  Rating
                </h3>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-yellow-400">
                      {movie.voteAverage?.toFixed(1)}
                    </span>
                    <span className="text-sm text-zinc-500">/10</span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    {movie.voteCount?.toLocaleString()} TMDB votes
                  </p>
                  {imdbRating && movie.references?.imdbId && (
                    <a
                      href={`https://www.imdb.com/title/${movie.references.imdbId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 transition"
                    >
                      <span className="bg-yellow-400 text-black font-bold px-1 rounded text-xs">IMDb</span>
                      <span>View →</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                  Quick Facts
                </h3>
                <dl className="space-y-3">
                  {movie.status && (
                    <div>
                      <dt className="text-xs text-zinc-500">Status</dt>
                      <dd className="text-sm text-white font-medium">{movie.status}</dd>
                    </div>
                  )}
                  {movie.runtime && (
                    <div>
                      <dt className="text-xs text-zinc-500">Runtime</dt>
                      <dd className="text-sm text-white font-medium">
                        {formatRuntime(movie.runtime)}
                      </dd>
                    </div>
                  )}
                  {movie.originalLanguage && (
                    <div>
                      <dt className="text-xs text-zinc-500">Original Language</dt>
                      <dd className="text-sm text-white font-medium uppercase">
                        {movie.originalLanguage}
                      </dd>
                    </div>
                  )}
                  {movie.budget && parseInt(movie.budget.replace(/\D/g, "")) > 0 && (
                    <div>
                      <dt className="text-xs text-zinc-500">Budget</dt>
                      <dd className="text-sm text-white font-medium">{movie.budget}</dd>
                    </div>
                  )}
                  {movie.revenue && parseInt(movie.revenue.replace(/\D/g, "")) > 0 && (
                    <div>
                      <dt className="text-xs text-zinc-500">Box Office</dt>
                      <dd className="text-sm text-white font-medium">{movie.revenue}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {movie.references && (
                <div className="border-t border-zinc-800 pt-4">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                    External Links
                  </h3>
                  <div className="space-y-2">
                    {movie.references.imdbId && (
                      <a
                        href={`https://www.imdb.com/title/${movie.references.imdbId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        IMDb →
                      </a>
                    )}
                    {movie.references.wikidataId && (
                      <a
                        href={`https://www.wikidata.org/wiki/${movie.references.wikidataId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        Wikidata →
                      </a>
                    )}
                    {movie.references.home && (
                      <a
                        href={movie.references.home}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        Official Website →
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Country-aware: Release Info + Where to Watch */}
            <WhereToWatch
              apiPath={`/api/movies/${movie.id}`}
              contentTitle={movie.title}
              initialData={initialCountryData}
            />
          </aside>

          <div className="lg:col-span-3 space-y-10">
            {movie.description && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">Storyline</h2>
                <p className="text-zinc-300 leading-relaxed text-base">{movie.description}</p>
              </section>
            )}

            {keywords.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">Keywords</h2>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-zinc-800 text-zinc-300 text-sm rounded-full border border-zinc-700"
                    >
                      {keyword.trim()}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {topCast.length > 0 && (
              <section id="cast">
                <h2 className="text-2xl font-bold text-white mb-4">Top Cast</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {topCast.map((actor) => (
                    <div key={actor.id} className="flex flex-col items-center">
                      <div className="relative w-24 h-24 rounded-full overflow-hidden bg-zinc-800 mb-2">
                        {actor.image ? (
                          <Image
                            src={actor.image}
                            alt={actor.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-3xl">
                            ?
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium text-white text-center">
                        {actor.name}
                      </p>
                      {actor.characterName && (
                        <p className="text-xs text-zinc-500 text-center">
                          as {actor.characterName}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(directors.length > 0 || writers.length > 0 || producers.length > 0) && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">Crew</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {directors.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                        Directors
                      </h3>
                      <ul className="space-y-1">
                        {directors.map((director) => (
                          <li key={director.id} className="text-sm text-white">
                            {director.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {writers.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                        Writers
                      </h3>
                      <ul className="space-y-1">
                        {writers.map((writer) => (
                          <li key={writer.id} className="text-sm text-white">
                            {writer.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {producers.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                        Producers
                      </h3>
                      <ul className="space-y-1">
                        {producers.slice(0, 5).map((producer) => (
                          <li key={producer.id} className="text-sm text-white">
                            {producer.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            {movie.videos.length > 0 && (
              <section id="videos">
                <h2 className="text-2xl font-bold text-white mb-4">Trailers &amp; Videos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {movie.videos.map((video) => (
                    <a
                      key={video.id}
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-video bg-zinc-900 rounded-lg overflow-hidden shadow-lg"
                    >
                      {video.image && (
                        <Image
                          src={video.image}
                          alt={video.name}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center group-hover:scale-110 transition">
                          <svg
                            className="w-8 h-8 text-white ml-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
                        <p className="text-sm font-medium text-white truncate">
                          {video.name}
                        </p>
                        <p className="text-xs text-zinc-400">{video.type}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {fullCast.length > 0 && (
              <section>
                <details className="bg-zinc-900 rounded-lg p-5">
                  <summary className="text-lg font-bold text-white cursor-pointer hover:text-zinc-300 transition">
                    Full Cast ({movie.actors.length})
                  </summary>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {fullCast.map((actor) => (
                      <div key={actor.id} className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                          {actor.image ? (
                            <Image
                              src={actor.image}
                              alt={actor.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-600 text-lg">
                              ?
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {actor.name}
                          </p>
                          {actor.characterName && (
                            <p className="text-xs text-zinc-500 truncate">
                              as {actor.characterName}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              </section>
            )}

            {movie.productions.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">More Details</h2>
                <div className="bg-zinc-900 rounded-lg p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                      Production Companies
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {movie.productions.map((prod) => (
                        <div
                          key={prod.id}
                          className="flex flex-col items-center p-3 bg-zinc-800 rounded-lg"
                        >
                          {prod.logo ? (
                            <div className="relative w-16 h-16 mb-2">
                              <Image
                                src={prod.logo}
                                alt={prod.name}
                                fill
                                className="object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 mb-2 flex items-center justify-center text-zinc-600 text-xs">
                              {prod.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <p className="text-xs text-zinc-300 text-center font-medium">
                            {prod.name}
                          </p>
                          {prod.country && (
                            <p className="text-xs text-zinc-500">{prod.country}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {movie.reviews.length > 0 && (
              <section id="reviews">
                <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                  <h2 className="text-2xl font-bold text-white">
                    Reviews ({movie.reviews.length})
                  </h2>
                  {movie.references?.imdbId && (
                    <a
                      href={`https://www.imdb.com/title/${movie.references.imdbId}/reviews/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs font-semibold text-yellow-400 hover:bg-yellow-500/20 transition"
                    >
                      <span className="font-black tracking-tight">IMDb</span>
                      <span>User Reviews →</span>
                    </a>
                  )}
                </div>
                <div className="space-y-4">
                  {movie.reviews.map((review) => {
                    const sourceLabel = review.source === "tmdb" ? "TMDB" : review.source.toUpperCase();
                    return (
                      <div key={review.id} className="bg-zinc-900 rounded-lg p-5 space-y-3">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">{review.author}</span>
                            {review.rating !== null && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-zinc-800 rounded text-xs text-yellow-400 font-medium">
                                ★ {review.rating.toFixed(1)}
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 bg-blue-900/50 border border-blue-700/40 rounded text-xs text-blue-400 font-medium">
                              {sourceLabel}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {review.createdAt && (
                              <span className="text-xs text-zinc-500">
                                {new Date(review.createdAt).toLocaleDateString("en-IN", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            )}
                            <a
                              href={review.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:text-blue-300 transition"
                            >
                              Read on {sourceLabel} →
                            </a>
                          </div>
                        </div>
                        <p className="text-sm text-zinc-300 leading-relaxed line-clamp-4">
                          {review.content}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {movie.images.length > 0 && (
              <section id="photos">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Photos ({movie.images.length})
                </h2>
                <PhotoGallery images={movie.images} title={movie.title} />
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

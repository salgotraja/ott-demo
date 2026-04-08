import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { fetchApi, EpisodeDetail } from "@/lib/api";
import { certColor, getCertLabel, formatRuntime } from "@/utils/util";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { WhereToWatch } from "@/components/WhereToWatch";

interface PageProps {
  params: Promise<{ id: string; seasonNumber: string; episodeNumber: string }>;
}

export default async function EpisodeDetailPage({ params }: PageProps) {
  const { id, seasonNumber, episodeNumber } = await params;
  const tvShowId = parseInt(id, 10);
  const seasonNum = parseInt(seasonNumber, 10);
  const episodeNum = parseInt(episodeNumber, 10);

  if (isNaN(tvShowId) || isNaN(seasonNum) || isNaN(episodeNum)) {
    notFound();
  }

  let data: EpisodeDetail;
  try {
    data = await fetchApi<EpisodeDetail>(
      `/api/public/tv/${tvShowId}/seasons/${seasonNum}/episodes/${episodeNum}`
    );
  } catch {
    notFound();
  }

  const { episode, tvShow, season, prevEpisode, nextEpisode } = data;

  const tvCert = tvShow.tvCert;
  const tvCertLabel = getCertLabel(tvCert, "IN");

  const stillUrl = episode.stillPath
    ? `https://image.tmdb.org/t/p/w1280${episode.stillPath}`
    : null;

  const seasonPosterUrl = season.posterPath
    ? `https://image.tmdb.org/t/p/w185${season.posterPath}`
    : null;

  const epCode = `S${String(seasonNum).padStart(2, "0")}E${String(episodeNum).padStart(2, "0")}`;
  const seasonName = season.name ?? `Season ${seasonNum}`;

  const buildProvider = (sp: typeof season.providers[number]) => ({
    provider_id: sp.provider.id,
    provider: sp.provider.name,
    logo: sp.provider.logoPath ? `https://image.tmdb.org/t/p/w92${sp.provider.logoPath}` : "",
    display_priority: sp.provider.displayPriority ?? 999,
    url: sp.url ?? "",
    cost: "",
    quality: "HD",
  });

  const initialCountryData = {
    country: "IN",
    alternate_title: null,
    release_date: null,
    certification: null,
    certification_type: null,
    certification_label: null,
    release_note: null,
    all_release_dates: [],
    stream: season.providers.filter((p) => p.type === "flatrate").map(buildProvider),
    rent: season.providers.filter((p) => p.type === "rent").map(buildProvider),
    buy: season.providers.filter((p) => p.type === "buy").map(buildProvider),
    tmdb_watch_link: `https://www.themoviedb.org/tv/${tvShowId}/season/${seasonNum}/watch?locale=IN`,
  };

  return (
    <div className="min-h-screen bg-black">
      <PageBreadcrumb
        sticky
        crumbs={[
          { label: tvShow.name, href: `/tv/${tvShowId}` },
          { label: seasonName, href: `/tv/${tvShowId}/season/${seasonNum}` },
          { label: `${epCode} — ${episode.name}` },
        ]}
      />

      {/* Episode hero */}
      <div className="border-b border-zinc-800">
        {stillUrl ? (
          <div className="relative w-full aspect-video max-h-[480px] overflow-hidden">
            <Image
              src={stillUrl}
              alt={episode.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 sm:px-8 lg:px-12">
              <div className="mx-auto max-w-7xl flex items-end gap-5">
                {seasonPosterUrl && (
                  <div className="hidden sm:block relative w-20 h-28 rounded-lg overflow-hidden shadow-2xl flex-shrink-0 ring-1 ring-zinc-700">
                    <Image src={seasonPosterUrl} alt={seasonName} fill className="object-cover" />
                  </div>
                )}
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-blue-700/90 rounded font-mono text-xs font-bold text-white">
                      {epCode}
                    </span>
                    {tvCert ? (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold tracking-wide ${certColor(tvCert, "IN")}`}
                        title={tvCertLabel ?? undefined}
                      >
                        {tvCert}
                      </span>
                    ) : tvShow.adult ? (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-700 text-white">A</span>
                    ) : null}
                    {episode.runtime && (
                      <span className="px-2 py-0.5 bg-zinc-800/80 rounded text-xs text-zinc-300">
                        {formatRuntime(episode.runtime)}
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white drop-shadow leading-tight">
                    {episode.name}
                  </h1>
                  <p className="text-sm text-zinc-400 mt-1">
                    {tvShow.name} &mdash; {seasonName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/30">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex items-center gap-5">
              {seasonPosterUrl && (
                <div className="relative w-20 h-28 rounded-lg overflow-hidden shadow-xl flex-shrink-0 ring-1 ring-zinc-700">
                  <Image src={seasonPosterUrl} alt={seasonName} fill className="object-cover" />
                </div>
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-blue-700/90 rounded font-mono text-xs font-bold text-white">
                    {epCode}
                  </span>
                  {tvCert ? (
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold tracking-wide ${certColor(tvCert, "IN")}`}
                      title={tvCertLabel ?? undefined}
                    >
                      {tvCert}
                    </span>
                  ) : tvShow.adult ? (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-700 text-white">A</span>
                  ) : null}
                  {episode.runtime && (
                    <span className="px-2 py-0.5 bg-zinc-800/80 rounded text-xs text-zinc-300">
                      {formatRuntime(episode.runtime)}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white">{episode.name}</h1>
                <p className="text-sm text-zinc-400 mt-1">{tvShow.name} &mdash; {seasonName}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Prev / Next episode navigation bar */}
      <div className="border-b border-zinc-800 bg-zinc-900/40">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {prevEpisode ? (
            <Link
              href={`/tv/${tvShowId}/season/${seasonNum}/episode/${prevEpisode.episodeNumber}`}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition group min-w-0"
            >
              <svg className="w-4 h-4 flex-shrink-0 group-hover:-translate-x-0.5 transition" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="min-w-0">
                <span className="block text-xs text-zinc-600">Previous</span>
                <span className="truncate block">
                  E{prevEpisode.episodeNumber} — {prevEpisode.name}
                </span>
              </span>
            </Link>
          ) : (
            <div />
          )}

          <Link
            href={`/tv/${tvShowId}/season/${seasonNum}`}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition whitespace-nowrap flex-shrink-0"
          >
            All Episodes
          </Link>

          {nextEpisode ? (
            <Link
              href={`/tv/${tvShowId}/season/${seasonNum}/episode/${nextEpisode.episodeNumber}`}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition group text-right min-w-0"
            >
              <span className="min-w-0">
                <span className="block text-xs text-zinc-600">Next</span>
                <span className="truncate block">
                  E{nextEpisode.episodeNumber} — {nextEpisode.name}
                </span>
              </span>
              <svg className="w-4 h-4 flex-shrink-0 group-hover:translate-x-0.5 transition" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Sidebar: quick facts */}
          <aside className="lg:col-span-1">
            <div className="bg-zinc-900 rounded-lg p-5 space-y-3">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Episode Info</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-zinc-500">Season / Episode</dt>
                  <dd className="text-sm text-white font-medium">{epCode}</dd>
                </div>
                {episode.airDate && (
                  <div>
                    <dt className="text-xs text-zinc-500">Air Date</dt>
                    <dd className="text-sm text-white font-medium">
                      {new Date(episode.airDate).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </dd>
                  </div>
                )}
                {episode.runtime && (
                  <div>
                    <dt className="text-xs text-zinc-500">Runtime</dt>
                    <dd className="text-sm text-white font-medium">{formatRuntime(episode.runtime)}</dd>
                  </div>
                )}
                {episode.voteAverage != null && episode.voteAverage > 0 && (
                  <div>
                    <dt className="text-xs text-zinc-500">Rating</dt>
                    <dd className="text-sm text-yellow-400 font-bold">
                      ★ {episode.voteAverage.toFixed(1)}
                      {episode.voteCount && episode.voteCount > 0 && (
                        <span className="text-zinc-500 font-normal text-xs ml-1">
                          ({episode.voteCount.toLocaleString()} votes)
                        </span>
                      )}
                    </dd>
                  </div>
                )}
                {tvCert && (
                  <div>
                    <dt className="text-xs text-zinc-500">Certification</dt>
                    <dd className="mt-1">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${certColor(tvCert, "IN")}`}
                        title={tvCertLabel ?? undefined}
                      >
                        {tvCert}
                      </span>
                      {tvCertLabel && tvCertLabel !== tvCert && (
                        <span className="ml-2 text-xs text-zinc-400">{tvCertLabel}</span>
                      )}
                    </dd>
                  </div>
                )}
                {season.episodeCount && (
                  <div>
                    <dt className="text-xs text-zinc-500">Season Episodes</dt>
                    <dd className="text-sm text-white font-medium">
                      {episodeNum} of {season.episodeCount}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Where to Watch */}
            <WhereToWatch
              apiPath={`/api/tv/${tvShowId}/season/${seasonNum}`}
              contentTitle={seasonName}
              initialData={initialCountryData}
            />

            {/* Navigation links */}
            <div className="mt-4 space-y-2">
              <Link
                href={`/tv/${tvShowId}/season/${seasonNum}`}
                className="flex items-center gap-2 px-4 py-3 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition text-sm text-zinc-300 hover:text-white"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                All episodes — {seasonName}
              </Link>
              <Link
                href={`/tv/${tvShowId}`}
                className="flex items-center gap-2 px-4 py-3 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition text-sm text-zinc-300 hover:text-white"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                {tvShow.name}
              </Link>
            </div>
          </aside>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Overview */}
            {episode.overview ? (
              <section>
                <h2 className="text-xl font-bold text-white mb-3">Overview</h2>
                <p className="text-zinc-300 leading-relaxed text-base">{episode.overview}</p>
              </section>
            ) : (
              <section>
                <p className="text-zinc-500 italic text-sm">No overview available for this episode.</p>
              </section>
            )}

            {/* Adjacent episode previews */}
            {(prevEpisode || nextEpisode) && (
              <section>
                <h2 className="text-xl font-bold text-white mb-4">More Episodes</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {prevEpisode && (
                    <Link
                      href={`/tv/${tvShowId}/season/${seasonNum}/episode/${prevEpisode.episodeNumber}`}
                      className="flex items-center gap-3 p-4 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition group"
                    >
                      <div className="relative w-24 h-14 rounded overflow-hidden bg-zinc-800 flex-shrink-0">
                        {prevEpisode.stillPath ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w185${prevEpisode.stillPath}`}
                            alt={prevEpisode.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                            E{prevEpisode.episodeNumber}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-zinc-500 mb-0.5">Previous Episode</p>
                        <p className="text-xs font-mono text-blue-400">
                          S{String(seasonNum).padStart(2, "0")}E{String(prevEpisode.episodeNumber).padStart(2, "0")}
                        </p>
                        <p className="text-sm font-medium text-white group-hover:text-blue-300 transition truncate">
                          {prevEpisode.name}
                        </p>
                      </div>
                    </Link>
                  )}
                  {nextEpisode && (
                    <Link
                      href={`/tv/${tvShowId}/season/${seasonNum}/episode/${nextEpisode.episodeNumber}`}
                      className="flex items-center gap-3 p-4 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition group"
                    >
                      <div className="relative w-24 h-14 rounded overflow-hidden bg-zinc-800 flex-shrink-0">
                        {nextEpisode.stillPath ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w185${nextEpisode.stillPath}`}
                            alt={nextEpisode.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                            E{nextEpisode.episodeNumber}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-zinc-500 mb-0.5">Next Episode</p>
                        <p className="text-xs font-mono text-blue-400">
                          S{String(seasonNum).padStart(2, "0")}E{String(nextEpisode.episodeNumber).padStart(2, "0")}
                        </p>
                        <p className="text-sm font-medium text-white group-hover:text-blue-300 transition truncate">
                          {nextEpisode.name}
                        </p>
                      </div>
                    </Link>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

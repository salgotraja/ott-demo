import { notFound } from "next/navigation";
import Image from "next/image";
import { fetchApi, SeasonDetail } from "@/lib/api";
import { WhereToWatch } from "@/components/WhereToWatch";
import { certColor, getCertLabel } from "@/utils/util";
import { EpisodeList } from "@/components/EpisodeList";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";

interface PageProps {
  params: Promise<{ id: string; seasonNumber: string }>;
}

export default async function SeasonDetailPage({ params }: PageProps) {
  const { id, seasonNumber } = await params;
  const tvShowId = parseInt(id, 10);
  const seasonNum = parseInt(seasonNumber, 10);

  if (isNaN(tvShowId) || isNaN(seasonNum)) {
    notFound();
  }

  const DEFAULT_COUNTRY = "IN";

  let data: SeasonDetail;
  try {
    data = await fetchApi<SeasonDetail>(`/api/public/tv/${tvShowId}/seasons/${seasonNum}`);
  } catch {
    notFound();
  }

  const { tvShow } = data;
  const season = data;

  const tvCert = tvShow.tvCert;
  const tvCertLabel = getCertLabel(tvCert, DEFAULT_COUNTRY);

  const posterUrl = season.posterPath
    ? `https://image.tmdb.org/t/p/w342${season.posterPath}`
    : null;

  const buildProvider = (sp: typeof season.providers[number]) => ({
    provider_id: sp.provider.id,
    provider: sp.provider.name,
    logo: sp.provider.logoPath ? `https://image.tmdb.org/t/p/w92${sp.provider.logoPath}` : "",
    display_priority: sp.provider.displayPriority ?? 999,
    url: sp.url ?? "",
    cost: "",
    quality: "HD",
  });

  const inProviders = season.providers.filter((p) => p.region === DEFAULT_COUNTRY);

  const initialCountryData = {
    country: DEFAULT_COUNTRY,
    alternate_title: null,
    release_date: null,
    certification: null,
    certification_type: null,
    certification_label: null,
    release_note: null,
    all_release_dates: [],
    stream: inProviders.filter((p) => p.type === "flatrate").map(buildProvider),
    rent: inProviders.filter((p) => p.type === "rent").map(buildProvider),
    buy: inProviders.filter((p) => p.type === "buy").map(buildProvider),
    tmdb_watch_link: `https://www.themoviedb.org/tv/${tvShowId}/season/${seasonNum}/watch?locale=${DEFAULT_COUNTRY}`,
  };

  return (
    <div className="min-h-screen bg-black">
      <PageBreadcrumb
        crumbs={[
          { label: tvShow.name, href: `/tv/${tvShowId}` },
          { label: `Season ${seasonNum}` },
        ]}
      />

      {/* Season hero */}
      <div className="border-b border-zinc-800 bg-zinc-900/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-start gap-6">
            {posterUrl && (
              <div className="hidden md:block relative w-28 h-40 rounded-lg overflow-hidden shadow-2xl flex-shrink-0">
                <Image src={posterUrl} alt={season.name} fill className="object-cover" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">{tvShow.name}</span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-3">{season.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm mb-3">
                {season.airDate && (
                  <span className="px-2 py-1 bg-zinc-800/80 rounded text-zinc-300">
                    {new Date(season.airDate).getFullYear()}
                  </span>
                )}
                {season.episodeCount && (
                  <span className="px-2 py-1 bg-zinc-800/80 rounded text-zinc-300">
                    {season.episodeCount} Episode{season.episodeCount !== 1 ? "s" : ""}
                  </span>
                )}
                {season.voteAverage != null && season.voteAverage > 0 && (
                  <span className="px-3 py-1 bg-yellow-600/90 rounded font-semibold text-sm text-white flex items-center gap-1">
                    ⭐ {season.voteAverage.toFixed(1)}
                  </span>
                )}
                {tvCert ? (
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-bold tracking-wide ${certColor(tvCert, DEFAULT_COUNTRY)}`}
                    title={tvCertLabel ?? undefined}
                  >
                    {tvCert}
                  </span>
                ) : tvShow.adult ? (
                  <span className="px-2 py-1 rounded font-semibold text-xs border uppercase tracking-wide bg-red-900/80 text-red-300 border-red-700">
                    A
                  </span>
                ) : null}
              </div>
              {season.overview && (
                <p className="text-zinc-300 text-sm leading-relaxed max-w-2xl">{season.overview}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <aside className="lg:col-span-1 space-y-6">
            {posterUrl && (
              <div className="relative w-full aspect-2/3 overflow-hidden rounded-lg shadow-xl md:hidden">
                <Image src={posterUrl} alt={season.name} fill className="object-cover" />
              </div>
            )}

            {/* Quick facts */}
            <div className="bg-zinc-900 rounded-lg p-5 space-y-3">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Season Info</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-zinc-500">Season</dt>
                  <dd className="text-sm text-white font-medium">{seasonNum}</dd>
                </div>
                {season.episodeCount && (
                  <div>
                    <dt className="text-xs text-zinc-500">Episodes</dt>
                    <dd className="text-sm text-white font-medium">{season.episodeCount}</dd>
                  </div>
                )}
                {season.airDate && (
                  <div>
                    <dt className="text-xs text-zinc-500">First Aired</dt>
                    <dd className="text-sm text-white font-medium">
                      {new Date(season.airDate).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
                    </dd>
                  </div>
                )}
                {season.voteAverage != null && season.voteAverage > 0 && (
                  <div>
                    <dt className="text-xs text-zinc-500">Rating</dt>
                    <dd className="text-sm text-yellow-400 font-bold">{season.voteAverage.toFixed(1)} / 10</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Where to Watch for this season */}
            <WhereToWatch
              apiPath={`/api/tv/${tvShowId}/season/${seasonNum}`}
              contentTitle={season.name}
              initialData={initialCountryData}
            />
          </aside>

          <div className="lg:col-span-3 space-y-10">
            {/* Episode list with pagination */}
            {season.episodes.length > 0 && (
              <EpisodeList
                episodes={season.episodes}
                tvShowId={tvShowId}
                seasonNumber={seasonNum}
              />
            )}

            {/* Season videos */}
            {season.videos.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">Videos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {season.videos.map((video) => (
                    <a
                      key={video.id}
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-video bg-zinc-900 rounded-lg overflow-hidden shadow-lg"
                    >
                      {video.image && (
                        <Image src={video.image} alt={video.name} fill className="object-cover transition-transform group-hover:scale-105" />
                      )}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center group-hover:scale-110 transition">
                          <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
                        <p className="text-xs font-medium text-white truncate">{video.name}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Season images */}
            {season.images.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">Photos ({season.images.length})</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {season.images.map((img) => (
                    <div key={img.id} className="relative aspect-video bg-zinc-800 rounded overflow-hidden">
                      <Image src={img.url} alt={season.name} fill className="object-cover hover:scale-105 transition-transform" />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

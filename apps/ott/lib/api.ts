export interface Genre {
  id: number;
  name: string;
}

export interface Provider {
  id: number;
  name: string;
  logoPath: string | null;
  displayPriority: number | null;
}

export interface MovieCard {
  id: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  voteAverage: number | null;
  genres: Genre[];
}

export interface TvShowCard {
  id: number;
  name: string;
  posterPath: string | null;
  backdropPath: string | null;
  firstAirDate: string | null;
  voteAverage: number | null;
  genres: Genre[];
}

interface MovieProviderEntry {
  id: number;
  type: string;
  region: string;
  url: string | null;
  cost: string | null;
  quality: string | null;
  provider: Provider;
}

interface ContentRating {
  country: string;
  code: string;
  type: string;
  releaseDate: string | null;
  note: string | null;
  language: string | null;
}

interface AlternateTitle {
  country: string;
  title: string;
  type: string | null;
}

interface MovieImage {
  id: number;
  type: string;
  url: string;
  ratio: number | null;
  height: number | null;
  width: number | null;
}

interface Actor {
  id: number;
  name: string;
  image: string | null;
  characterName: string | null;
  priority: number | null;
}

interface CrewMember {
  id: number;
  name: string;
  job: string;
}

interface Video {
  id: number;
  name: string;
  url: string;
  image: string | null;
  type: string | null;
}

interface Rating {
  source: string;
  value: number;
}

interface Reference {
  imdbId: string | null;
  wikidataId: string | null;
  home: string | null;
}

interface Production {
  id: number;
  name: string;
  logo: string | null;
  country: string | null;
}

interface Review {
  id: number;
  author: string;
  rating: number | null;
  content: string;
  url: string;
  source: string;
  createdAt: string | null;
}

export interface MovieDetail {
  id: number;
  title: string;
  originalTitle: string | null;
  tagline: string | null;
  description: string | null;
  runtime: number | null;
  releaseDate: string | null;
  status: string | null;
  adult: boolean;
  keywords: string | null;
  voteAverage: number | null;
  voteCount: number | null;
  originalLanguage: string | null;
  budget: string | null;
  revenue: string | null;
  genres: Genre[];
  images: MovieImage[];
  actors: Actor[];
  crew: CrewMember[];
  videos: Video[];
  ratings: Rating[];
  references: Reference | null;
  productions: Production[];
  reviews: Review[];
  contentRatings: ContentRating[];
  alternateTitles: AlternateTitle[];
  providers: MovieProviderEntry[];
}

interface TvSeason {
  id: number;
  seasonNumber: number;
  name: string;
  posterPath: string | null;
  airDate: string | null;
  episodeCount: number | null;
}

interface TvContentRating {
  country: string;
  code: string;
  type: string;
}

export interface TvShowDetail {
  id: number;
  name: string;
  originalName: string | null;
  tagline: string | null;
  description: string | null;
  firstAirDate: string | null;
  lastAirDate: string | null;
  numberOfSeasons: number | null;
  numberOfEpisodes: number | null;
  status: string | null;
  adult: boolean;
  keywords: string | null;
  voteAverage: number | null;
  voteCount: number | null;
  originalLanguage: string | null;
  genres: Genre[];
  images: MovieImage[];
  actors: Actor[];
  crew: CrewMember[];
  videos: Video[];
  ratings: Rating[];
  references: Reference | null;
  productions: Production[];
  reviews: Review[];
  contentRatings: TvContentRating[];
  alternateTitles: AlternateTitle[];
  providers: MovieProviderEntry[];
  seasons: TvSeason[];
}

interface EpisodeSummary {
  id: number;
  episodeNumber: number;
  name: string;
  overview: string | null;
  airDate: string | null;
  runtime: number | null;
  stillPath: string | null;
  voteAverage: number | null;
  voteCount: number | null;
}

interface SeasonImage {
  id: number;
  url: string;
  type: string;
}

interface SeasonProviderEntry {
  type: string;
  region: string;
  url: string | null;
  provider: Provider;
}

export interface SeasonDetail {
  id: number;
  tvShowId: number;
  seasonNumber: number;
  name: string;
  overview: string | null;
  airDate: string | null;
  episodeCount: number | null;
  voteAverage: number | null;
  posterPath: string | null;
  episodes: EpisodeSummary[];
  images: SeasonImage[];
  videos: Video[];
  providers: SeasonProviderEntry[];
  tvShow: { name: string; adult: boolean; tvCert: string | null };
}

interface EpisodeAdjacentSummary {
  episodeNumber: number;
  name: string;
  stillPath: string | null;
}

export interface EpisodeDetail {
  episode: {
    id: number;
    name: string;
    overview: string | null;
    airDate: string | null;
    runtime: number | null;
    stillPath: string | null;
    voteAverage: number | null;
    voteCount: number | null;
  };
  tvShow: {
    name: string;
    adult: boolean;
    tvCert: string | null;
    numberOfSeasons: number | null;
  };
  season: {
    name: string;
    posterPath: string | null;
    episodeCount: number | null;
    providers: SeasonProviderEntry[];
  };
  prevEpisode: EpisodeAdjacentSummary | null;
  nextEpisode: EpisodeAdjacentSummary | null;
}

// Fetch helper — server-side only, calls INTERNAL_API_URL.
export async function fetchApi<T>(
  path: string,
  searchParams?: Record<string, string | undefined>
): Promise<T> {
  const base = process.env.INTERNAL_API_URL;
  if (!base) throw new Error("INTERNAL_API_URL is not set");

  const url = new URL(path, base);
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      if (v !== undefined) url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`API ${path} responded ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Shared TMDB API response types used by seed scripts and sync worker. */

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbMovieListItem {
  id: number;
  title: string;
  original_title: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  genre_ids: number[];
  original_language: string;
}

export interface TmdbMoviePage {
  results: TmdbMovieListItem[];
  total_pages: number;
}

export interface TmdbMovieDetail {
  id: number;
  title: string;
  original_title: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  original_language: string;
  genres: TmdbGenre[];
  imdb_id: string | null;
  tagline: string | null;
  status: string;
  runtime: number | null;
  budget: number;
  revenue: number;
  homepage: string | null;
  spoken_languages: Array<{ iso_639_1: string }>;
  production_companies: TmdbProductionCompany[];
}

export interface TmdbTvListItem {
  id: number;
  name: string;
  original_name: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  genre_ids: number[];
  original_language: string;
}

export interface TmdbTvPage {
  results: TmdbTvListItem[];
  total_pages: number;
}

export interface TmdbTvDetail {
  id: number;
  name: string;
  original_name: string;
  overview: string | null;
  tagline: string | null;
  status: string;
  first_air_date: string | null;
  last_air_date: string | null;
  number_of_seasons: number | null;
  number_of_episodes: number | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  original_language: string;
  genres: TmdbGenre[];
  homepage: string | null;
  spoken_languages: Array<{ iso_639_1: string }>;
  production_companies: TmdbProductionCompany[];
}

export interface TmdbProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface TmdbCastMember {
  id: number;
  name: string;
  original_name: string;
  gender: number;
  profile_path: string | null;
  character: string;
  roles?: Array<{ character: string }>;
}

export interface TmdbCrewMember {
  id: number;
  name: string;
  original_name: string;
  gender: number;
  profile_path: string | null;
  job: string;
  jobs?: Array<{ job: string }>;
}

export interface TmdbCredits {
  cast: TmdbCastMember[];
  crew: TmdbCrewMember[];
}

export interface TmdbVideo {
  key: string;
  name: string;
  site: string;
  type: string;
  size: number | null;
  official: boolean;
}

export interface TmdbVideos {
  results: TmdbVideo[];
}

export interface TmdbImage {
  file_path: string;
  aspect_ratio: number;
  height: number;
  width: number;
}

export interface TmdbImages {
  posters: TmdbImage[];
  backdrops: TmdbImage[];
  logos: TmdbImage[];
}

export interface TmdbKeyword {
  name: string;
}

export interface TmdbMovieKeywords {
  keywords: TmdbKeyword[];
}

export interface TmdbTvKeywords {
  results: TmdbKeyword[];
}

export interface TmdbAlternateTitle {
  iso_3166_1: string;
  title: string;
  type: string;
}

export interface TmdbAlternateTitles {
  titles?: TmdbAlternateTitle[];
  results?: TmdbAlternateTitle[];
}

export interface TmdbExternalIds {
  imdb_id: string | null;
  facebook_id: string | null;
  instagram_id: string | null;
  twitter_id: string | null;
  wikidata_id: string | null;
  tiktok_id?: string | null;
  youtube_id?: string | null;
  youtube_channel_id?: string | null;
}

export interface TmdbReleaseDate {
  certification: string;
  iso_639_1: string;
  note: string;
  release_date: string;
  type: number;
}

export interface TmdbReleaseDateResult {
  iso_3166_1: string;
  release_dates: TmdbReleaseDate[];
}

export interface TmdbReleaseDates {
  results: TmdbReleaseDateResult[];
}

export interface TmdbContentRatingResult {
  iso_3166_1: string;
  rating: string;
}

export interface TmdbContentRatings {
  results: TmdbContentRatingResult[];
}

export interface TmdbProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority: number;
}

export interface TmdbProviderCountry {
  link?: string;
  flatrate?: TmdbProvider[];
  rent?: TmdbProvider[];
  buy?: TmdbProvider[];
}

export interface TmdbProviderResults {
  results: Record<string, TmdbProviderCountry>;
}

export interface TmdbReview {
  id: string;
  author: string;
  content: string;
  url: string;
  author_details: { rating: number | null };
  created_at: string | null;
  updated_at: string | null;
}

export interface TmdbReviews {
  results: TmdbReview[];
}

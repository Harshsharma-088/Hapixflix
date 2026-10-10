export interface AniListTitle {
  romaji?: string | null;
  english?: string | null;
  native?: string | null;
}

export interface AniListCoverImage {
  extraLarge?: string | null;
  large?: string | null;
  medium?: string | null;
  color?: string | null;
}

export interface AniListAiring {
  episode?: number | null;
  airingAt?: number | null;
  timeUntilAiring?: number | null;
}

export interface AniListTrailer {
  site?: string | null;
  id?: string | null;
}

export interface AniListMedia {
  id: number;
  title?: AniListTitle | null;
  coverImage?: AniListCoverImage | null;
  bannerImage?: string | null;
  description?: string | null;
  status?: string | null;
  format?: string | null;
  episodes?: number | null;
  duration?: number | null;
  seasonYear?: number | null;
  startDate?: { year?: number | null; month?: number | null; day?: number | null };
  averageScore?: number | null;
  meanScore?: number | null;
  popularity?: number | null;
  genres?: string[] | null;
  source?: string | null;
  synonyms?: string[] | null;
  isAdult?: boolean | null;
  nextAiringEpisode?: AniListAiring | null;
  trailer?: AniListTrailer | null;
}

export interface Anime {
  id: number;
  title: string;
  romaji: string;
  english: string;
  native: string;
  coverImage: string;
  coverMedium: string;
  color: string | null;
  bannerImage: string | null;
  description: string | null;
  status: string | null;
  format: string | null;
  episodes: number | null;
  duration: number | null;
  year: number | null;
  averageScore: number | null;
  meanScore: number | null;
  popularity: number | null;
  genres: string[];
  source: string | null;
  isAdult: boolean;
  nextAiringEpisode: AniListAiring | null;
  trailer: AniListTrailer | null;
}

export interface AnimeContinueItem {
  animeId: number;
  title: string;
  posterImage: string;
  backdropImage: string;
  episode: number;
  audio: "sub" | "dub";
  lastWatchedAt: number;
}
export const PLAYBACK_KEY = "hapixflix_playback";

export interface PlaybackData {
  tmdbId: string;
  mediaType: "movie" | "tv";
  season: number;
  episode: number;
}

// URL-addressable play links (prefetchable, shareable, back-button safe).
// sessionStorage remains as a fallback for older flows.
export function buildPlayHref(data: PlaybackData): string {
  const params = new URLSearchParams({
    tmdbId: data.tmdbId,
    type: data.mediaType,
    s: String(data.season || 1),
    e: String(data.episode || 1),
  });
  return `/play?${params.toString()}`;
}

export function parsePlaySearchParams(
  get: (key: string) => string | null
): PlaybackData | null {
  const tmdbId = get("tmdbId");
  const type = get("type");
  if (!tmdbId || (type !== "movie" && type !== "tv")) return null;
  return {
    tmdbId,
    mediaType: type,
    season: Math.max(1, Number(get("s")) || 1),
    episode: Math.max(1, Number(get("e")) || 1),
  };
}

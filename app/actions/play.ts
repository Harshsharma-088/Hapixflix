"use server";
import { tmdb } from "@/lib/tmdb";
import { mapTmdbToAnix } from "@/lib/mapTmdbToAnix";

export async function getPlayPageData(tmdbId: string, type: "tv" | "movie", season: number, episode: number) {
  // Parallel: details + season fetch run together instead of sequentially.
  const [tmdbData, seasonData] = await Promise.all([
    tmdb.getDetails(type, tmdbId),
    type === "tv" ? tmdb.getSeasonDetails(tmdbId, season) : Promise.resolve(null),
  ]);
  if (!tmdbData || tmdbData.success === false) return null;

  let episodes: any[] = [];
  let currentEpisodeData = null as any;

  if (type === "tv") {
    episodes = seasonData?.episodes || [];
    currentEpisodeData = episodes.find((ep: any) => ep.episode_number === episode) || episodes[0];
  }

  const similar = tmdbData.recommendations?.results?.length > 0
    ? tmdbData.recommendations.results
    : (tmdbData.similar?.results || []);
  const mappedSimilar = similar.slice(0, 10).map((m: any) => mapTmdbToAnix(m));
  const mappedMovie = mapTmdbToAnix(tmdbData);

  return { tmdbData, episodes, currentEpisodeData, mappedSimilar, mappedMovie };
}

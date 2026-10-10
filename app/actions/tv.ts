"use server";
import { tmdb } from "@/lib/tmdb";

export async function getTvSeasonsAndEpisodes(movieId: string, seasonNumber: number) {
  try {
    const details = await tmdb.getDetails("tv", movieId);
    const numberOfSeasons = details?.number_of_seasons || 1;
    
    const seasonData = await tmdb.getSeasonDetails(movieId, seasonNumber);
    const episodesCount = seasonData?.episodes?.length || 1;
    
    return { numberOfSeasons, episodesCount };
  } catch (error) {
    console.error("Error fetching TV seasons and episodes:", error);
    return { numberOfSeasons: 1, episodesCount: 1 };
  }
}

export async function getSeasonEpisodes(movieId: string, seasonNumber: number) {
  try {
    const seasonData = await tmdb.getSeasonDetails(movieId, seasonNumber);
    return seasonData?.episodes || [];
  } catch (error) {
    console.error("Error fetching season episodes:", error);
    return [];
  }
}


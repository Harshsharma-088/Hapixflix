"use server";

import { tmdb } from "@/lib/tmdb";
import { mapTmdbToAnix } from "@/lib/mapTmdbToAnix";
import { Movie } from "@/types/types";
import { PROVIDER_IDS } from "@/lib/providers";

async function discoverByProvider(providerId: string, type: "movie" | "tv", page = 1) {
  if (providerId === "k-drama") {
    // K-drama is a genre/language slice, not a watch provider.
    return tmdb.getDiscoverPage(type, {
      genreId: type === "tv" ? "18" : "18",
      originalLanguage: "ko",
      sortBy: "popularity.desc",
      page,
    });
  }
  return tmdb.getDiscoverPage(type, {
    withWatchProviders: providerId,
    sortBy: "popularity.desc",
    page,
  });
}

export async function getMoviesByProvider(providerId: string): Promise<Movie[]> {
  try {
    const data = await tmdb.getDiscover("movie", providerId === "k-drama"
      ? { genreId: "18", originalLanguage: "ko" }
      : { withWatchProviders: providerId });
    return (data || []).slice(0, 20).map(m => mapTmdbToAnix(m));
  } catch (error) {
    console.error("Error fetching provider movies:", error);
    return [];
  }
}

export async function getSeriesByProvider(providerId: string): Promise<Movie[]> {
  try {
    const data = await tmdb.getDiscover("tv", providerId === "k-drama"
      ? { genreId: "18", originalLanguage: "ko" }
      : { withWatchProviders: providerId });
    return (data || []).slice(0, 20).map(m => mapTmdbToAnix(m));
  } catch (error) {
    console.error("Error fetching provider series:", error);
    return [];
  }
}

// Paged catalog feed for /provider/[providerId] pages (hourly-cached upstream).
export async function getProviderFeed(
  slug: string,
  type: "movie" | "tv",
  page = 1
): Promise<{ movies: Movie[]; totalPages: number; name: string }> {
  const entry = PROVIDER_IDS[slug];
  if (!entry) return { movies: [], totalPages: 1, name: slug };
  try {
    const data = await discoverByProvider(entry.tmdbId, type, page);
    return {
      movies: (data.results || []).map((m) => mapTmdbToAnix(m)),
      totalPages: data.totalPages || 1,
      name: entry.name,
    };
  } catch (error) {
    console.error("Error fetching provider feed:", error);
    return { movies: [], totalPages: 1, name: entry.name };
  }
}

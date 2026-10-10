"use server";

import { tmdb } from "@/lib/tmdb";
import { mapTmdbToAnix } from "@/lib/mapTmdbToAnix";
import { Movie } from "@/types/types";

export async function fetchCategoryMovies(type: "movie" | "tv", category: string, page: number = 1): Promise<Movie[]> {
  try {
    let results: any[] = [];
    
    // Map custom categories to TMDB endpoints or genres
    if (category === "Most popular") {
      results = await tmdb.getPopular(type);
    } else if (category === "Most rating") {
      results = await tmdb.getTopRated(type);
    } else if (category === "Most recent") {
      results = await tmdb.getUpcoming(); // for movies
      if (type === "tv") results = await tmdb.getPopular(type); // fallback for tv
    } else {
      // It's a genre. Let's fetch genres first to get the ID.
      const genreResponse = await fetch(`https://api.themoviedb.org/3/genre/${type}/list?api_key=${process.env.TMDB_API_KEY}`);
      if (genreResponse.ok) {
        const genreData = await genreResponse.json();
        // Simple string matching (e.g. "Action & Adventure" -> "Action & Adventure" or "Action")
        const genre = genreData.genres.find((g: any) => 
          g.name.toLowerCase() === category.toLowerCase() || 
          category.toLowerCase().includes(g.name.toLowerCase())
        );
        
        if (genre) {
          const searchResponse = await fetch(`https://api.themoviedb.org/3/discover/${type}?api_key=${process.env.TMDB_API_KEY}&with_genres=${genre.id}&page=${page}`);
          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            results = searchData.results;
          }
        }
      }
    }

    return results.map(m => mapTmdbToAnix(m));
  } catch (error) {
    console.error("Failed to fetch category:", error);
    return [];
  }
}

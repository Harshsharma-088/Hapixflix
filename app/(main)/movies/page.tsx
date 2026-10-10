import CategoryPageClient from "@/components/category/CategoryPageClient";
import { tmdb } from "@/lib/tmdb";
import { mapTmdbToAnix } from "@/lib/mapTmdbToAnix";

export default async function MoviesPage() {
  // Fetch initial "Most popular" movies for SSR
  const popular = await tmdb.getPopular("movie");
  const initialMovies = popular.map(m => mapTmdbToAnix(m));

  return (
    <CategoryPageClient type="movie" initialMovies={initialMovies} />
  );
}
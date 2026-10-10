import CategoryPageClient from "@/components/category/CategoryPageClient";
import { tmdb } from "@/lib/tmdb";
import { mapTmdbToAnix } from "@/lib/mapTmdbToAnix";

export default async function SeriesPage() {
  // Fetch initial "Most popular" tv shows for SSR
  const popular = await tmdb.getPopular("tv");
  const initialShows = popular.map(m => mapTmdbToAnix(m));

  return (
    <CategoryPageClient type="tv" initialMovies={initialShows} />
  );
}
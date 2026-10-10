import { Movie } from "@/types/types";

export const mapTmdbToAnix = (tmdbMovie: any, isFeatured = false, isTrending = false): Movie => {
  let finalBackdropUrl = tmdbMovie.backdrop_path ? `https://image.tmdb.org/t/p/w780${tmdbMovie.backdrop_path}` : null;
  
  // If the deep images object was fetched, use english (en) backdrops first for cards
  if (tmdbMovie.images && tmdbMovie.images.backdrops && tmdbMovie.images.backdrops.length > 0) {
    const backdrops = tmdbMovie.images.backdrops;
    const bestBackdrop = backdrops
      .filter((b: any) => b.iso_639_1 === "en")
      .sort((a: any, b: any) => b.vote_average - a.vote_average)[0]
      ?? backdrops[0];
      
    if (bestBackdrop) {
      finalBackdropUrl = `https://image.tmdb.org/t/p/w780${bestBackdrop.file_path}`;
    }
  }

  let logoUrl: string | null = null;
  if (tmdbMovie.images?.logos) {
    const enLogo = tmdbMovie.images.logos.find((l: any) => l.iso_639_1 === "en") || tmdbMovie.images.logos[0];
    if (enLogo) {
      logoUrl = `https://image.tmdb.org/t/p/w500${enLogo.file_path}`;
    }
  }

  return {
    id: tmdbMovie.id.toString(),
    publicId: tmdbMovie.id.toString(),
    title: tmdbMovie.title || tmdbMovie.name || "Unknown",
    description: tmdbMovie.overview || "No description available.",
    thumbnailUrl: tmdbMovie.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` : null,
    backdropUrl: finalBackdropUrl,
    trailerUrl: null,
    videoUrl: null,
    cloudinaryId: null,
    duration: tmdbMovie.runtime || null,
    rating: tmdbMovie.vote_average ? tmdbMovie.vote_average.toFixed(1) : null,
    releaseYear: tmdbMovie.release_date ? parseInt(tmdbMovie.release_date.split("-")[0]) : (tmdbMovie.first_air_date ? parseInt(tmdbMovie.first_air_date.split("-")[0]) : null),
    maturityRating: null,
    isTrending,
    isFeatured,
    logoUrl,
    mediaType: tmdbMovie.media_type || (tmdbMovie.first_air_date ? "tv" : "movie"),
    createdAt: new Date(),
  };
};
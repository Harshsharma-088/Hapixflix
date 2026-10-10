import HomeClient from "./HomeClient";
import { tmdb } from "@/lib/tmdb";
import { mapTmdbToAnix } from "@/lib/mapTmdbToAnix";

// Next.js config to revalidate homepage data every hour
export const revalidate = 3600;

export default async function Home() {
  // Fetch multiple rows in parallel for speed
  const [
    trendingMovieData,
    trendingTvData,
    topRatedMovieData,
    topRatedTvData,
    actionMovieData,
    actionTvData,
    comedyMovieData,
    comedyTvData,
    animationMovieData,
    animationTvData,
    netflixData,
    netflixSeriesData,
    nowPlayingData,
    upcomingData,
    airingTodayData,
    onTheAirData,
  ] = await Promise.all([
    tmdb.getTrending("movie"),
    tmdb.getTrending("tv"),
    tmdb.getTopRated("movie"),
    tmdb.getTopRated("tv"),
    tmdb.getDiscover("movie", { genreId: "28" }), // Action Movie
    tmdb.getDiscover("tv", { genreId: "10759" }), // Action & Adventure TV
    tmdb.getDiscover("movie", { genreId: "35" }), // Comedy Movie
    tmdb.getDiscover("tv", { genreId: "35" }), // Comedy TV
    tmdb.getDiscover("movie", { genreId: "878" }), // Sci-Fi Movie
    tmdb.getDiscover("tv", { genreId: "10765" }), // Sci-Fi & Fantasy TV
    tmdb.getDiscover("movie", { withWatchProviders: "8" }), // Netflix Movies
    tmdb.getDiscover("tv", { withWatchProviders: "8" }), // Netflix Series
    tmdb.getNowPlaying(), // Recently updated movies (theatrical)
    tmdb.getUpcoming(), // Coming soon movies
    tmdb.getAiringToday(), // Airing today series
    tmdb.getOnTheAir(), // Currently on-air series
  ]);

  // Map to Hapixflix internal format
  const baseTrendingMovies = trendingMovieData.slice(0, 20).map((m) => mapTmdbToAnix(m, true, true));
  
  // For the Hero Banner (top 10 trending movies), fetch their detailed images to guarantee titled English backdrops!
  const top10Details = await Promise.all(
    baseTrendingMovies.slice(0, 10).map(m => tmdb.getDetails("movie", m.publicId))
  );
  
  const trendingMovies = baseTrendingMovies.map((movie, index) => {
    if (index < 10 && top10Details[index]) {
      const d = top10Details[index];
      if (d.images?.backdrops) {
        const backdrops = d.images.backdrops;
        const bestBackdrop = backdrops.find((b: any) => b.iso_639_1 === null) ?? backdrops[0];
        if (bestBackdrop) {
          movie.backdropUrl = `https://image.tmdb.org/t/p/w1280${bestBackdrop.file_path}`;
        }
      }
      if (d.images?.logos) {
        const enLogo = d.images.logos.find((l: any) => l.iso_639_1 === "en") || d.images.logos[0];
        if (enLogo) {
          movie.logoUrl = `https://image.tmdb.org/t/p/w500${enLogo.file_path}`;
        }
      }
    }
    return movie;
  });
  const trendingSeries = trendingTvData.slice(0, 20).map((m) => mapTmdbToAnix(m, true, true));
  
  const topRatedMovies = topRatedMovieData.slice(0, 20).map((m) => mapTmdbToAnix(m));
  const topRatedSeries = topRatedTvData.slice(0, 20).map((m) => mapTmdbToAnix(m));
  
  const actionMovies = actionMovieData.slice(0, 20).map((m) => mapTmdbToAnix(m));
  const actionSeries = actionTvData.slice(0, 20).map((m) => mapTmdbToAnix(m));
  
  const comedyMovies = comedyMovieData.slice(0, 20).map((m) => mapTmdbToAnix(m));
  const comedySeries = comedyTvData.slice(0, 20).map((m) => mapTmdbToAnix(m));
  
  const animationMovies = animationMovieData.slice(0, 20).map((m) => mapTmdbToAnix(m));
  const animationSeries = animationTvData.slice(0, 20).map((m) => mapTmdbToAnix(m));
  
  const netflix = netflixData.slice(0, 20).map((m) => mapTmdbToAnix(m));
  const netflixSeries = netflixSeriesData.slice(0, 20).map((m) => mapTmdbToAnix(m));

  // Freshness rails (same hourly refresh as the rest of the page)
  const latestMovies = nowPlayingData.slice(0, 20).map((m) => mapTmdbToAnix(m));
  const upcomingMovies = upcomingData.slice(0, 20).map((m) => mapTmdbToAnix(m));
  const airingTodaySeries = airingTodayData.slice(0, 20).map((m) => mapTmdbToAnix(m));
  const onTheAirSeries = onTheAirData.slice(0, 20).map((m) => mapTmdbToAnix(m));

  return (
    <HomeClient 
      trendingMovies={trendingMovies}
      trendingSeries={trendingSeries}
      topRatedMovies={topRatedMovies}
      topRatedSeries={topRatedSeries}
      actionMovies={actionMovies}
      actionSeries={actionSeries}
      comedyMovies={comedyMovies}
      comedySeries={comedySeries}
      animationMovies={animationMovies}
      animationSeries={animationSeries}
      netflix={netflix}
      netflixSeries={netflixSeries}
      latestMovies={latestMovies}
      upcomingMovies={upcomingMovies}
      airingTodaySeries={airingTodaySeries}
      onTheAirSeries={onTheAirSeries}
    />
  );
}

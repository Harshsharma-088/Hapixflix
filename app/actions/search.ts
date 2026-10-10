"use server";
import { tmdb } from "@/lib/tmdb";
import { mapTmdbToAnix } from "@/lib/mapTmdbToAnix";
import { Movie } from "@/types/types";

export async function searchAnilist(query: string, page: number = 1): Promise<{ results: Movie[]; totalPages: number }> {
  const fullQuery = `query($search:String, $page:Int){Page(page:$page,perPage:20){pageInfo{lastPage} media(search:$search,type:ANIME,sort:POPULARITY_DESC){id title{english romaji native} coverImage{large extraLarge} bannerImage status format episodes seasonYear startDate{year} nextAiringEpisode{episode airingAt timeUntilAiring}}}}`;
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ query: fullQuery, variables: { search: query, page } }),
    cache: "no-cache",
  }).catch(() => null);

  if (!res || !res.ok) return { results: [], totalPages: 0 };
  const json = await res.json();
  const mediaList = json.data?.Page?.media ?? [];
  const totalPages = json.data?.Page?.pageInfo?.lastPage ?? 1;

  const results = mediaList.map((al: any) => ({
    id: al.id.toString(),
    publicId: al.id.toString(),
    title: al.title?.english || al.title?.romaji || al.title?.native || "Unknown",
    description: "",
    thumbnailUrl: al.coverImage?.extraLarge || al.coverImage?.large || null,
    backdropUrl: al.bannerImage || null,
    trailerUrl: null,
    videoUrl: null,
    cloudinaryId: null,
    duration: null,
    releaseYear: al.startDate?.year || al.seasonYear || null,
    maturityRating: al.status,
    isTrending: false,
    isFeatured: false,
    logoUrl: null,
    createdAt: new Date(),
    rating: null,
    mediaType: "anime",
  }));

  return { results, totalPages };
}

export async function searchContent(query: string, filter: "all" | "movie" | "tv" | "anime" = "all"): Promise<Movie[]> {
  if (!query) return [];

  const results = await tmdb.search(query);

  const mapped = results
    .filter((item: any) => item.media_type === "movie" || item.media_type === "tv")
    .map((item: any) => mapTmdbToAnix(item));

  if (filter === "all") return mapped;

  if (filter === "anime") {
    return mapped.filter(
      (item: Movie) =>
        item.mediaType === "tv" &&
        results.find(
          (r: any) => r.id.toString() === item.id &&
          (r.original_language === "ja" || (r.genre_ids && r.genre_ids.includes(16)))
        )
    );
  }

  return mapped.filter((item: Movie) => item.mediaType === filter);
}

export async function searchContentPage(query: string, page: number = 1, filter: "all" | "movie" | "tv" | "anime" = "all"): Promise<{ results: Movie[]; totalPages: number }> {
  if (!query) return { results: [], totalPages: 0 };

  if (filter === "anime") {
    return await searchAnilist(query, page);
  }

  const data = await tmdb.searchPage(query, page);

  let mapped = (data.results || [])
    .filter((item: any) => item.media_type === "movie" || item.media_type === "tv")
    .map((item: any) => mapTmdbToAnix(item));

  if (filter === "movie") mapped = mapped.filter((m: Movie) => m.mediaType === "movie");
  if (filter === "tv") mapped = mapped.filter((m: Movie) => m.mediaType === "tv");

  if (filter === "all" && page === 1) {
    const anime = await searchAnilist(query, 1);
    mapped = [...mapped, ...anime.results];
  }

  return { results: mapped, totalPages: data.totalPages };
}

export async function getTrendingContent(): Promise<{ trendingMovies: Movie[]; trendingTv: Movie[]; popularMovies: Movie[]; popularTv: Movie[] }> {
  const [trendingMovieData, trendingTvData, popularMovieData, popularTvData] = await Promise.all([
    tmdb.getTrending("movie"),
    tmdb.getTrending("tv"),
    tmdb.getPopular("movie"),
    tmdb.getPopular("tv"),
  ]);

  return {
    trendingMovies: (trendingMovieData || []).slice(0, 12).map((m: any) => mapTmdbToAnix(m, true, true)),
    trendingTv: (trendingTvData || []).slice(0, 12).map((m: any) => mapTmdbToAnix(m, true, true)),
    popularMovies: (popularMovieData || []).slice(0, 12).map((m: any) => mapTmdbToAnix(m)),
    popularTv: (popularTvData || []).slice(0, 12).map((m: any) => mapTmdbToAnix(m)),
  };
}

export async function getTrendingAnime(): Promise<{ trendingAnime: Movie[], popularAnime: Movie[] }> {
  // Use searchAnilist to fetch anime as Movie objects for the UI
  const trending = await searchAnilist("", 1); // Not perfect but searchAnilist does POPULARITY_DESC
  return {
    trendingAnime: trending.results.slice(0, 12),
    popularAnime: trending.results.slice(12, 24),
  };
}

export async function getSuggestions(query: string): Promise<Movie[]> {
  if (!query || query.trim().length < 2) return [];
  const results = await tmdb.search(query);
  const tmdbMapped = (results || [])
    .filter((item: any) => item.media_type === "movie" || item.media_type === "tv")
    .slice(0, 4)
    .map((item: any) => mapTmdbToAnix(item));

  const animeData = await searchAnilist(query, 1);
  return [...tmdbMapped, ...animeData.results.slice(0, 3)];
}

export async function getProviderContent(providerId: string, type: "movie" | "tv"): Promise<Movie[]> {
  try {
    const data = await tmdb.getDiscover(type, { withWatchProviders: providerId });
    return (data || []).slice(0, 12).map((m: any) => mapTmdbToAnix(m));
  } catch {
    return [];
  }
}

export async function getProviderContentPage(providerId: string, type: "movie" | "tv", page: number = 1): Promise<{ results: Movie[]; totalPages: number }> {
  try {
    const data = await tmdb.getDiscoverPage(type, { withWatchProviders: providerId, page });
    return {
      results: (data.results || []).map((m: any) => mapTmdbToAnix(m)),
      totalPages: data.totalPages,
    };
  } catch {
    return { results: [], totalPages: 0 };
  }
}

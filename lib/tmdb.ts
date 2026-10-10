const API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
const BASE_URL = "https://api.tmdb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export const TMDB_CONFIG = {
    baseUrl: BASE_URL,
    imageBase: IMAGE_BASE_URL,
    posterSizes: {
        small: `${IMAGE_BASE_URL}/w185`,
        medium: `${IMAGE_BASE_URL}/w342`,
        large: `${IMAGE_BASE_URL}/w780`,
    },
    backdropSizes: {
        small: `${IMAGE_BASE_URL}/w300`,
        medium: `${IMAGE_BASE_URL}/w780`,
        large: `${IMAGE_BASE_URL}/w1280`,
    },
};

async function fetchTMDB(endpoint: string, params: Record<string, string> = {}) {
    if (!API_KEY || API_KEY === "your_tmdb_api_key_here") {
        return null;
    }

    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = new URL(`${BASE_URL}${cleanEndpoint}`);
    url.searchParams.append("api_key", API_KEY);
    url.searchParams.append("language", "en-US");
    Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

    const MAX_RETRIES = 2;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

            const res = await fetch(url.toString(), {
                next: { revalidate: 3600 },
                headers: {
                    "Accept": "application/json",
                    "User-Agent": "HapixflixApp/1.0"
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!res.ok) {
                if (res.status === 429) { // Rate limit
                    await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
                    throw new Error(`Rate limited: ${res.status}`);
                }
                // If it's a 401, the API key is definitely wrong
                if (res.status === 401) {
                    return null;
                }
                return null;
            }

            const data = await res.json();
            return data;
        } catch {
            attempt++;

            if (attempt >= MAX_RETRIES) {
                return null;
            }
            await new Promise(resolve => setTimeout(resolve, 1200)); // Wait between retries
        }
    }
    return null;
}

export type Movie = {
    id: number;
    title?: string;
    name?: string;
    overview?: string;
    poster_path?: string;
    backdrop_path?: string;
    release_date?: string;
    first_air_date?: string;
    vote_average?: number;
    media_type: "movie" | "tv" | "person" | "company";
    season?: number;
    episode?: number;
    tagline?: string;
    logos?: any[];
    profile_path?: string;
    known_for_department?: string;
    known_for?: Movie[];
    popularity?: number;
    logo_path?: string;
    origin_country?: string;
};

export const tmdb = {
    getTrending: async (type: "movie" | "tv" | "all" = "all"): Promise<Movie[]> => {
        const data = await fetchTMDB(`/trending/${type}/day`, { region: "IN" });
        return data?.results || [];
    },
    getTopRated: async (type: "movie" | "tv"): Promise<Movie[]> => {
        const data = await fetchTMDB(`/${type}/top_rated`, { region: "IN" });
        return (data?.results || []).map((item: any) => ({ ...item, media_type: type }));
    },
    getPopular: async (type: "movie" | "tv"): Promise<Movie[]> => {
        const data = await fetchTMDB(`/${type}/popular`, { region: "IN" });
        return (data?.results || []).map((item: any) => ({ ...item, media_type: type }));
    },
    getDetails: async (type: "movie" | "tv", id: string) => {
        const data = await fetchTMDB(`/${type}/${id}`, {
            append_to_response: "videos,credits,recommendations,similar,release_dates,content_ratings,images,keywords,external_ids",
            include_image_language: "en,hi,null"
        });
        return data || null;
    },
    search: async (query: string): Promise<Movie[]> => {
        const [multiData, companyData] = await Promise.all([
            fetchTMDB("/search/multi", { query, region: "IN" }),
            fetchTMDB("/search/company", { query })
        ]);

        const multiResults = (multiData?.results || [])
            .filter((item: any) =>
                item.media_type === "movie" ||
                item.media_type === "tv" ||
                item.media_type === "person"
            );

        const companyResults = (companyData?.results || [])
            .map((item: any) => ({
                ...item,
                media_type: "company" as const
            }));

        return [...multiResults, ...companyResults];
    },
    searchPage: async (query: string, page: number = 1): Promise<{ results: Movie[]; totalPages: number }> => {
        const data = await fetchTMDB("/search/multi", { query, page: page.toString(), region: "IN" });
        return {
            results: (data?.results || []).filter((item: any) => item.media_type === "movie" || item.media_type === "tv"),
            totalPages: data?.total_pages || 1,
        };
    },
    getGenreList: async (type: "movie" | "tv") => {
        const data = await fetchTMDB(`/genre/${type}/list`);
        return data?.genres || [];
    },
    getDiscover: async (type: "movie" | "tv", options: { genreId?: string, year?: string, sortBy?: string, originalLanguage?: string, withWatchProviders?: string, page?: number } = {}): Promise<Movie[]> => {
        const params: Record<string, string> = {
            sort_by: options.sortBy || "popularity.desc",
            include_adult: "false",
            region: "IN",
            watch_region: "IN"
        };
        if (options.genreId) params.with_genres = options.genreId;
        if (options.originalLanguage) params.with_original_language = options.originalLanguage;
        if (options.withWatchProviders) {
            params.with_watch_providers = options.withWatchProviders;
            params.watch_region = "IN";
        }
        if (options.year) {
            const key = type === "movie" ? "primary_release_year" : "first_air_date_year";
            params[key] = options.year;
        }
        if (options.page) params.page = options.page.toString();

        const data = await fetchTMDB(`/discover/${type}`, params);
        return (data?.results || []).map((item: any) => ({ ...item, media_type: type }));
    },
    getDiscoverPage: async (type: "movie" | "tv", options: { genreId?: string, year?: string, sortBy?: string, originalLanguage?: string, withWatchProviders?: string, page?: number } = {}): Promise<{ results: Movie[]; totalPages: number }> => {
        const params: Record<string, string> = {
            sort_by: options.sortBy || "popularity.desc",
            include_adult: "false",
            region: "IN",
            watch_region: "IN"
        };
        if (options.genreId) params.with_genres = options.genreId;
        if (options.originalLanguage) params.with_original_language = options.originalLanguage;
        if (options.withWatchProviders) {
            params.with_watch_providers = options.withWatchProviders;
            params.watch_region = "IN";
        }
        if (options.year) {
            const key = type === "movie" ? "primary_release_year" : "first_air_date_year";
            params[key] = options.year;
        }
        if (options.page) params.page = options.page.toString();

        const data = await fetchTMDB(`/discover/${type}`, params);
        return {
            results: (data?.results || []).map((item: any) => ({ ...item, media_type: type })),
            totalPages: data?.total_pages || 1,
        };
    },
    getSeasonDetails: async (tvId: string, seasonNumber: number) => {
        const data = await fetchTMDB(`/tv/${tvId}/season/${seasonNumber}`);
        return data || null;
    },
    getPersonDetails: async (id: string) => {
        const data = await fetchTMDB(`/person/${id}`, { append_to_response: "external_ids,images" });
        return data || null;
    },
    getPersonCredits: async (id: string) => {
        const data = await fetchTMDB(`/person/${id}/combined_credits`);
        return data || null;
    },
    getPopularPeople: async (page = 1) => {
        const data = await fetchTMDB("/person/popular", { page: page.toString() });
        return data || null;
    },
    getCollection: async (id: string) => {
        const data = await fetchTMDB(`/collection/${id}`);
        return data || null;
    },
    getListDetails: async (listId: string | number): Promise<Movie[]> => {
        const data = await fetchTMDB(`/list/${listId}`);
        if (!data) return [];

        let allItems = [...(data.items || [])];
        const totalPages = data.total_pages || 1;

        if (totalPages > 1) {
            const promises = [];
            for (let p = 2; p <= totalPages; p++) {
                promises.push(fetchTMDB(`/list/${listId}`, { page: p.toString() }));
            }
            const results = await Promise.all(promises);
            results.forEach((res) => {
                if (res?.items) {
                    allItems = allItems.concat(res.items);
                }
            });
        }

        return allItems.map((item: any) => ({
            ...item,
            media_type: item.media_type || "movie"
        }));
    },
    getUpcoming: async (): Promise<Movie[]> => {
        const data = await fetchTMDB("/movie/upcoming");
        return (data?.results || []).map((item: any) => ({ ...item, media_type: "movie" }));
    },
    getNowPlaying: async (): Promise<Movie[]> => {
        const data = await fetchTMDB("/movie/now_playing");
        return (data?.results || []).map((item: any) => ({ ...item, media_type: "movie" }));
    },
    getAiringToday: async (): Promise<Movie[]> => {
        const data = await fetchTMDB("/tv/airing_today");
        return (data?.results || []).map((item: any) => ({ ...item, media_type: "tv" }));
    },
    getOnTheAir: async (): Promise<Movie[]> => {
        const data = await fetchTMDB("/tv/on_the_air");
        return (data?.results || []).map((item: any) => ({ ...item, media_type: "tv" }));
    },
    getRandomContent: async (): Promise<Movie | null> => {
        const types: ("movie" | "tv")[] = ["movie", "tv"];
        const type = types[Math.floor(Math.random() * types.length)];
        const page = Math.floor(Math.random() * 5) + 1; // Randomly pick from first 5 pages
        const data = await fetchTMDB(`/${type}/popular`, { page: page.toString() });
        const results = data?.results || [];
        if (results.length === 0) return null;
        const movie = results[Math.floor(Math.random() * results.length)];
        return { ...movie, media_type: type };
    },
    getTrailer: async (type: "movie" | "tv", id: string) => {
        const data = await fetchTMDB(`/${type}/${id}/videos`);
        const videos = data?.results || [];
        // Priority: Trailer > Teaser > Clip
        const trailer = videos.find((v: any) => v.type === "Trailer" && v.site === "YouTube") ||
            videos.find((v: any) => v.type === "Teaser" && v.site === "YouTube") ||
            videos.find((v: any) => v.site === "YouTube");
        return trailer ? `https://www.youtube.com/embed/${trailer.key}?autoplay=1` : null;
    },
    getCompanyDetails: async (id: string) => {
        const data = await fetchTMDB(`/company/${id}`);
        return data || null;
    },
    getNetworkDetails: async (id: string) => {
        const data = await fetchTMDB(`/network/${id}`);
        return data || null;
    },
    getDiscoverByCompany: async (companyId: string, type: "movie" | "tv" = "movie", page: number = 1): Promise<{ results: Movie[]; totalPages: number; totalResults: number }> => {
        const data = await fetchTMDB(`/discover/${type}`, {
            with_companies: companyId,
            sort_by: "popularity.desc",
            include_adult: "false",
            page: page.toString()
        });
        const results = (data?.results || []).map((item: any) => ({ ...item, media_type: type }));
        return {
            results,
            totalPages: data?.total_pages || 1,
            totalResults: data?.total_results || 0
        };
    },
    getDiscoverByNetwork: async (networkId: string, page: number = 1): Promise<{ results: Movie[]; totalPages: number; totalResults: number }> => {
        const data = await fetchTMDB(`/discover/tv`, {
            with_networks: networkId,
            sort_by: "popularity.desc",
            include_adult: "false",
            page: page.toString()
        });
        const results = (data?.results || []).map((item: any) => ({ ...item, media_type: "tv" }));
        return {
            results,
            totalPages: data?.total_pages || 1,
            totalResults: data?.total_results || 0
        };
    }
};

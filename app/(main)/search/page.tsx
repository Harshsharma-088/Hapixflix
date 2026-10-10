"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Clock, Star, Play, TrendingUp, Film, Tv, Sparkles, ChevronRight, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { getTrendingContent, getTrendingAnime, searchContentPage, getProviderContentPage } from "@/app/actions/search";
import { Movie } from "@/types/types";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { IconsClubLogo } from "@/components/ui/IconsClubLogo";

const PROVIDERS = [
  { id: "8", name: "Netflix", iconSlug: "netflix", color: "#E50914", short: "N" },
  { id: "9", name: "Prime Video", iconSlug: "prime-video", color: "#00A8E1", short: "P" },
  { id: "1899", name: "Max", iconSlug: "max", color: "#000000", short: "M", border: true },
  { id: "122", name: "JioHotstar", iconSlug: "jiohotstar", color: "#113CCF", short: "JH" },
  { id: "350", name: "Apple TV+", iconSlug: "apple-tv", color: "#000000", short: "tv", border: true },
  { id: "531", name: "Paramount+", iconSlug: "paramount", color: "#0064FF", short: "P+" },
  { id: "15", name: "Hulu", iconSlug: "hulu", color: "#1CE783", short: "H" },
  { id: "283", name: "Crunchyroll", iconSlug: "crunchyroll", color: "#F47521", short: "CR" },
  { id: "386", name: "Peacock", iconSlug: "peacock", color: "#000000", short: "PC", border: true },
  { id: "73", name: "Tubi", iconSlug: "tubi", color: "#FA3200", short: "TB" },
  { id: "43", name: "Starz", iconSlug: "starz", color: "#000000", short: "ST", border: true },
  { id: "37", name: "Showtime", iconSlug: "showtime", color: "#E50914", short: "SH" },
  { id: "521", name: "AMC+", iconSlug: "amc", color: "#000000", short: "AMC", border: true },
];

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const { searchHistory, addSearchHistory, removeSearchHistory, clearSearchHistory } = useStore();

  const initialProvider = searchParams.get("provider") || "";
  const urlFilter = searchParams.get("filter");
  const initialFilter = (urlFilter === "movie" || urlFilter === "tv" || urlFilter === "anime") ? urlFilter : "all";

  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<"all" | "movie" | "tv" | "anime">(initialFilter);
  const [results, setResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialQuery || !!initialProvider);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [trendingTv, setTrendingTv] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [popularTv, setPopularTv] = useState<Movie[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const [activeProvider, setActiveProvider] = useState<string>(initialProvider);
  const [activeProviderName, setActiveProviderName] = useState("");
  const [providerMovies, setProviderMovies] = useState<Movie[]>([]);
  const [providerTv, setProviderTv] = useState<Movie[]>([]);
  const [providerTab, setProviderTab] = useState<"movies" | "tv">("movies");
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [providerPage, setProviderPage] = useState(1);
  const [providerTotalPages, setProviderTotalPages] = useState(1);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isInternalRef = useRef(false);
  const filterRef = useRef(filter);
  filterRef.current = filter;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (initialProvider) {
      const p = PROVIDERS.find((x) => x.id === initialProvider);
      if (p) {
        setActiveProviderName(p.name);
        loadProviderContent(initialProvider);
      }
      return;
    }
    if (!initialQuery) {
      if (initialFilter === "anime") {
        getTrendingAnime().then((data) => {
          setTrendingMovies(data.trendingAnime);
          setTrendingTv([]);
          setPopularMovies(data.popularAnime);
          setPopularTv([]);
          setIsLoadingTrending(false);
        });
      } else {
        getTrendingContent().then((data) => {
          setTrendingMovies(data.trendingMovies);
          setTrendingTv(data.trendingTv);
          setPopularMovies(data.popularMovies);
          setPopularTv(data.popularTv);
          setIsLoadingTrending(false);
        });
      }
    }
  }, []);

  useEffect(() => {
    if (initialQuery && query) {
      doSearch(query, filter);
    }
  }, []);

  const loadProviderContent = async (providerId: string) => {
    setIsSearching(true);
    setHasSearched(true);
    const [movies, tv] = await Promise.all([
      getProviderContentPage(providerId, "movie", 1),
      getProviderContentPage(providerId, "tv", 1),
    ]);
    setProviderMovies(movies.results);
    setProviderTv(tv.results);
    setProviderPage(1);
    setProviderTotalPages(Math.max(movies.totalPages, tv.totalPages));
    setProviderTab("movies");
    setIsSearching(false);
  };

  const handleLoadMoreProvider = async () => {
    if (isLoadingMore || !activeProvider) return;
    setIsLoadingMore(true);
    const nextPage = providerPage + 1;
    const [movies, tv] = await Promise.all([
      getProviderContentPage(activeProvider, "movie", nextPage),
      getProviderContentPage(activeProvider, "tv", nextPage),
    ]);
    setProviderMovies((prev) => [...prev, ...movies.results]);
    setProviderTv((prev) => [...prev, ...tv.results]);
    setProviderPage(nextPage);
    setProviderTotalPages(Math.max(movies.totalPages, tv.totalPages));
    setIsLoadingMore(false);
  };

  const doSearch = useCallback(async (q: string, f: typeof filter) => {
    if (q.trim().length > 1) {
      setIsSearching(true);
      setHasSearched(true);
      const data = await searchContentPage(q, 1, f);
      setResults(data.results);
      setSearchPage(1);
      setSearchTotalPages(data.totalPages);
      setIsSearching(false);
      addSearchHistory(q);
    } else {
      setResults([]);
      setHasSearched(false);
    }
  }, [addSearchHistory]);

  const handleLoadMoreSearch = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    const nextPage = searchPage + 1;
    const data = await searchContentPage(query, nextPage, filterRef.current);
    setResults((prev) => [...prev, ...data.results]);
    setSearchPage(nextPage);
    setSearchTotalPages(data.totalPages);
    setIsLoadingMore(false);
  };

  useEffect(() => {
    if (isInternalRef.current) {
      isInternalRef.current = false;
      return;
    }
    const q = searchParams.get("q") || "";
    const p = searchParams.get("provider") || "";
    if (p && p !== activeProvider) {
      setActiveProvider(p);
      setQuery("");
      const provider = PROVIDERS.find((x) => x.id === p);
      setActiveProviderName(provider?.name || "");
      loadProviderContent(p);
      return;
    }
    if (!p && activeProvider) {
      setActiveProvider("");
      setActiveProviderName("");
      setResults([]);
      setHasSearched(false);
      return;
    }
    if (q !== query) {
      setQuery(q);
      if (q) {
        doSearch(q, filterRef.current);
      } else {
        setResults([]);
        setHasSearched(false);
      }
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    clearTimeout(debounceRef.current);

    if (val.trim().length > 1) {
      debounceRef.current = setTimeout(() => {
        doSearch(val, filterRef.current);
        isInternalRef.current = true;
        router.push(`/search?q=${encodeURIComponent(val.trim())}${filterRef.current !== 'all' ? `&filter=${filterRef.current}` : ''}`, { scroll: false });
      }, 400);
    } else {
      isInternalRef.current = true;
      router.push(`/search${filterRef.current !== 'all' ? `?filter=${filterRef.current}` : ''}`, { scroll: false });
      setResults([]);
      setHasSearched(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) {
      isInternalRef.current = true;
      router.push(`/search?q=${encodeURIComponent(query.trim())}${filter !== 'all' ? `&filter=${filter}` : ''}`, { scroll: false });
      doSearch(query, filter);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleFilterChange = (f: typeof filter) => {
    setFilter(f);
    filterRef.current = f;
    
    isInternalRef.current = true;
    if (query.trim().length > 1) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}${f !== 'all' ? `&filter=${f}` : ''}`, { scroll: false });
      doSearch(query, f);
    } else {
      router.push(`/search${f !== 'all' ? `?filter=${f}` : ''}`, { scroll: false });
      if (f === "anime") {
        setIsLoadingTrending(true);
        getTrendingAnime().then((data) => {
          setTrendingMovies(data.trendingAnime);
          setTrendingTv([]);
          setPopularMovies(data.popularAnime);
          setPopularTv([]);
          setIsLoadingTrending(false);
        });
      } else {
        setIsLoadingTrending(true);
        getTrendingContent().then((data) => {
          setTrendingMovies(data.trendingMovies);
          setTrendingTv(data.trendingTv);
          setPopularMovies(data.popularMovies);
          setPopularTv(data.popularTv);
          setIsLoadingTrending(false);
        });
      }
    }
  };

  const isInitial = !query && !hasSearched;

  return (
    <div className="min-h-screen bg-black">
      <div className="pt-20 pb-6 px-4 md:px-14 xl:px-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => router.back()} className="text-white/50 hover:text-white p-1 -ml-1 transition-colors">
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Search</h1>
          </div>

          <div className="relative">
            <form onSubmit={handleSearch}>
              <div className="flex items-center bg-[#141414] border border-white/10 rounded-xl overflow-hidden focus-within:border-white/30 transition-colors">
                <div className="pl-4">
                  <Search size={18} className="text-white/30" />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Search movies, shows, anime..."
                  className="w-full bg-transparent py-3 pl-3 pr-10 text-sm md:text-base text-white placeholder:text-white/20 focus:outline-none"
                  autoComplete="off"
                  spellCheck={false}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => { setQuery(""); setResults([]); setHasSearched(false); isInternalRef.current = true; router.push("/search", { scroll: false }); }}
                    className="mr-2 text-white/40 hover:text-white p-1"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </form>
          </div>

          {hasSearched && (
            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
              {(["all", "movie", "tv", "anime"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => handleFilterChange(f)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    filter === f
                      ? "bg-white text-black"
                      : "bg-[#141414] border border-white/10 text-white/50 hover:text-white"
                  }`}
                >
                  {f === "all" ? "All" : f === "movie" ? "Movies" : f === "tv" ? "TV Shows" : "Anime"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 md:px-14 xl:px-20 pb-16">
        <div className="max-w-7xl mx-auto">

          {isInitial && (
            <>
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest">Platforms</h2>
                  <button 
                    onClick={() => setShowAllPlatforms(!showAllPlatforms)}
                    className="text-xs font-bold text-red-500 hover:text-red-400 flex items-center gap-1 transition-colors group"
                  >
                    <span>{showAllPlatforms ? "Show Less" : "See All"}</span>
                    <ChevronRight size={14} className={`transition-transform duration-200 ${showAllPlatforms ? "-rotate-90" : "rotate-90 group-hover:translate-x-0.5"}`} />
                  </button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-2">
                  {(showAllPlatforms ? PROVIDERS : PROVIDERS.slice(0, 7)).map((provider) => (
                    <Link
                      key={provider.id}
                      href={`/search?provider=${provider.id}`}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#141414] border border-white/5 active:scale-95 transition-all group hover:bg-[#1f1f1f] hover:border-white/10"
                    >
                      <div className="w-10 h-10 flex items-center justify-center p-1 rounded-xl bg-black/40 border border-white/5 shrink-0 overflow-hidden">
                        <IconsClubLogo
                          name={provider.iconSlug}
                          size={128}
                          className="w-full h-full object-contain"
                          fallbackText={provider.short}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-white/60 group-hover:text-white text-center leading-tight transition-colors">{provider.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {searchHistory.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest">Recent</h2>
                    <button onClick={clearSearchHistory} className="text-xs text-red-400 hover:text-red-300">Clear</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.map((histQuery) => (
                      <div
                        key={histQuery}
                        onClick={() => { setQuery(histQuery); isInternalRef.current = true; router.push(`/search?q=${encodeURIComponent(histQuery)}`, { scroll: false }); doSearch(histQuery, filter); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141414] border border-white/5 rounded-lg text-sm text-white/50 active:scale-95 transition-all cursor-pointer hover:bg-white/5"
                      >
                        <Clock size={12} className="text-white/20" />
                        <span>{histQuery}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeSearchHistory(histQuery); }}
                          className="ml-0.5 text-white/10 hover:text-white/50"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isLoadingTrending && (
                <div className="space-y-8">
                  {trendingMovies.length > 0 && (
                    <section>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp size={15} className="text-red-500" />
                          <h2 className="text-sm font-bold text-white">{filter === "anime" ? "Trending Anime" : "Trending Movies"}</h2>
                        </div>
                        <Link href="/movies" className="text-xs text-white/40 hover:text-white flex items-center gap-0.5">
                          All <ArrowRight size={12} />
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
                        {trendingMovies.slice(0, 6).map((movie) => (
                          <TrendingCard key={movie.publicId} movie={movie} />
                        ))}
                      </div>
                    </section>
                  )}

                  {trendingTv.length > 0 && (
                    <section>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <Tv size={15} className="text-red-500" />
                          <h2 className="text-sm font-bold text-white">Trending TV</h2>
                        </div>
                        <Link href="/series" className="text-xs text-white/40 hover:text-white flex items-center gap-0.5">
                          All <ArrowRight size={12} />
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
                        {trendingTv.slice(0, 6).map((movie) => (
                          <TrendingCard key={movie.publicId} movie={movie} />
                        ))}
                      </div>
                    </section>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {popularMovies.length > 0 && (
                      <section>
                        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">{filter === "anime" ? "Popular Anime" : "Popular Movies"}</h3>
                        <div className="flex flex-col gap-1">
                          {popularMovies.slice(0, 5).map((movie) => (
                            <MiniCard key={movie.publicId} movie={movie} />
                          ))}
                        </div>
                      </section>
                    )}
                    {popularTv.length > 0 && (
                      <section>
                        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Popular TV</h3>
                        <div className="flex flex-col gap-1">
                          {popularTv.slice(0, 5).map((movie) => (
                            <MiniCard key={movie.publicId} movie={movie} />
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                </div>
              )}

              {isLoadingTrending && (
                <div className="space-y-6">
                  {[1, 2].map((row) => (
                    <div key={row}>
                      <div className="h-4 w-32 bg-white/5 rounded mb-3 animate-pulse" />
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="aspect-[2/3] bg-white/5 rounded-lg animate-pulse" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchHistory.length === 0 && !isLoadingTrending && (
                <div className="text-center py-20">
                  <Sparkles size={18} className="mx-auto mb-2 text-white/10" />
                  <p className="text-sm text-white/20">Search for something</p>
                </div>
              )}
            </>
          )}

          {hasSearched && (
            <>
              {activeProviderName ? (
                <>
                  <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          isInternalRef.current = true;
                          router.push("/search", { scroll: false });
                        }}
                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#141414] hover:bg-[#1f1f1f] text-white/80 hover:text-white border border-white/10 active:scale-95 transition-all group"
                      >
                        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform text-red-500" />
                        <span className="text-xs font-bold">Back to Platforms</span>
                      </button>
                      
                      <div className="flex items-center gap-2 bg-[#141414] px-3.5 py-1.5 rounded-xl border border-white/5">
                        {(() => {
                          const p = PROVIDERS.find((x) => x.id === activeProvider);
                          return p ? (
                            <IconsClubLogo name={p.iconSlug} size={64} className="w-5 h-5 object-contain" />
                          ) : null;
                        })()}
                        <span className="text-sm font-extrabold text-white tracking-tight">{activeProviderName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => setProviderTab("movies")}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        providerTab === "movies" ? "bg-white text-black" : "bg-[#141414] border border-white/10 text-white/50 hover:text-white"
                      }`}
                    >
                      Movies {providerMovies.length > 0 && <span className="ml-1 text-white/40">({providerMovies.length})</span>}
                    </button>
                    <button
                      onClick={() => setProviderTab("tv")}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        providerTab === "tv" ? "bg-white text-black" : "bg-[#141414] border border-white/10 text-white/50 hover:text-white"
                      }`}
                    >
                      TV Shows {providerTv.length > 0 && <span className="ml-1 text-white/40">({providerTv.length})</span>}
                    </button>
                  </div>
                  {isSearching ? (
                    <div className="flex items-center justify-center py-32">
                      <div className="w-7 h-7 border-2 border-white/10 border-t-red-600 rounded-full animate-spin" />
                    </div>
                  ) : (providerTab === "movies" ? providerMovies : providerTv).length > 0 ? (
                    <div>
                      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5">
                        {(providerTab === "movies" ? providerMovies : providerTv).map((movie) => (
                          <ResultCard key={movie.publicId} movie={movie} />
                        ))}
                      </div>
                      {providerPage < providerTotalPages && (
                        <div className="flex justify-center mt-6">
                          <button
                            onClick={handleLoadMoreProvider}
                            disabled={isLoadingMore}
                            className="flex items-center gap-2 px-6 py-2.5 bg-[#141414] border border-white/10 rounded-lg text-xs font-semibold text-white/70 hover:text-white hover:border-white/20 disabled:opacity-50 transition-all"
                          >
                            {isLoadingMore ? <Loader2 size={14} className="animate-spin" /> : null}
                            {isLoadingMore ? "Loading..." : "Load More"}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-24">
                      <p className="text-sm text-white/30">No {providerTab === "movies" ? "movies" : "TV shows"} available</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {isSearching ? (
                    <div className="flex items-center justify-center py-32">
                      <div className="w-7 h-7 border-2 border-white/10 border-t-red-600 rounded-full animate-spin" />
                    </div>
                  ) : results.length > 0 ? (
                    <div>
                      <p className="text-xs text-white/40 mb-3">
                        <span className="text-white font-medium">{results.length}</span> results
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5">
                        {results.map((movie) => (
                          <ResultCard key={movie.publicId} movie={movie} />
                        ))}
                      </div>
                      {searchPage < searchTotalPages && (
                        <div className="flex justify-center mt-6">
                          <button
                            onClick={handleLoadMoreSearch}
                            disabled={isLoadingMore}
                            className="flex items-center gap-2 px-6 py-2.5 bg-[#141414] border border-white/10 rounded-lg text-xs font-semibold text-white/70 hover:text-white hover:border-white/20 disabled:opacity-50 transition-all"
                          >
                            {isLoadingMore ? <Loader2 size={14} className="animate-spin" /> : null}
                            {isLoadingMore ? "Loading..." : "Load More"}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-24">
                      <Search size={28} className="text-white/10 mb-3" />
                      <p className="text-sm text-white/30">No results for &ldquo;{query}&rdquo;</p>
                      <p className="text-xs text-white/20 mt-1">Try a different search</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TrendingCard({ movie }: { movie: Movie }) {
  return (
    <Link
      href={movie.mediaType === "anime" ? `/anime/detail/${movie.publicId}` : `/detail/${movie.publicId}?v=${movie.mediaType === "tv" ? 2 : 1}`}
      className="group relative aspect-[2/3] rounded-lg overflow-hidden bg-[#141414] active:scale-95 transition-all"
    >
      <SafeImage
        src={(movie.thumbnailUrl || movie.backdropUrl)?.replace("/w500/", "/w342/").replace("/w780/", "/w342/")}
        alt={movie.title || ""}
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-xs font-semibold text-white truncate">{movie.title}</p>
      </div>
    </Link>
  );
}

function MiniCard({ movie }: { movie: Movie }) {
  return (
    <Link
      href={movie.mediaType === "anime" ? `/anime/detail/${movie.publicId}` : `/detail/${movie.publicId}?v=${movie.mediaType === "tv" ? 2 : 1}`}
      className="flex items-center gap-2 p-2 rounded-lg bg-[#141414] active:scale-[0.98] transition-all"
    >
      <div className="relative w-9 h-13 rounded overflow-hidden bg-[#0a0a0a] shrink-0">
        <SafeImage
          src={(movie.thumbnailUrl || movie.backdropUrl)?.replace("/w500/", "/w92/").replace("/w780/", "/w92/")}
          alt={movie.title || ""}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-xs font-semibold text-white/80 truncate">{movie.title}</span>
        <span className="text-[10px] text-white/40">{movie.releaseYear || "N/A"} · {movie.rating || "N/A"}</span>
      </div>
      <ChevronRight size={14} className="text-white/20 shrink-0" />
    </Link>
  );
}

function ResultCard({ movie }: { movie: Movie }) {
  return (
    <Link
      href={movie.mediaType === "anime" ? `/anime/detail/${movie.publicId}` : `/detail/${movie.publicId}?v=${movie.mediaType === "tv" ? 2 : 1}`}
      className="group relative flex flex-col bg-[#141414] rounded-lg overflow-hidden active:scale-95 transition-all"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-[#0a0a0a]">
        <SafeImage
          src={(movie.thumbnailUrl || movie.backdropUrl)?.replace("/w500/", "/w342/").replace("/w780/", "/w342/")}
          alt={movie.title || ""}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
          <span className="flex items-center gap-1 text-white text-xs font-bold bg-red-600 px-3 py-1.5 rounded-lg">
            <Play size={10} fill="currentColor" /> Play
          </span>
        </div>
        {movie.rating && (
          <div className="absolute top-2 right-2 bg-black/70 px-1.5 py-0.5 rounded text-[10px] font-bold text-yellow-500 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Star size={8} className="fill-yellow-500" /> {movie.rating}
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className="text-[9px] font-bold text-white/70 bg-black/60 px-1.5 py-0.5 rounded">
            {movie.mediaType === "anime" ? "ANIME" : movie.mediaType === "tv" ? "TV" : "MOVIE"}
          </span>
        </div>
      </div>
      <div className="p-2.5">
        <h3 className="text-xs font-semibold text-white/90 truncate">{movie.title}</h3>
        <p className="text-[10px] text-white/40 mt-0.5">{movie.releaseYear || "N/A"}</p>
      </div>
    </Link>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-white/10 border-t-red-600 rounded-full animate-spin" />
      </div>
    }>
      <SearchPageInner />
    </Suspense>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Clock, Play, Info, ChevronDown, ChevronUp, Star } from "lucide-react";
import { useStore } from "@/store/useStore";
import { searchContent } from "@/app/actions/search";
import { Movie } from "@/types/types";
import SafeImage from "@/components/SafeImage";
import { useRouter, usePathname } from "next/navigation";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const { searchHistory, addSearchHistory, removeSearchHistory, clearSearchHistory } = useStore();
  
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "movie" | "tv" | "anime">("all");
  const [results, setResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const pathname = usePathname();

  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      if (pathname.startsWith("/anime")) {
        setFilter("anime");
      }
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
      setQuery("");
      setResults([]);
      setFilter("all");
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  const handleEnter = () => {
    if (query.trim()) {
      onClose();
      router.push(`/search?q=${encodeURIComponent(query.trim())}&filter=${filter}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleEnter();
    }
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length > 1) {
        setIsSearching(true);
        const data = await searchContent(query, filter);
        setResults(data);
        setIsSearching(false);
        addSearchHistory(query);
      } else {
        setResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query, filter, addSearchHistory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center px-4 pt-24 md:pt-0 pointer-events-auto">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm search-overlay" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-xl flex flex-col gap-3 z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Row */}
        <div className="flex items-center justify-between mb-1 pl-1">
          <h2 className="text-2xl font-bold text-white tracking-tight leading-none">Search</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              {(["all", "movie", "tv", "anime"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all duration-200 ${
                    filter === f
                      ? "bg-white text-black"
                      : "bg-[#111111] border border-white/10 text-white/60 hover:bg-[#1a1a1a] hover:text-white/90"
                  }`}
                >
                  {f === "all" ? "All" : f === "movie" ? "Movies" : f === "tv" ? "TV Shows" : "Anime"}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="p-1.5 bg-[#111111] border border-white/10 hover:bg-[#1a1a1a] rounded-xl text-white/80 transition-colors flex items-center justify-center">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Input Box */}
        <div className="relative w-full shadow-2xl rounded-2xl z-20">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
          <input 
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type here to search..."
            className="w-full bg-[#111111] border border-white/10 rounded-2xl py-3.5 pl-11 pr-11 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all font-medium shadow-inner"
          />
          {query && (
            <button 
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Results / Recent Box */}
        {((!query && searchHistory.length > 0) || query) && (
          <div className="w-full bg-[#111111] border border-white/10 rounded-2xl shadow-2xl max-h-[45vh] overflow-y-auto custom-scrollbar flex flex-col mt-1 z-10 animate-in fade-in slide-in-from-top-2 duration-200">
            
            {!query && searchHistory.length > 0 && (
              <div className="flex flex-col pb-2">
                <div className="flex items-center justify-between px-5 py-3 mt-1">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Recent</span>
                  <button onClick={() => clearSearchHistory()} className="text-[11px] font-medium text-white/80 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition-all duration-200">Clear</button>
                </div>
                {searchHistory.map((histQuery) => (
                  <div key={histQuery} className="flex items-center justify-between px-5 py-2 hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => setQuery(histQuery)}>
                    <div className="flex items-center gap-3 text-white/50 group-hover:text-white transition-colors">
                      <Clock size={14} />
                      <span className="text-[13px] font-medium">{histQuery}</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeSearchHistory(histQuery); }}
                      className="text-white/20 hover:text-white/80 opacity-0 group-hover:opacity-100 transition-all p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {query && results.length > 0 && (
              <div className="flex flex-col p-2 gap-1">
                {results.map((movie) => {
                  const isExpanded = expandedId === movie.publicId;
                  
                  return (
                    <div key={movie.publicId} className="flex flex-col bg-transparent hover:bg-white/5 rounded-xl transition-all duration-500 ease-out overflow-hidden">
                      <div 
                        className="flex items-center p-2 gap-4 cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : (movie.publicId || ""))}
                      >
                        <div className="relative w-[40px] h-[55px] rounded-lg overflow-hidden bg-[#141414] shrink-0">
                          <SafeImage
                            src={(movie.thumbnailUrl || movie.backdropUrl)?.replace("/w500/", "/w92/").replace("/w780/", "/w92/")}
                            alt={movie.title || "Poster"}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0 justify-center">
                          <h4 className="text-sm font-bold text-white mb-1 truncate">{movie.title}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-white/50 font-medium">
                            <span>{(movie as any).mediaType === "tv" ? "TV Show" : "Movie"}</span>
                            <span>|</span>
                            <span>{movie.releaseYear || ((movie as any).releaseDate ? new Date((movie as any).releaseDate).getFullYear() : "N/A")}</span>
                            <span>|</span>
                            <span className="flex items-center gap-1 text-yellow-500"><Star size={10} className="fill-yellow-500" /> {movie.rating || "N/A"}</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            onClose(); 
                            router.push((movie as any).mediaType === 'anime' ? `/anime/detail/${movie.publicId}` : `/detail/${movie.publicId}?v=${(movie as any).mediaType === 'tv' ? 2 : 1}`); 
                          }}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all duration-300 hover:scale-105 active:scale-95 shrink-0"
                        >
                          <Play size={12} fill="currentColor" /> Play
                        </button>
                        <button className="p-2 text-white/30 shrink-0 hover:text-white transition-colors">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 animate-in slide-in-from-top-3 fade-in duration-500 ease-out ml-[56px]">
                          <p className="text-[11px] text-white/50 line-clamp-3 leading-relaxed pr-8 transition-all duration-500">
                            {movie.description}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {query && !isSearching && results.length === 0 && (
              <div className="p-8 flex flex-col items-center justify-center text-white/30">
                <Search size={24} className="mb-2 opacity-20" />
                <p className="text-xs">No results found for "{query}"</p>
              </div>
            )}

            {isSearching && results.length === 0 && (
              <div className="p-8 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        )}
        
      </div>
    </div>
  );
}

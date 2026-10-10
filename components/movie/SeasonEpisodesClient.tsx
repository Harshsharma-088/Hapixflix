"use client";

import React, { useState, useEffect } from "react";
import SafeImage from "@/components/SafeImage";
import { useRouter } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
import { getSeasonEpisodes } from "@/app/actions/tv";
import { PLAYBACK_KEY, PlaybackData, buildPlayHref } from "@/lib/playback";

interface Season {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
}

interface SeasonEpisodesClientProps {
  movieId: string;
  seasons: Season[];
  initialEpisodes: any[];
}

export default function SeasonEpisodesClient({ movieId, seasons, initialEpisodes }: SeasonEpisodesClientProps) {
  // Find the first season that actually has episodes (often season 1, but sometimes season 0 is specials)
  const defaultSeason = seasons.find(s => s.season_number > 0) || seasons[0];
  
  const [selectedSeason, setSelectedSeason] = useState<number>(defaultSeason?.season_number || 1);
  const [episodes, setEpisodes] = useState<any[]>(initialEpisodes);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Valid seasons that have episodes
  const validSeasons = seasons.filter(s => s.season_number > 0 && s.episode_count > 0);

  useEffect(() => {
    let isMounted = true;
    
    // Don't fetch if we're on the default season and already have the initial episodes
    if (selectedSeason === defaultSeason?.season_number && episodes === initialEpisodes) {
      return;
    }

    const fetchEpisodes = async () => {
      setIsLoading(true);
      const data = await getSeasonEpisodes(movieId, selectedSeason);
      if (isMounted) {
        setEpisodes(data);
        setVisibleCount(20);
        setIsLoading(false);
      }
    };

    fetchEpisodes();
    return () => { isMounted = false; };
  }, [selectedSeason, movieId, defaultSeason, initialEpisodes]);

  const filteredEpisodes = (episodes || []).filter((ep: any) => 
    ep?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    ep?.episode_number?.toString() === searchQuery
  );

  if (validSeasons.length === 0) return null;

  return (
    <section id="episodes" className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-red-600 rounded-full"></div>
          <h2 className="text-2xl font-bold text-white">Episodes</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
            <input 
              type="text" 
              placeholder="Search episode..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141414] border border-white/10 hover:border-white/30 focus:border-red-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 outline-none transition-all"
            />
          </div>

          {/* Season Dropdown */}
          <div className="relative w-full sm:w-auto">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between sm:justify-start gap-2 bg-[#141414] border border-white/10 hover:border-white/30 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all w-full sm:w-auto"
            >
              {validSeasons.find(s => s.season_number === selectedSeason)?.name || `Season ${selectedSeason}`}
              <ChevronDown size={16} className={`transition-transform ml-auto sm:ml-4 ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-full sm:w-48 bg-[#141414] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-64 overflow-y-auto">
                {validSeasons.map((season) => (
                  <button
                    key={season.id}
                    onClick={() => {
                      setSelectedSeason(season.season_number);
                      setIsDropdownOpen(false);
                    }}
                    className={`px-4 py-3 text-left text-sm font-semibold hover:bg-white/10 transition-colors ${
                      selectedSeason === season.season_number ? 'text-red-500 bg-white/5' : 'text-white'
                    }`}
                  >
                    {season.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Episodes List */}
      <div className="grid grid-cols-2 md:grid-cols-1 gap-3 md:gap-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-12 col-span-2 md:col-span-1">
            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredEpisodes.length > 0 ? (
          <>
            {filteredEpisodes.slice(0, visibleCount).map((ep: any) => {
              const handlePlay = () => {
                const payload = { tmdbId: movieId, mediaType: "tv", season: selectedSeason, episode: ep.episode_number };
                sessionStorage.setItem(PLAYBACK_KEY, JSON.stringify(payload));
                router.push(buildPlayHref(payload as PlaybackData));
              };
              return (
              <button
                onClick={handlePlay}
                key={ep.id} 
                className="group flex flex-col md:flex-row gap-2 md:gap-4 bg-[#141414] rounded-2xl border border-white/5 overflow-hidden hover:border-white/20 hover:bg-[#1a1a1a] transition-all text-left"
              >
                <div className="relative w-full md:w-64 aspect-video shrink-0 bg-[#141414] overflow-hidden">
                  <SafeImage
                    src={ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : null}
                    alt={ep.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Play overlay on hover */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/40">
                      <div className="w-0 h-0 border-t-6 border-b-6 border-l-8 border-transparent border-l-white ml-1"></div>
                    </div>
                  </div>

                  <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 rounded text-xs font-bold text-white shadow-lg">
                    E{ep.episode_number}
                  </div>
                </div>
                
                <div className="p-3 md:p-6 md:pl-2 flex flex-col justify-center flex-1">
                  <h3 className="text-sm md:text-lg font-bold text-white mb-1 group-hover:text-red-500 transition-colors line-clamp-1 md:line-clamp-2">{ep.name}</h3>
                  <span className="hidden md:block text-xs text-white/50 mb-3 font-semibold">{ep.runtime ? `${ep.runtime} min` : '45 min'}</span>
                  <p className="hidden md:block text-sm text-white/70 line-clamp-3 leading-relaxed">{ep.overview || "No description available for this episode."}</p>
                </div>
                </button>
              );
            })}
            {visibleCount < filteredEpisodes.length && (
              <div className="col-span-2 md:col-span-1">
                <button 
                  onClick={() => setVisibleCount(prev => prev + 20)}
                  className="mt-2 w-full py-3 md:py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  <ChevronDown size={18} /> Load More
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center py-12 text-white/40 col-span-2 md:col-span-1">
            No episodes found for this search.
          </div>
        )}
      </div>
    </section>
  );
}

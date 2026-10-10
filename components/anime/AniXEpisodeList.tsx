"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ChevronRight, Check } from "lucide-react";

export default function AniXEpisodeList({
  anilistId,
  anime,
}: {
  anilistId: number;
  anime: any;
}) {
  const [episodesData, setEpisodesData] = useState<any>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(true);
  
  const [episodeSearch, setEpisodeSearch] = useState("");
  const [episodeRangeIndex, setEpisodeRangeIndex] = useState(0);
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);
  const EPS_PER_PAGE = 40;

  useEffect(() => {
    let isMounted = true;
    setIsLoadingEpisodes(true);

    fetch(`/api/anixanime/episodes/${anilistId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load server data");
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        setEpisodesData(data);
        const validProviders = Object.keys(data).filter(
          (k) => !["page", "type", "mappings", "_unknownProviders"].includes(k) && data[k]?.episodes
        );
        
        const preferred = ["animegg", "kaa", "anikoto", "gogoanime", "allmanga", "reanime"];
        validProviders.sort((a, b) => {
          const idxA = preferred.indexOf(a);
          const idxB = preferred.indexOf(b);
          if (idxA === -1 && idxB === -1) return 0;
          if (idxA === -1) return 1;
          if (idxB === -1) return -1;
          return idxA - idxB;
        });

        if (validProviders.length > 0 && !validProviders.includes(selectedProvider)) {
          setSelectedProvider(validProviders[0]);
        }
        setIsLoadingEpisodes(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("AniXEpisodeList episodes error:", err);
        setIsLoadingEpisodes(false);
      });

    return () => {
      isMounted = false;
    };
  }, [anilistId]);

  const totalEpisodes = anime.episodes || 24;
  const rawProviderEpisodes = episodesData?.[selectedProvider]?.episodes;
  
  let providerEpisodes: any[] = [];
  if (Array.isArray(rawProviderEpisodes)) {
    providerEpisodes = rawProviderEpisodes;
  } else if (rawProviderEpisodes && typeof rawProviderEpisodes === 'object') {
    if (Array.isArray(rawProviderEpisodes["sub"]) && rawProviderEpisodes["sub"].length > 0) {
      providerEpisodes = rawProviderEpisodes["sub"];
    } else {
      providerEpisodes = Object.values(rawProviderEpisodes).filter(Array.isArray).flat();
    }
  }
  
  let audioFilteredEpisodes = providerEpisodes;
  if (providerEpisodes.length > 0) {
    const hasAudioType = providerEpisodes.some((ep: any) => ep.audio === "sub");
    if (hasAudioType) {
      audioFilteredEpisodes = providerEpisodes.filter((ep: any) => ep.audio === "sub");
    } else {
      const uniqueEps = new Map();
      providerEpisodes.forEach((ep: any) => {
        if (!uniqueEps.has(ep.number)) {
          uniqueEps.set(ep.number, ep);
        }
      });
      audioFilteredEpisodes = Array.from(uniqueEps.values()).sort((a: any, b: any) => a.number - b.number);
    }
  }
  
  const normalizedEpisodes = audioFilteredEpisodes.length > 0 
    ? audioFilteredEpisodes
    : Array.from({ length: totalEpisodes }, (_, i) => ({
        number: i + 1,
        title: `Episode ${i + 1}`,
        image: anime.coverImage || anime.coverMedium,
        airDate: anime.year ? `${anime.year}-01-01` : ""
      }));

  const searchedEpisodes = normalizedEpisodes.filter((ep: any) => 
    episodeSearch.trim() === "" || 
    ep.number.toString().includes(episodeSearch.trim()) ||
    (ep.title && ep.title.toLowerCase().includes(episodeSearch.toLowerCase()))
  );

  const ranges: { start: number; end: number }[] = [];
  for (let i = 0; i < normalizedEpisodes.length; i += EPS_PER_PAGE) {
    ranges.push({
      start: i + 1,
      end: Math.min(i + EPS_PER_PAGE, normalizedEpisodes.length),
    });
  }

  const filteredEpisodes = episodeSearch.trim() === "" 
    ? searchedEpisodes.slice(episodeRangeIndex * EPS_PER_PAGE, (episodeRangeIndex + 1) * EPS_PER_PAGE)
    : searchedEpisodes;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-red-600 rounded-full"></div>
          <h2 className="text-xl font-extrabold text-white">Episodes ({normalizedEpisodes.length})</h2>
        </div>
        
        <div className="flex items-center gap-3 relative">
          {ranges.length > 0 && episodeSearch.trim() === "" && (
            <div className="relative shrink-0">
              <button
                onClick={() => setShowRangeDropdown(!showRangeDropdown)}
                className={`flex items-center justify-between gap-2 bg-[#09090b] border ${showRangeDropdown ? "border-purple-500" : "border-white/10"} rounded-xl py-2 px-3 text-xs font-bold text-white outline-none cursor-pointer hover:bg-white/5 transition-all min-w-[90px]`}
              >
                <span>{ranges[episodeRangeIndex]?.start}-{ranges[episodeRangeIndex]?.end}</span>
                <ChevronRight size={14} className={`text-white/40 transition-transform ${showRangeDropdown ? "-rotate-90" : "rotate-90"}`} />
              </button>

              {showRangeDropdown && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 p-2 flex flex-col gap-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {ranges.map((range, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setEpisodeRangeIndex(idx);
                        setShowRangeDropdown(false);
                      }}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                        episodeRangeIndex === idx
                          ? "bg-purple-600 text-white"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span>{range.start} - {range.end}</span>
                      {episodeRangeIndex === idx && <Check size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="relative shrink-0 hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
            <input
              type="text"
              placeholder="Search episode..."
              value={episodeSearch}
              onChange={(e) => setEpisodeSearch(e.target.value)}
              className="bg-[#09090b] border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-white/40 outline-none w-48 focus:border-purple-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {isLoadingEpisodes ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredEpisodes.map((ep: any) => {
              const epImage = ep.image || anime.coverImage || anime.coverMedium;
              const airDate = ep.airDate ? new Date(ep.airDate).toISOString().split("T")[0] : anime.year || "";
              
              return (
                <Link
                  key={ep.number}
                  href={`/anime/watch/${anime.id}?ep=${ep.number}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-white/10 bg-[#141417] hover:bg-[#181124] hover:border-purple-600/50 transition-all text-left group shadow-lg"
                >
                  <div className="relative w-[120px] h-[70px] rounded-lg overflow-hidden bg-black shrink-0 border border-white/5">
                    <img src={epImage} alt={`Ep ${ep.number}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                    <span className="absolute bottom-1.5 left-1.5 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-black text-white leading-none">
                      EP {ep.number}
                    </span>
                  </div>
                  <div className="flex flex-col flex-1 min-w-0 justify-center">
                    <h4 className="text-sm font-bold line-clamp-2 transition-colors text-white/90 group-hover:text-purple-400">
                      {ep.title}
                    </h4>
                    {airDate && (
                      <span className="text-[10px] text-white/40 mt-1 font-medium">{airDate}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

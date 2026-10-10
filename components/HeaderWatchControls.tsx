"use client";
import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getTvSeasonsAndEpisodes } from "@/app/actions/tv";
import { ChevronDown, Check } from "lucide-react";
import { PLAYBACK_KEY, PlaybackData, buildPlayHref } from "@/lib/playback";

export default function HeaderWatchControls() {
  const pathname = usePathname();
  const router = useRouter();

  const [seasonsCount, setSeasonsCount] = useState(1);
  const [episodesCount, setEpisodesCount] = useState(1);

  const [isSeasonOpen, setIsSeasonOpen] = useState(false);
  const [isEpisodeOpen, setIsEpisodeOpen] = useState(false);
  const [playbackData, setPlaybackData] = useState<{ tmdbId: string; mediaType: string; season: number; episode: number } | null>(null);

  const seasonRef = useRef<HTMLDivElement>(null);
  const episodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(PLAYBACK_KEY);
    if (!raw) return;
    try {
      setPlaybackData(JSON.parse(raw));
    } catch {}
  }, [pathname]);

  useEffect(() => {
    const handler = () => {
      const raw = sessionStorage.getItem(PLAYBACK_KEY);
      if (!raw) return;
      try {
        setPlaybackData(JSON.parse(raw));
      } catch {}
    };
    window.addEventListener("playback-change", handler);
    return () => window.removeEventListener("playback-change", handler);
  }, []);

  const isTv = playbackData?.mediaType === "tv";
  const movieId = playbackData?.tmdbId || "";
  const season = playbackData?.season || 1;
  const episode = playbackData?.episode || 1;

  useEffect(() => {
    if (pathname?.startsWith("/play") && isTv && movieId) {
      getTvSeasonsAndEpisodes(movieId, season).then(data => {
        setSeasonsCount(data.numberOfSeasons);
        setEpisodesCount(data.episodesCount);
      });
    }
  }, [pathname, isTv, movieId, season]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (seasonRef.current && !seasonRef.current.contains(event.target as Node)) {
        setIsSeasonOpen(false);
      }
      if (episodeRef.current && !episodeRef.current.contains(event.target as Node)) {
        setIsEpisodeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!pathname?.startsWith("/play") || !isTv) return null;

  const handleSeasonSelect = (s: number) => {
    setIsSeasonOpen(false);
    const payload: PlaybackData = { tmdbId: movieId, mediaType: "tv", season: s, episode: 1 };
    sessionStorage.setItem(PLAYBACK_KEY, JSON.stringify(payload));
    router.replace(buildPlayHref(payload));
    window.dispatchEvent(new CustomEvent("playback-change"));
  };

  const handleEpisodeSelect = (e: number) => {
    setIsEpisodeOpen(false);
    const payload: PlaybackData = { tmdbId: movieId, mediaType: "tv", season, episode: e };
    sessionStorage.setItem(PLAYBACK_KEY, JSON.stringify(payload));
    router.replace(buildPlayHref(payload));
    window.dispatchEvent(new CustomEvent("playback-change"));
  };

  return (
    <div className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2 z-[150] pointer-events-auto">

      {/* Season Dropdown */}
      <div className="flex items-center gap-3 relative" ref={seasonRef}>
        <span className="text-[11px] text-white/40 font-bold uppercase tracking-widest">Season</span>
        <button
          onClick={() => setIsSeasonOpen(!isSeasonOpen)}
          className={`flex items-center gap-2 bg-[#1a1a1f] hover:bg-[#2a2a2f] border border-white/5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors shadow-lg ${isSeasonOpen ? 'ring-1 ring-white/20' : ''}`}
        >
          Season {season}
          <ChevronDown size={16} className={`text-white/50 transition-transform ${isSeasonOpen ? 'rotate-180' : ''}`} />
        </button>

        {isSeasonOpen && (
          <div className="absolute top-full left-0 mt-2 w-48 max-h-64 overflow-y-auto custom-scrollbar bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 z-[200]">
            <div className="p-2 flex flex-col gap-1">
              {Array.from({ length: seasonsCount }).map((_, i) => {
                const s = i + 1;
                const isSelected = s === season;
                return (
                  <button
                    key={`s-${s}`}
                    onClick={() => handleSeasonSelect(s)}
                    className={`flex items-center justify-between w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors
                      ${isSelected ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}
                    `}
                  >
                    Season {s}
                    {isSelected && <Check size={14} className="text-[#ff9d00]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Episode Dropdown */}
      <div className="flex items-center gap-3 relative" ref={episodeRef}>
        <span className="text-[11px] text-white/40 font-bold uppercase tracking-widest">Episode</span>
        <button
          onClick={() => setIsEpisodeOpen(!isEpisodeOpen)}
          className={`flex items-center gap-2 bg-[#1a1a1f] hover:bg-[#2a2a2f] border border-white/5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors shadow-lg ${isEpisodeOpen ? 'ring-1 ring-white/20' : ''}`}
        >
          Episode {episode}
          <ChevronDown size={16} className={`text-white/50 transition-transform ${isEpisodeOpen ? 'rotate-180' : ''}`} />
        </button>

        {isEpisodeOpen && (
          <div className="absolute top-full left-0 mt-2 w-48 max-h-64 overflow-y-auto custom-scrollbar bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 z-[200]">
            <div className="p-2 flex flex-col gap-1">
              {Array.from({ length: episodesCount }).map((_, i) => {
                const e = i + 1;
                const isSelected = e === episode;
                return (
                  <button
                    key={`e-${e}`}
                    onClick={() => handleEpisodeSelect(e)}
                    className={`flex items-center justify-between w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors
                      ${isSelected ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}
                    `}
                  >
                    Episode {e}
                    {isSelected && <Check size={14} className="text-[#ff9d00]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

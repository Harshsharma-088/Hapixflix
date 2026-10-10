"use client";

import React, { useState, useEffect } from "react";
import { Server, ChevronRight, Search, Loader2, AlertCircle, Check, SkipBack, SkipForward } from "lucide-react";
import { Anime } from "@/types/anime";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import AniXCustomPlayer from "@/components/anime/AniXCustomPlayer";

interface AniXAnimePlayerProps {
  anilistId: number;
  anime: Anime;
  initialEpisode?: number;
}

const PROVIDER_NAMES: Record<string, { name: string; type: "HLS" | "Embed" }> = {
  reanime: { name: "ReAnime", type: "Embed" },
  anikoto: { name: "AniKoto", type: "HLS" },
  animegg: { name: "AnimeGG", type: "HLS" },
  anineko: { name: "AniNeko", type: "HLS" },
  anibd: { name: "AniBD", type: "HLS" },
};

export default function AniXAnimePlayer({ anilistId, anime, initialEpisode = 1 }: AniXAnimePlayerProps) {
  const [episodesData, setEpisodesData] = useState<any>(null);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(true);

  const [selectedEpisode, setSelectedEpisode] = useState(initialEpisode);
  const [audio, setAudio] = useState<"sub" | "dub">("sub");
  const [selectedProvider, setSelectedProvider] = useState<string>("");

  const [watchData, setWatchData] = useState<any>(null);
  const [isLoadingWatch, setIsLoadingWatch] = useState(false);
  const [watchError, setWatchError] = useState<string | null>(null);
  const [forceEmbed, setForceEmbed] = useState(false);

  const [showServerDropdown, setShowServerDropdown] = useState(false);
  const [episodeSearch, setEpisodeSearch] = useState("");
  const [episodeRangeIndex, setEpisodeRangeIndex] = useState(0);
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);
  const EPS_PER_PAGE = 40;


  // Sync initial episode
  useEffect(() => {
    if (initialEpisode && initialEpisode !== selectedEpisode) {
      setSelectedEpisode(initialEpisode);
    }
  }, [initialEpisode]);

  // 1. Load Episode & Provider Map
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
          (k) => !["page", "type", "mappings", "_unknownProviders", "2dhive", "anizone", "animenosub", "allmanga", "kaa"].includes(k) && data[k]?.episodes
        );
        
        // Rank providers to prefer lightning-fast native HLS over iframe embeds
        const preferred = ["animegg", "gogoanime", "anikoto", "reanime"];
        validProviders.sort((a, b) => {
          const idxA = preferred.indexOf(a);
          const idxB = preferred.indexOf(b);
          if (idxA === -1 && idxB === -1) return 0;
          if (idxA === -1) return 1;
          if (idxB === -1) return -1;
          return idxA - idxB;
        });

        if (validProviders.length > 0 && (!selectedProvider || !validProviders.includes(selectedProvider))) {
          setSelectedProvider(validProviders[0]);
        }
        setIsLoadingEpisodes(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("AniXAnime episodes error:", err);
        setIsLoadingEpisodes(false);
      });

    return () => {
      isMounted = false;
    };
  }, [anilistId]);

  const availableProviders = episodesData
    ? Object.keys(episodesData).filter(
        (k) => !["page", "type", "mappings", "_unknownProviders", "2dhive", "anizone", "animenosub", "allmanga", "kaa"].includes(k) && episodesData[k]?.episodes
      ).sort((a, b) => {
        const preferred = ["animegg", "gogoanime", "anikoto", "reanime"];
        const idxA = preferred.indexOf(a);
        const idxB = preferred.indexOf(b);
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      })
    : ["anikoto", "animegg", "gogoanime", "reanime"];

  // 2. Fetch Watch Source URL with Silent Server Failover
  useEffect(() => {
    let isMounted = true;
    if (!anilistId) return;

    setIsLoadingWatch(true);
    setWatchError(null);
    setWatchData(null);
    setForceEmbed(false);

    const fetchWithFailover = async (providers: string[], index = 0) => {
      if (index >= providers.length) {
        if (isMounted) {
          setWatchError("Stream currently unavailable on all servers.");
          setIsLoadingWatch(false);
        }
        return;
      }

      const currentProv = providers[index];
      const watchUrl = `/api/anixanime/watch/${currentProv}/${anilistId}/${audio}/${currentProv}-${selectedEpisode}`;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 second timeout for extremely fast failover
        
        const res = await fetch(watchUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data || data.error) throw new Error(data?.error || "Invalid response");

        if (isMounted) {
          if (currentProv !== selectedProvider) {
            setSelectedProvider(currentProv);
          }
          setWatchData(data);
          setIsLoadingWatch(false);
        }
      } catch (err) {
        console.warn(`Provider ${currentProv} failed, trying next...`);
        fetchWithFailover(providers, index + 1);
      }
    };

    const providersToTry = [
      selectedProvider,
      ...availableProviders.filter((p) => p !== selectedProvider),
    ];

    fetchWithFailover(providersToTry, 0);

    return () => {
      isMounted = false;
    };
  }, [selectedProvider, anilistId, selectedEpisode, audio]);

  const totalEpisodes = anime.episodes || 24;

  const rawProviderEpisodes = episodesData?.[selectedProvider]?.episodes;
  
  let providerEpisodes: any[] = [];
  if (Array.isArray(rawProviderEpisodes)) {
    providerEpisodes = rawProviderEpisodes;
  } else if (rawProviderEpisodes && typeof rawProviderEpisodes === 'object') {
    // If it's an object like { sub: [...], dub: [...] }
    if (Array.isArray(rawProviderEpisodes[audio]) && rawProviderEpisodes[audio].length > 0) {
      providerEpisodes = rawProviderEpisodes[audio];
    } else {
      providerEpisodes = Object.values(rawProviderEpisodes).filter(Array.isArray).flat();
    }
  }
  
  // Filter episodes by selected audio (sub/dub) if provider provides audio info
  let audioFilteredEpisodes = providerEpisodes;
  if (providerEpisodes.length > 0) {
    const hasAudioType = providerEpisodes.some((ep: any) => ep.audio === audio);
    if (hasAudioType) {
      audioFilteredEpisodes = providerEpisodes.filter((ep: any) => ep.audio === audio);
    } else {
      // Fallback: if user wants dub but provider only has sub (or vice versa), just show what's available
      // Filter out duplicate episode numbers by keeping the first occurrence
      const uniqueEps = new Map();
      providerEpisodes.forEach((ep: any) => {
        if (!uniqueEps.has(ep.number)) {
          uniqueEps.set(ep.number, ep);
        }
      });
      audioFilteredEpisodes = Array.from(uniqueEps.values()).sort((a: any, b: any) => a.number - b.number);
    }
  }
  
  // Create a normalized list of episodes.
  const normalizedEpisodes = audioFilteredEpisodes.length > 0 
    ? audioFilteredEpisodes
    : Array.from({ length: totalEpisodes }, (_, i) => ({
        number: i + 1,
        title: `Episode ${i + 1}`,
        image: anime.coverImage || anime.coverMedium,
        airDate: anime.year ? `${anime.year}-01-01` : ""
      }));

  // Filter based on search
  const searchedEpisodes = normalizedEpisodes.filter((ep: any) => 
    episodeSearch.trim() === "" || 
    ep.number.toString().includes(episodeSearch.trim()) ||
    (ep.title && ep.title.toLowerCase().includes(episodeSearch.toLowerCase()))
  );

  // Pagination (Ranges)
  const rangeCount = Math.ceil(normalizedEpisodes.length / EPS_PER_PAGE);
  const ranges = Array.from({ length: rangeCount }, (_, i) => ({
    start: i * EPS_PER_PAGE + 1,
    end: Math.min((i + 1) * EPS_PER_PAGE, normalizedEpisodes.length),
  }));

  // Auto-switch to the range containing the selected episode (if not searching)
  useEffect(() => {
    if (episodeSearch.trim() === "") {
      const activeRangeIdx = Math.floor((selectedEpisode - 1) / EPS_PER_PAGE);
      if (activeRangeIdx >= 0 && activeRangeIdx < rangeCount && activeRangeIdx !== episodeRangeIndex) {
        setEpisodeRangeIndex(activeRangeIdx);
      }
    }
  }, [selectedEpisode, episodeSearch, rangeCount]);

  const filteredEpisodes = episodeSearch.trim() === "" 
    ? searchedEpisodes.slice(episodeRangeIndex * EPS_PER_PAGE, (episodeRangeIndex + 1) * EPS_PER_PAGE)
    : searchedEpisodes;

  const rawStreamUrl =
    watchData?.stream_url ||
    watchData?.streamUrl ||
    watchData?.url ||
    watchData?.embed ||
    watchData?.stream ||
    watchData?.sources?.[0]?.url ||
    watchData?.streams?.[0]?.url ||
    null;

  const isFlixcloud = Boolean(rawStreamUrl && rawStreamUrl.includes("flixcloud.cc"));

  const isM3u8Stream = Boolean(
    !isFlixcloud && 
    rawStreamUrl &&
      (rawStreamUrl.includes(".m3u8") ||
        rawStreamUrl.includes(".mp4") ||
        watchData?.isM3U8 ||
        watchData?.hls)
  );

  const isEmbedPage =
    isFlixcloud ||
    (!isM3u8Stream &&
      (Boolean(watchData?.embed) ||
        !rawStreamUrl ||
        rawStreamUrl.includes("/e/") ||
        rawStreamUrl.includes("/embed/") ||
        rawStreamUrl.includes("/v/") ||
        rawStreamUrl.includes("kaastream") ||
        rawStreamUrl.includes("megaplay.buzz") ||
        Boolean(watchData?.isEmbed)));

  const isDirectVideo = !forceEmbed && (isM3u8Stream || (Boolean(rawStreamUrl) && !isEmbedPage));

  const refererUrl =
    watchData?.streams?.[0]?.headers?.Referer ||
    watchData?.referer ||
    watchData?.headers?.Referer ||
    (rawStreamUrl && rawStreamUrl.includes("animegg")
      ? "https://www.animegg.org/"
      : rawStreamUrl && rawStreamUrl.includes("vivibebe")
      ? "https://vivibebe.site/"
      : "https://flixcloud.cc/");

  // Proxied stream URL for custom HLS/video player
  const streamEmbedUrl =
    rawStreamUrl && (rawStreamUrl.includes(".m3u8") || rawStreamUrl.includes(".mp4") || isDirectVideo)
      ? typeof window !== "undefined"
        ? `${window.location.origin}/api/anixanime/proxy?url=${encodeURIComponent(rawStreamUrl)}&referer=${encodeURIComponent(refererUrl)}`
        : `/api/anixanime/proxy?url=${encodeURIComponent(rawStreamUrl)}&referer=${encodeURIComponent(refererUrl)}`
      : rawStreamUrl;

  // When forceEmbed=true, use the allServers embed URL (e.g. flixcloud embed iframe)
  const embedFallbackUrl =
    watchData?.allServers?.[0]?.embed ||
    watchData?.streams?.find((s: any) => s.type === "embed")?.url ||
    null;

  const validEmbedUrl =
    (forceEmbed || isFlixcloud ? embedFallbackUrl : null) ||
    watchData?.embed ||
    (isEmbedPage && !isFlixcloud ? rawStreamUrl : null) ||
    (watchData?.url && !watchData.url.includes(".m3u8") && !watchData.url.includes(".mp4") ? watchData.url : null);

  const rawSubtitles = watchData?.subtitles || watchData?.tracks || watchData?.captions || [];
  const subtitles = Array.isArray(rawSubtitles)
    ? rawSubtitles
        .filter((s: any) => s && (s.url || s.file || s.src))
        .map((sub: any, idx: number) => {
          const subUrl = sub.url || sub.file || sub.src || "";
          const proxiedUrl =
            subUrl && typeof window !== "undefined"
              ? `${window.location.origin}/api/anixanime/proxy?url=${encodeURIComponent(subUrl)}&referer=${encodeURIComponent(refererUrl)}`
              : subUrl;
          return {
            url: proxiedUrl,
            label: sub.language || sub.label || sub.lang || `Track ${idx + 1}`,
            srclang: sub.srclang || sub.lang || "en",
            default: Boolean(sub.default || sub.isDefault || idx === 0),
          };
        })
    : [];

  return (
    <div className="w-full bg-[#09090b] text-white">
      <div className="max-w-[1700px] mx-auto px-4 md:px-8 py-6 flex flex-col lg:flex-row gap-6">
        
        {/* MAIN VIDEO PLAYER COLUMN (LEFT/CENTER) */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          
          {/* CUSTOM ANIX VIDEO PLAYER CONTAINER */}
          <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
            {isLoadingWatch && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
                <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-3" />
                <p className="text-white text-sm font-bold tracking-wide">
                  Connecting to {PROVIDER_NAMES[selectedProvider]?.name || selectedProvider}...
                </p>
                <p className="text-white/40 text-xs mt-1">
                  Episode {selectedEpisode} &bull; {audio.toUpperCase()}
                </p>
              </div>
            )}

            {watchError && !isLoadingWatch && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-3 animate-bounce" />
                <h3 className="text-lg font-bold text-white mb-1">Server Unavailable</h3>
                <p className="text-sm text-white/60 max-w-md mb-4">{watchError}</p>
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg">
                  {availableProviders.map((p) => (
                    <button
                      key={p}
                      onClick={() => setSelectedProvider(p)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedProvider === p ? "bg-purple-600 text-white" : "bg-white/10 hover:bg-white/20 text-white/90"
                      }`}
                    >
                      Switch to {PROVIDER_NAMES[p]?.name || p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AniXCustomPlayer
              key={`player-${selectedProvider}-${selectedEpisode}-${audio}`}
              streamUrl={streamEmbedUrl || ""}
              isDirectVideo={Boolean(isDirectVideo && streamEmbedUrl)}
              embedUrl={validEmbedUrl}
              title={anime.title}
              episode={selectedEpisode}
              providerName={PROVIDER_NAMES[selectedProvider]?.name || selectedProvider}
              subtitles={subtitles}
              currentAudio={audio}
              onAudioChange={(newAudio) => setAudio(newAudio)}
              onCanPlay={() => setIsLoadingWatch(false)}
              onError={() => {
                // If direct HLS fails (e.g. IP-bound token mismatch), auto-fall back to embed iframe
                if (!forceEmbed && validEmbedUrl) {
                  setForceEmbed(true);
                }
              }}
              onEnded={() => {
                if (selectedEpisode < totalEpisodes) {
                  setSelectedEpisode((prev) => prev + 1);
                }
              }}
            />
          </div>

          {/* EPISODE TITLE HEADER */}
          <div className="flex flex-col gap-1 mt-2">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">
              EPISODE {selectedEpisode}
            </span>
            <h1 className="text-2xl font-black tracking-tight">{anime.title}</h1>
          </div>

          {/* ANIME INFO & CONTROLS ROW */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#141417] p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-black shrink-0 relative border border-white/10">
                <img src={anime.coverImage || anime.coverMedium} alt={anime.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-bold line-clamp-1">{anime.title}</h3>
                <span className="text-xs text-white/50">
                  {anime.format || "TV"} &bull; {anime.year || "2026"} &bull; {anime.episodes ? `${anime.episodes} eps` : "Ongoing"}
                </span>
              </div>
            </div>

            {/* CONTROL BUTTONS (SUB/DUB, SERVER DROPDOWN, SHARE) */}
            <div className="flex flex-wrap items-center gap-3">
              {/* SUB / DUB Toggle */}
              <div className="flex items-center bg-black/50 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setAudio("sub")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    audio === "sub" ? "bg-purple-600 text-white shadow-lg shadow-purple-600/40" : "text-white/60 hover:text-white"
                  }`}
                >
                  SUB
                </button>
                <button
                  onClick={() => setAudio("dub")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    audio === "dub" ? "bg-purple-600 text-white shadow-lg shadow-purple-600/40" : "text-white/60 hover:text-white"
                  }`}
                >
                  DUB
                </button>
              </div>

              {/* Episode Navigation Buttons */}
              <div className="flex items-center gap-1.5 ml-1">
                <button
                  onClick={() => {
                    if (selectedEpisode > 1) {
                      setWatchData(null);
                      setSelectedEpisode(selectedEpisode - 1);
                    }
                  }}
                  disabled={selectedEpisode <= 1}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedEpisode <= 1 
                      ? "opacity-50 cursor-not-allowed bg-[#09090b] border border-white/5 text-white/40" 
                      : "bg-[#09090b] border border-white/10 text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <SkipBack size={14} />
                  <span className="hidden sm:inline">Prev</span>
                </button>
                <button
                  onClick={() => {
                    if (selectedEpisode < totalEpisodes) {
                      setWatchData(null);
                      setSelectedEpisode(selectedEpisode + 1);
                    }
                  }}
                  disabled={selectedEpisode >= totalEpisodes}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedEpisode >= totalEpisodes 
                      ? "opacity-50 cursor-not-allowed bg-[#09090b] border border-white/5 text-white/40" 
                      : "bg-[#09090b] border border-white/10 text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span className="hidden sm:inline">Next</span>
                  <SkipForward size={14} />
                </button>
              </div>

              {/* Server Selection Row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mr-1">Server:</span>
                {availableProviders.map((prov) => (
                  <button
                    key={prov}
                    onClick={() => {
                      if (selectedProvider !== prov) {
                        setWatchData(null);
                        setIsLoadingWatch(true);
                        setSelectedProvider(prov);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedProvider === prov
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                        : "bg-[#09090b] border border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Server size={12} className={selectedProvider === prov ? "text-white" : "text-purple-400"} />
                    <span>{PROVIDER_NAMES[prov]?.name || prov}</span>
                    {PROVIDER_NAMES[prov]?.type && (
                      <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-md ${selectedProvider === prov ? "bg-white/20 text-white" : "bg-white/10 text-white/50"}`}>
                        {PROVIDER_NAMES[prov].type}
                      </span>
                    )}
                  </button>
                ))}
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR (EPISODE LIST & MORE LIKE THIS) */}
        <div className="w-full lg:w-96 flex flex-col gap-6 shrink-0">
          
          {/* EPISODE LIST SIDEBAR */}
          <div className="bg-[#141417] rounded-2xl p-4 border border-white/5 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-extrabold text-white line-clamp-1">{anime.title}</h3>
              <p className="text-xs text-white/50">Playing &bull; Episode {selectedEpisode}</p>
            </div>

            {/* Episode Search Bar & Range Selector */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search episode..."
                  value={episodeSearch}
                  onChange={(e) => setEpisodeSearch(e.target.value)}
                  className="w-full bg-[#09090b] border border-white/10 focus:border-purple-500 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-white/30 outline-none transition-all"
                />
              </div>
              
              {ranges.length > 0 && episodeSearch.trim() === "" && (
                <div className="relative shrink-0">
                  <button
                    onClick={() => setShowRangeDropdown(!showRangeDropdown)}
                    className={`flex items-center justify-between gap-2 bg-[#09090b] border ${showRangeDropdown ? "border-purple-500" : "border-white/10"} rounded-xl py-2 px-3 text-xs font-bold text-white outline-none cursor-pointer hover:bg-white/5 transition-all min-w-[90px]`}
                  >
                    <span>{ranges[episodeRangeIndex].start}-{ranges[episodeRangeIndex].end}</span>
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
                            episodeRangeIndex === idx ? "bg-[#251936] text-purple-300" : "text-white/80 hover:bg-white/5"
                          }`}
                        >
                          <span>{range.start}-{range.end}</span>
                          {episodeRangeIndex === idx && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-white/40 uppercase tracking-wider">
                {episodeSearch.trim() === "" && ranges[episodeRangeIndex] 
                  ? `EPISODES ${ranges[episodeRangeIndex].start}-${ranges[episodeRangeIndex].end}`
                  : `EPISODES 1-${normalizedEpisodes.length}`}
              </span>
              <button className="p-1 rounded bg-[#09090b] border border-white/10 text-white/40 hover:text-white transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              </button>
            </div>

            {/* Scrollable Episode Cards List */}
            <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredEpisodes.map((ep: any) => {
                const isSelected = selectedEpisode === ep.number;
                const epImage = ep.image || anime.coverImage || anime.coverMedium;
                const airDate = ep.airDate ? new Date(ep.airDate).toISOString().split("T")[0] : anime.year || "";
                
                return (
                  <button
                    key={ep.number}
                    onClick={() => setSelectedEpisode(ep.number)}
                    className={`flex items-center gap-3 p-2 rounded-xl border transition-all text-left group ${
                      isSelected
                        ? "bg-[#181124] border-purple-600/50 text-white shadow-[0_0_15px_rgba(147,51,234,0.1)]"
                        : "bg-[#09090b]/60 border-transparent hover:bg-white/5 text-white/80"
                    }`}
                  >
                    <div className="relative w-[110px] h-[64px] rounded-lg overflow-hidden bg-black shrink-0 border border-white/5">
                      <img src={epImage} alt={`Ep ${ep.number}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                      <span className="absolute bottom-1.5 left-1.5 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-black text-white leading-none">
                        EP {ep.number}
                      </span>
                    </div>
                    <div className="flex flex-col flex-1 min-w-0 justify-center">
                      <h4 className={`text-xs font-bold line-clamp-2 transition-colors ${isSelected ? 'text-purple-400' : 'group-hover:text-white'}`}>
                        {ep.title}
                      </h4>
                      {airDate && (
                        <span className="text-[10px] text-white/40 mt-1 font-medium">{airDate}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}

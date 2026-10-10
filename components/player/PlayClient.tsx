"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MyPlayer from "./index";
import PlayerTabs from "./PlayerTabs";
import HistoryTracker from "@/components/HistoryTracker";
import { PLAYBACK_KEY, PlaybackData, buildPlayHref, parsePlaySearchParams } from "@/lib/playback";
import { getPlayPageData } from "@/app/actions/play";
import { useStore } from "@/store/useStore";

export default function PlayClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<PlaybackData | null>(null);
  const [ready, setReady] = useState(false);
  const handled = useRef(false);
  const [details, setDetails] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [currentEpisodeData, setCurrentEpisodeData] = useState<any>(null);
  const [mappedSimilar, setMappedSimilar] = useState<any[]>([]);
  const [mappedMovie, setMappedMovie] = useState<any>(null);
  const [detailsLoaded, setDetailsLoaded] = useState(false);
  const [detailsError, setDetailsError] = useState(false);

  const loadPlayData = useCallback(async (parsed: PlaybackData) => {
    setDetails(null);
    setEpisodes([]);
    setCurrentEpisodeData(null);
    setMappedSimilar([]);
    setMappedMovie(null);
    setDetailsLoaded(false);
    setDetailsError(false);

    try {
      const result = await getPlayPageData(parsed.tmdbId, parsed.mediaType, parsed.season, parsed.episode);
      if (result) {
        setDetails(result.tmdbData);
        setEpisodes(result.episodes);
        setCurrentEpisodeData(result.currentEpisodeData);
        setMappedSimilar(result.mappedSimilar);
        setMappedMovie(result.mappedMovie);
      } else {
        setDetailsError(true);
      }
    } catch {
      setDetailsError(true);
    }
    setDetailsLoaded(true);
  }, []);

  const handleNavigate = useCallback((newData: PlaybackData) => {
    sessionStorage.setItem(PLAYBACK_KEY, JSON.stringify(newData));
    // URL-addressable episode changes: shareable + back-button safe.
    router.replace(buildPlayHref(newData));
    setData(newData);
    loadPlayData(newData);
    window.dispatchEvent(new CustomEvent("playback-change"));
  }, [loadPlayData, router]);

  const addToContinueWatching = useStore((s) => s.addToContinueWatching);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    // Prefer shareable URL params, fall back to legacy sessionStorage flow.
    const fromUrl = parsePlaySearchParams((key) => searchParams.get(key));
    if (fromUrl) {
      sessionStorage.setItem(PLAYBACK_KEY, JSON.stringify(fromUrl));
      setData(fromUrl);
      loadPlayData(fromUrl);
      setReady(true);
      return;
    }

    const raw = sessionStorage.getItem(PLAYBACK_KEY);
    if (!raw) {
      router.replace("/");
      return;
    }
    try {
      const parsed: PlaybackData = JSON.parse(raw);
      setData(parsed);
      loadPlayData(parsed);
    } catch {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [router, searchParams, loadPlayData]);

  // Follow URL changes after mount (header season/episode switches,
  // back/forward buttons) without a full reload.
  useEffect(() => {
    if (!ready) return;
    const fromUrl = parsePlaySearchParams((key) => searchParams.get(key));
    if (!fromUrl) return;
    setData((current) => {
      const changed =
        !current ||
        current.tmdbId !== fromUrl.tmdbId ||
        current.mediaType !== fromUrl.mediaType ||
        current.season !== fromUrl.season ||
        current.episode !== fromUrl.episode;
      if (changed) {
        sessionStorage.setItem(PLAYBACK_KEY, JSON.stringify(fromUrl));
        loadPlayData(fromUrl);
        window.dispatchEvent(new CustomEvent("playback-change"));
        return fromUrl;
      }
      return current;
    });
  }, [searchParams, ready, loadPlayData]);

  useEffect(() => {
    if (!data || !mappedMovie) return;
    addToContinueWatching({
      tmdbId: data.tmdbId,
      publicId: mappedMovie.publicId,
      mediaType: data.mediaType,
      title: mappedMovie.title,
      posterUrl: mappedMovie.thumbnailUrl,
      backdropUrl: mappedMovie.backdropUrl,
      season: data.season,
      episode: data.episode,
      lastWatchedAt: Date.now(),
    });
  }, [data, mappedMovie, addToContinueWatching]);

  if (!ready || !data) {
    return (
      <div className="flex flex-col min-h-screen bg-[#09090b] items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#09090b] relative pt-20">
      {mappedMovie && <HistoryTracker movie={mappedMovie} />}
      <MyPlayer
        src=""
        title=""
        thumbnails={[]}
        tmdbId={data.tmdbId}
        mediaType={data.mediaType}
        season={data.season}
        episode={data.episode}
      />
      {detailsLoaded && !detailsError && details && (
        <div id="episodes" className="w-full bg-[#0a0a0a] text-white pt-8 px-4 md:px-14 xl:px-20">
          <PlayerTabs
            type={data.mediaType}
            episodes={episodes}
            currentEpisodeData={currentEpisodeData}
            season={data.season}
            episode={data.episode}
            mappedSimilar={mappedSimilar}
            tmdbId={data.tmdbId}
            details={details}
            onNavigate={handleNavigate}
          />
        </div>
      )}
      {detailsLoaded && detailsError && (
        <div id="episodes" className="w-full bg-[#0a0a0a] text-white pt-8 px-4 md:px-14 xl:px-20">
          <p className="text-white/50 text-sm py-8">Failed to load details.</p>
        </div>
      )}
    </div>
  );
}

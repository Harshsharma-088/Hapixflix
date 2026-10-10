"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Monitor,
  PictureInPicture2,
  RotateCcw,
  RotateCw,
  Loader2,
  Sparkles,
  Check,
  ChevronUp,
  ChevronLeft,
  AlertCircle
} from "lucide-react";

export interface SubtitleTrack {
  url: string;
  label: string;
  srclang?: string;
  default?: boolean;
}

export interface AudioTrack {
  id: number | string;
  name: string;
  lang?: string;
}

interface AniXCustomPlayerProps {
  streamUrl: string;
  isDirectVideo: boolean;
  embedUrl?: string | null;
  title: string;
  episode: number;
  providerName: string;
  subtitles?: SubtitleTrack[];
  audioTracks?: AudioTrack[];
  currentAudio?: string;
  onAudioChange?: (audio: "sub" | "dub") => void;
  onEnded?: () => void;
  onCanPlay?: () => void;
  onError?: () => void;
}

export default function AniXCustomPlayer({
  streamUrl,
  isDirectVideo,
  embedUrl,
  title,
  episode,
  providerName,
  subtitles = [],
  audioTracks: initialAudioTracks = [],
  currentAudio = "sub",
  onAudioChange,
  onEnded,
  onCanPlay,
  onError,
}: AniXCustomPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);

  // Player States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTheatre, setIsTheatre] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<"menu" | "speed" | "quality" | "audio" | "subtitles">("menu");

  const [qualities, setQualities] = useState<Array<{ id: number; height: number }>>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);

  const [hlsAudioTracks, setHlsAudioTracks] = useState<AudioTrack[]>([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<number | string>(-1);
  const [selectedSubtitle, setSelectedSubtitle] = useState<number>(0);
  const [hlsSubtitleTracks, setHlsSubtitleTracks] = useState<any[]>([]);
  const [selectedHlsSubtitle, setSelectedHlsSubtitle] = useState<number | string>(-1);
  const [subtitlePreset, setSubtitlePreset] = useState("classic");

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<any>(null);

  // 0. Safety Timeout to prevent stuck loading screen (15s for slow crypto providers like ReAnime)
  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 15000);
    return () => clearTimeout(timer);
  }, [isLoading, streamUrl]);

  // 1. Initialize Hls.js or Native Video Engine
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Always destroy old HLS instance and stop video immediately
    if (hlsRef.current) {
      try { hlsRef.current.destroy(); } catch {}
      hlsRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.removeAttribute("src");
        videoRef.current.load();
      } catch {}
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    // If no URL yet (fetching new server data), show loading and wait
    if (!isDirectVideo || !streamUrl) {
      setIsLoading(!isDirectVideo ? false : true);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    const initHls = () => {
      const Hls = (window as any).Hls;
      if (videoRef.current) {
        if (hlsRef.current) {
          try { hlsRef.current.destroy(); } catch {}
          hlsRef.current = null;
        }

        const isHlsStream = streamUrl.includes(".m3u8") || streamUrl.includes("m3u8");

        if (!isHlsStream) {
          const video = videoRef.current;
          video.src = streamUrl;
          video.load();

          let playAttempted = false;
          const startPlay = () => {
            if (playAttempted) return;
            playAttempted = true;
            setIsLoading(false);
            if (onCanPlay) onCanPlay();
            video
              .play()
              .then(() => {
                setIsPlaying(true);
              })
              .catch(() => {
                setIsPlaying(false);
              });
          };

          video.addEventListener("canplay", startPlay, { once: true });
          video.addEventListener("loadeddata", startPlay, { once: true });
          return;
        }

        if (Hls && Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
          });
          hlsRef.current = hls;

          hls.loadSource(streamUrl);
          hls.attachMedia(videoRef.current);

          hls.on(Hls.Events.MANIFEST_PARSED, (_: any, data: any) => {
            setIsLoading(false);
            if (data?.levels) {
              const qualityLevels = data.levels.map((lvl: any, index: number) => ({
                id: index,
                height: lvl.height || 720,
              }));
              setQualities(qualityLevels);
            }
            if (data?.audioTracks) {
              setHlsAudioTracks(
                data.audioTracks.map((tr: any) => ({
                  id: tr.id,
                  name: tr.name || tr.lang || `Audio Track ${tr.id + 1}`,
                  lang: tr.lang,
                }))
              );
            }
            if (data?.subtitleTracks) {
              setHlsSubtitleTracks(
                data.subtitleTracks.map((tr: any) => ({
                  id: tr.id,
                  name: tr.name || tr.lang || `Subtitle Track ${tr.id + 1}`,
                }))
              );
            }
            if (onCanPlay) onCanPlay();
            videoRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
          });

          hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (_: any, data: any) => {
            if (data?.subtitleTracks) {
              setHlsSubtitleTracks(
                data.subtitleTracks.map((tr: any) => ({
                  id: tr.id,
                  name: tr.name || tr.lang || `Subtitle Track ${tr.id + 1}`,
                }))
              );
            }
          });

          hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_: any, data: any) => {
            if (data?.audioTracks) {
              setHlsAudioTracks(
                data.audioTracks.map((tr: any) => ({
                  id: tr.id,
                  name: tr.name || tr.lang || `Audio Track ${tr.id + 1}`,
                  lang: tr.lang,
                }))
              );
            }
          });

          hls.on(Hls.Events.ERROR, (_: any, data: any) => {
            if (data.fatal) {
              if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                hls.startLoad();
              } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError();
              } else {
                setHasError(true);
                if (onError) onError();
              }
            }
          });
        } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
          videoRef.current.src = streamUrl;
          videoRef.current.addEventListener("loadedmetadata", () => {
            setIsLoading(false);
            if (onCanPlay) onCanPlay();
            videoRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
          });
        }
      }
    };

    if (!(window as any).Hls) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
      script.async = true;
      script.onload = initHls;
      document.head.appendChild(script);
    } else {
      initHls();
    }

    return () => {
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch {}
        hlsRef.current = null;
      }
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.removeAttribute("src");
          videoRef.current.load();
        } catch {}
      }
    };
  }, [streamUrl, isDirectVideo]);

  // Video Event Listeners
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    videoRef.current.muted = newMuted;
  };

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSettings(false);
  };

  const changeQuality = (qualityId: number) => {
    setCurrentQuality(qualityId);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = qualityId;
    }
    setShowSettings(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const togglePiP = async () => {
    if (videoRef.current && document.pictureInPictureEnabled) {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    }
  };

  const handleMouseMove = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      // Use the state updater function approach to always get the latest state
      setShowSettings((prevShowSettings) => {
        if (!prevShowSettings) {
          // If settings are NOT open, check isPlaying
          setIsPlaying((prevIsPlaying) => {
            if (prevIsPlaying) setControlsVisible(false);
            return prevIsPlaying;
          });
        }
        return prevShowSettings;
      });
    }, 3000);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Skip 10 seconds forward/backward
  const skipTime = (seconds: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(
        Math.max(0, videoRef.current.currentTime + seconds),
        duration
      );
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }
      
      switch (e.key) {
        case " ":
        case "k":
        case "K":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          skipTime(10);
          break;
        case "ArrowLeft":
          e.preventDefault();
          skipTime(-10);
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
        case "M":
          e.preventDefault();
          toggleMute();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [duration]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (isPlaying && !showSettings) setControlsVisible(false);
      }}
      className={`relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 group select-none ${
        isTheatre ? "max-h-[85vh]" : ""
      }`}
    >
      {/* 1. EMBED IFRAME FALLBACK */}
      {!isDirectVideo && (embedUrl || streamUrl) && (
        <iframe
          src={embedUrl || streamUrl}
          className="absolute inset-0 w-full h-full border-none z-10"
          allowFullScreen
          frameBorder="0"
          scrolling="no"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture"
        />
      )}

      {/* 2. CUSTOM HTML5 HLS VIDEO ENGINE */}
      {isDirectVideo && (
        <>
          <style dangerouslySetInnerHTML={{ __html: `
            .subtitle-preset-classic::cue {
              background: transparent !important;
              color: white !important;
              text-shadow: 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 2px 0 #000, 2px 0 0 #000, 0 -2px 0 #000, -2px 0 0 #000 !important;
            }
            .subtitle-preset-netflix::cue {
              background: transparent !important;
              color: white !important;
              text-shadow: 1px 1px 3px rgba(0,0,0,0.8) !important;
              font-family: "Helvetica Neue", Helvetica, Arial, sans-serif !important;
            }
            .subtitle-preset-crunchyroll::cue {
              background: rgba(0, 0, 0, 0.75) !important;
              color: white !important;
              font-family: Arial, Helvetica, sans-serif !important;
              text-shadow: none !important;
            }
            .subtitle-preset-youtube::cue {
              background: rgba(8, 8, 8, 0.75) !important;
              color: white !important;
              text-shadow: none !important;
            }
            .subtitle-preset-anime::cue {
              background: transparent !important;
              color: #FFFF00 !important;
              text-shadow: 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 2px 0 #000, 2px 0 0 #000, 0 -2px 0 #000, -2px 0 0 #000 !important;
            }
          `}} />

          <video
            ref={videoRef}
            crossOrigin="anonymous"
            onTimeUpdate={handleTimeUpdate}
            onLoadedData={() => setIsLoading(false)}
            onCanPlay={() => {
              setIsLoading(false);
              if (onCanPlay) onCanPlay();
            }}
            onPlay={() => {
              setIsLoading(false);
              setIsPlaying(true);
            }}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              setIsPlaying(false);
              if (onEnded) onEnded();
            }}
            onClick={togglePlay}
            className={`absolute inset-0 w-full h-full object-contain cursor-pointer z-0 subtitle-preset-${subtitlePreset}`}
          >
            {subtitles &&
              subtitles.map((sub, idx) => (
                <track
                  key={sub.url || idx}
                  kind="subtitles"
                  src={sub.url}
                  srcLang={sub.srclang || "en"}
                  label={sub.label || "English"}
                  default={sub.default || idx === 0}
                />
              ))}
          </video>

          {/* Permanent Watermark */}
          <div className="absolute top-4 right-4 md:top-6 md:right-6 z-40 pointer-events-none select-none">
            <img src="/logo.svg" alt="Hapixflix" className="h-5 md:h-6 w-auto opacity-35 drop-shadow-md" />
          </div>

          {/* Loading Spinner Overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-3" />
              <p className="text-white text-sm font-bold tracking-wide">
                Loading Stream from {providerName}...
              </p>
              <p className="text-white/40 text-xs mt-1">
                {title} &bull; Episode {episode}
              </p>
            </div>
          )}

          {/* Error Banner Overlay */}
          {hasError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-3 animate-bounce" />
              <h3 className="text-lg font-bold text-white mb-1">Playback Error</h3>
              <p className="text-xs text-white/60 max-w-md">
                Stream format is unsupported or restricted by provider. Try switching server below.
              </p>
            </div>
          )}

          {/* CUSTOM PLAYER CONTROLS OVERLAY */}
          <div
            className={`absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-transparent to-black/40 flex flex-col justify-between p-4 md:p-6 transition-opacity duration-300 ${
              controlsVisible || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            {/* Top Bar: Title & Server Name */}
            <div className="flex items-center justify-between text-xs font-bold text-white/80">
              <div className="flex items-center gap-2">
                <span className="bg-purple-600 px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-wider text-white">
                  EP {episode}
                </span>
                <span className="line-clamp-1">{title}</span>
              </div>
              <div className="w-10"></div> {/* Spacer to balance layout */}
            </div>

            {/* Middle Quick Play/Pause Center Action */}
            <div 
              className="flex-1 flex items-center justify-center gap-12 cursor-pointer relative"
              onClick={togglePlay}
            >
              {/* Double Click Zones */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-1/3 z-10" 
                onDoubleClick={(e) => { e.stopPropagation(); skipTime(-10); }}
                onClick={(e) => { e.stopPropagation(); togglePlay(e); }}
              />
              <div 
                className="absolute right-0 top-0 bottom-0 w-1/3 z-10" 
                onDoubleClick={(e) => { e.stopPropagation(); skipTime(10); }}
                onClick={(e) => { e.stopPropagation(); togglePlay(e); }}
              />

              <button
                onClick={(e) => skipTime(-10, e)}
                className="p-3 text-white hover:text-purple-400 transition-colors active:scale-90 drop-shadow-lg z-20"
              >
                <RotateCcw size={32} />
              </button>

              <button
                onClick={togglePlay}
                className="p-3 text-white hover:text-purple-400 transition-colors active:scale-95 drop-shadow-lg z-20"
              >
                {isPlaying ? <Pause size={48} className="fill-current" /> : <Play size={48} className="fill-current" />}
              </button>

              <button
                onClick={(e) => skipTime(10, e)}
                className="p-3 text-white hover:text-purple-400 transition-colors active:scale-90 drop-shadow-lg z-20"
              >
                <RotateCw size={32} />
              </button>
            </div>

            {/* Bottom Controls Bar */}
            <div className="flex flex-col gap-2">
              {/* Progress Slider Timeline */}
              <div className="relative flex items-center group/timeline">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  style={{
                    background: `linear-gradient(to right, #9333ea ${
                      ((currentTime || 0) / (duration || 1)) * 100
                    }%, rgba(255, 255, 255, 0.2) ${
                      ((currentTime || 0) / (duration || 1)) * 100
                    }%)`,
                  }}
                  className="w-full h-1.5 hover:h-2.5 rounded-lg appearance-none cursor-pointer accent-purple-500 transition-all"
                />
              </div>

              {/* Control Buttons Row */}
              <div className="flex items-center justify-between text-white text-xs font-semibold">
                <div className="flex items-center gap-4">
                  {/* Play/Pause */}
                  <button onClick={togglePlay} className="hover:text-purple-400 transition-colors">
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                  </button>

                  {/* Volume Control */}
                  <div className="flex items-center gap-2 group/vol">
                    <button onClick={toggleMute} className="hover:text-purple-400 transition-colors">
                      {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-600 opacity-80 group-hover/vol:opacity-100 transition-opacity"
                    />
                  </div>

                  {/* Time Counter */}
                  <span className="text-[11px] font-mono text-white/70">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Settings Menu Toggle */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${
                        showSettings ? "text-purple-400" : "text-white/80"
                      }`}
                    >
                      <Settings size={18} />
                    </button>

                    {/* Settings Dropdown Box */}
                    {showSettings && (
                      <div className="absolute right-0 bottom-full mb-3 w-48 max-h-[250px] overflow-y-auto custom-scrollbar bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1 text-xs sm:w-56 sm:max-h-[300px]">
                        {activeTab === "menu" && (
                          <>
                            <button
                              onClick={() => setActiveTab("speed")}
                              className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors"
                            >
                              <span>Speed</span>
                              <span className="text-purple-400 font-bold">{playbackRate}x</span>
                            </button>

                            {qualities.length > 0 && (
                              <button
                                onClick={() => setActiveTab("quality")}
                                className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors"
                              >
                                <span>Quality</span>
                                <span className="text-purple-400 font-bold">
                                  {currentQuality === -1 ? "Auto" : `${qualities[currentQuality]?.height}p`}
                                </span>
                              </button>
                            )}

                            <button
                              onClick={() => setActiveTab("audio")}
                              className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors"
                            >
                              <span>Audio Track</span>
                              <span className="text-purple-400 font-bold uppercase">{currentAudio}</span>
                            </button>

                            {(subtitles.length > 0 || hlsSubtitleTracks.length > 0) && (
                              <button
                                onClick={() => setActiveTab("subtitles")}
                                className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors"
                              >
                                <span>Subtitles</span>
                                <span className="text-purple-400 font-bold">
                                  {subtitles[selectedSubtitle]?.label || "On"}
                                </span>
                              </button>
                            )}
                          </>
                        )}

                        {activeTab === "speed" && (
                          <div className="flex flex-col gap-1">
                            <button 
                              onClick={() => setActiveTab("menu")}
                              className="flex items-center gap-2 px-2 pb-1 text-white/60 hover:text-white transition-colors"
                            >
                              <ChevronLeft size={16} />
                              <span className="text-[10px] font-bold uppercase">Playback Speed</span>
                            </button>
                            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                              <button
                                key={rate}
                                onClick={() => changeSpeed(rate)}
                                className={`flex items-center justify-between p-2 rounded-xl text-left font-semibold ${
                                  playbackRate === rate ? "bg-purple-600 text-white" : "hover:bg-white/5 text-white/80"
                                }`}
                              >
                                <span>{rate}x</span>
                                {playbackRate === rate && <Check size={14} />}
                              </button>
                            ))}
                          </div>
                        )}

                        {activeTab === "quality" && (
                          <div className="flex flex-col gap-1">
                            <button 
                              onClick={() => setActiveTab("menu")}
                              className="flex items-center gap-2 px-2 pb-1 text-white/60 hover:text-white transition-colors"
                            >
                              <ChevronLeft size={16} />
                              <span className="text-[10px] font-bold uppercase">Quality</span>
                            </button>
                            <button
                              onClick={() => changeQuality(-1)}
                              className={`flex items-center justify-between p-2 rounded-xl text-left font-semibold ${
                                currentQuality === -1 ? "bg-purple-600 text-white" : "hover:bg-white/5 text-white/80"
                              }`}
                            >
                              <span>Auto</span>
                              {currentQuality === -1 && <Check size={14} />}
                            </button>
                            {qualities.map((q) => (
                              <button
                                key={q.id}
                                onClick={() => changeQuality(q.id)}
                                className={`flex items-center justify-between p-2 rounded-xl text-left font-semibold ${
                                  currentQuality === q.id ? "bg-purple-600 text-white" : "hover:bg-white/5 text-white/80"
                                }`}
                              >
                                <span>{q.height}p</span>
                                {currentQuality === q.id && <Check size={14} />}
                              </button>
                            ))}
                          </div>
                        )}

                        {activeTab === "audio" && (
                          <div className="flex flex-col gap-1">
                            <button 
                              onClick={() => setActiveTab("menu")}
                              className="flex items-center gap-2 px-2 pb-1 text-white/60 hover:text-white transition-colors"
                            >
                              <ChevronLeft size={16} />
                              <span className="text-[10px] font-bold uppercase">Audio Track</span>
                            </button>
                            <button
                              onClick={() => {
                                if (onAudioChange) onAudioChange("sub");
                                setShowSettings(false);
                              }}
                              className={`flex items-center justify-between p-2 rounded-xl text-left font-semibold ${
                                currentAudio === "sub" ? "bg-purple-600 text-white" : "hover:bg-white/5 text-white/80"
                              }`}
                            >
                              <span>Japanese (Sub)</span>
                              {currentAudio === "sub" && <Check size={14} />}
                            </button>
                            <button
                              onClick={() => {
                                if (onAudioChange) onAudioChange("dub");
                                setShowSettings(false);
                              }}
                              className={`flex items-center justify-between p-2 rounded-xl text-left font-semibold ${
                                currentAudio === "dub" ? "bg-purple-600 text-white" : "hover:bg-white/5 text-white/80"
                              }`}
                            >
                              <span>English (Dub)</span>
                              {currentAudio === "dub" && <Check size={14} />}
                            </button>
                            {hlsAudioTracks.map((tr) => (
                              <button
                                key={tr.id}
                                onClick={() => {
                                  setSelectedAudioTrack(tr.id);
                                  if (hlsRef.current) hlsRef.current.audioTrack = tr.id;
                                  setShowSettings(false);
                                }}
                                className={`flex items-center justify-between p-2 rounded-xl text-left font-semibold ${
                                  selectedAudioTrack === tr.id ? "bg-purple-600 text-white" : "hover:bg-white/5 text-white/80"
                                }`}
                              >
                                <span>{tr.name}</span>
                                {selectedAudioTrack === tr.id && <Check size={14} />}
                              </button>
                            ))}
                          </div>
                        )}

                        {activeTab === "subtitles" && (
                          <div className="flex flex-col gap-1">
                            <button 
                              onClick={() => setActiveTab("menu")}
                              className="flex items-center gap-2 px-2 pb-1 text-white/60 hover:text-white transition-colors"
                            >
                              <ChevronLeft size={16} />
                              <span className="text-[10px] font-bold uppercase">Subtitles</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedSubtitle(-1);
                                setSelectedHlsSubtitle(-1);
                                if (hlsRef.current) hlsRef.current.subtitleTrack = -1;
                                if (videoRef.current && videoRef.current.textTracks) {
                                  for (let i = 0; i < videoRef.current.textTracks.length; i++) {
                                    videoRef.current.textTracks[i].mode = "disabled";
                                  }
                                }
                                setShowSettings(false);
                              }}
                              className={`flex items-center justify-between p-2 rounded-xl text-left font-semibold ${
                                selectedSubtitle === -1 && selectedHlsSubtitle === -1 ? "bg-purple-600 text-white" : "hover:bg-white/5 text-white/80"
                              }`}
                            >
                              <span>Off</span>
                              {selectedSubtitle === -1 && selectedHlsSubtitle === -1 && <Check size={14} />}
                            </button>

                            {/* External WebVTT Subtitles */}
                            {subtitles.map((sub, idx) => (
                              <button
                                key={sub.url || idx}
                                onClick={() => {
                                  setSelectedSubtitle(idx);
                                  setSelectedHlsSubtitle(-1);
                                  if (hlsRef.current) hlsRef.current.subtitleTrack = -1;
                                  if (videoRef.current && videoRef.current.textTracks) {
                                    for (let i = 0; i < videoRef.current.textTracks.length; i++) {
                                      videoRef.current.textTracks[i].mode = i === idx ? "showing" : "disabled";
                                    }
                                  }
                                  setShowSettings(false);
                                }}
                                className={`flex items-center justify-between p-2 rounded-xl text-left font-semibold ${
                                  selectedSubtitle === idx ? "bg-purple-600 text-white" : "hover:bg-white/5 text-white/80"
                                }`}
                              >
                                <span>{sub.label}</span>
                                {selectedSubtitle === idx && <Check size={14} />}
                              </button>
                            ))}

                            {/* Native HLS Subtitles */}
                            {hlsSubtitleTracks.map((tr) => (
                              <button
                                key={`hls-${tr.id}`}
                                onClick={() => {
                                  setSelectedHlsSubtitle(tr.id);
                                  setSelectedSubtitle(-1);
                                  if (videoRef.current && videoRef.current.textTracks) {
                                    for (let i = 0; i < videoRef.current.textTracks.length; i++) {
                                      videoRef.current.textTracks[i].mode = "disabled";
                                    }
                                  }
                                  if (hlsRef.current) hlsRef.current.subtitleTrack = tr.id;
                                  setShowSettings(false);
                                }}
                                className={`flex items-center justify-between p-2 rounded-xl text-left font-semibold ${
                                  selectedHlsSubtitle === tr.id ? "bg-purple-600 text-white" : "hover:bg-white/5 text-white/80"
                                }`}
                              >
                                <span>{tr.name}</span>
                                {selectedHlsSubtitle === tr.id && <Check size={14} />}
                              </button>
                            ))}

                            <div className="w-full h-px bg-white/10 my-1"></div>
                            <span className="text-[10px] text-white/40 px-2 font-bold uppercase mt-1">Subtitle Style</span>
                            
                            {[
                              { id: "classic", label: "Classic (Default)" },
                              { id: "netflix", label: "Modern (Netflix Style)" },
                              { id: "crunchyroll", label: "Standard (Crunchyroll Style)" },
                              { id: "youtube", label: "Solid (YouTube Style)" },
                              { id: "anime", label: "Retro Anime (Yellow)" }
                            ].map(preset => (
                              <button
                                key={preset.id}
                                onClick={() => {
                                  setSubtitlePreset(preset.id);
                                  // Force instant browser repaint of ::cue styles
                                  if (videoRef.current && videoRef.current.textTracks) {
                                    for (let i = 0; i < videoRef.current.textTracks.length; i++) {
                                      if (videoRef.current.textTracks[i].mode === "showing") {
                                        videoRef.current.textTracks[i].mode = "hidden";
                                        setTimeout(() => {
                                          if (videoRef.current) videoRef.current.textTracks[i].mode = "showing";
                                        }, 10);
                                      }
                                    }
                                  }
                                }}
                                className={`flex items-center justify-between p-2 rounded-xl text-left font-semibold ${
                                  subtitlePreset === preset.id ? "bg-purple-600 text-white" : "hover:bg-white/5 text-white/80"
                                }`}
                              >
                                <span>{preset.label}</span>
                                {subtitlePreset === preset.id && <Check size={14} />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Picture-in-Picture */}
                  <button onClick={togglePiP} className="hover:text-purple-400 transition-colors p-1.5">
                    <PictureInPicture2 size={18} />
                  </button>

                  {/* Fullscreen */}
                  <button onClick={toggleFullscreen} className="hover:text-purple-400 transition-colors p-1.5">
                    {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

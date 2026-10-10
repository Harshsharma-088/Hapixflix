"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Server, ChevronRight, Loader2 } from "lucide-react";
import { ALL_SERVERS, rankScore } from "@/lib/servers";
import { checkServers } from "@/app/actions/servers";

interface ThumbnailEntry {
  url: string;
  startTime: number;
  endTime: number;
}

interface MyPlayerProps {
  src: string;
  title: string;
  thumbnails: ThumbnailEntry[];
  tmdbId?: string;
  mediaType?: "tv" | "movie";
  season?: number;
  episode?: number;
}

type HealthState = "checking" | "working" | "dead";
interface HealthEntry {
  state: HealthState;
  latencyMs?: number;
}

const HEALTH_CACHE_TTL_MS = 10 * 60 * 1000;

function MyPlayer({ src, title, thumbnails, tmdbId, mediaType, season = 1, episode = 1 }: MyPlayerProps) {
  const [selectedName, setSelectedName] = useState<string>(ALL_SERVERS[0].name);
  const [isMouseIdle, setIsMouseIdle] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [health, setHealth] = useState<Record<string, HealthEntry>>({});
  const [checking, setChecking] = useState(false);
  const [runId, setRunId] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isTv = mediaType === "tv";
  const cacheKey = tmdbId ? `hapixflix_server_health_${tmdbId}_${mediaType}_${season}_${episode}` : null;

  // Shortlist + rank: working servers only, Hindi + low-ads first, then latency.
  const ordered = useMemo(() => {
    return [...ALL_SERVERS].sort((a, b) => {
      const ha = health[a.name];
      const hb = health[b.name];
      const sa = ha?.state === "dead" ? 1 : 0;
      const sb = hb?.state === "dead" ? 1 : 0;
      if (sa !== sb) return sa - sb;
      return rankScore(a, ha?.latencyMs) - rankScore(b, hb?.latencyMs);
    });
  }, [health]);

  const visible = useMemo(() => {
    const working = ordered.filter((s) => health[s.name]?.state === "working");
    // While checking, show priority order (Hindi first). After the check,
    // show ONLY servers with a playable stream. If none work, fall back.
    if (working.length > 0) return working;
    const anyDead = Object.values(health).some((h) => h.state === "dead");
    if (!checking && anyDead) {
      return ordered.filter((s) => health[s.name]?.state !== "dead");
    }
    return ordered;
  }, [ordered, health, checking]);

  const selectedDef = useMemo(
    () => ALL_SERVERS.find((s) => s.name === selectedName) ?? visible[0] ?? ALL_SERVERS[0],
    [selectedName, visible]
  );
  const workingCount = useMemo(
    () => Object.values(health).filter((h) => h.state === "working").length,
    [health]
  );
  const deadCount = useMemo(
    () => Object.values(health).filter((h) => h.state === "dead").length,
    [health]
  );

  // Content-aware check: server validates each embed serves a playable page
  // for THIS title. One roundtrip, cached server-side + in session.
  useEffect(() => {
    if (!tmdbId) return;
    let cancelled = false;

    if (cacheKey) {
      try {
        const raw = sessionStorage.getItem(cacheKey);
        if (raw) {
          const cached = JSON.parse(raw) as { at: number; health: Record<string, HealthEntry> };
          if (Date.now() - cached.at < HEALTH_CACHE_TTL_MS && cached.health) {
            setHealth(cached.health);
            const firstWorking = [...ALL_SERVERS]
              .sort((a, b) => rankScore(a, cached.health[a.name]?.latencyMs) - rankScore(b, cached.health[b.name]?.latencyMs))
              .find((s) => cached.health[s.name]?.state === "working");
            if (firstWorking) setSelectedName(firstWorking.name);
            setIsLoading(true);
            return;
          }
        }
      } catch {
        // Corrupt cache -> fall through to fresh check.
      }
    }

    setChecking(true);
    setIsLoading(true);
    const initial: Record<string, HealthEntry> = {};
    for (const s of ALL_SERVERS) initial[s.name] = { state: "checking" };
    setHealth(initial);

    (async () => {
      try {
        const result = await checkServers(tmdbId, mediaType ?? "movie", season, episode);
        if (cancelled) return;
        const next: Record<string, HealthEntry> = {};
        for (const r of result) {
          next[r.name] = r.working
            ? { state: "working", latencyMs: r.latencyMs }
            : { state: "dead", latencyMs: r.latencyMs };
        }
        setHealth(next);
        const ranked = [...ALL_SERVERS].sort(
          (a, b) => rankScore(a, next[a.name]?.latencyMs) - rankScore(b, next[b.name]?.latencyMs)
        );
        const best = ranked.find((s) => next[s.name]?.state === "working") ?? ranked[0];
        if (best) setSelectedName(best.name);
        if (cacheKey) {
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), health: next }));
          } catch {
            // Storage full / blocked -> check still works, just uncached.
          }
        }
      } catch {
        if (!cancelled) {
          // Check service failed: show all servers rather than a blank list.
          setHealth({});
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
          setIsLoading(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tmdbId, mediaType, season, episode, runId]);

  useEffect(() => {
    setIsLoading(true);
  }, [selectedName]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setIsMouseIdle(false);
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsMouseIdle(true), 3000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  // If the active iframe errors, mark it dead and auto-advance to the next
  // working server so the user only ever sees players with content.
  const handleIframeError = () => {
    setHealth((prev) => {
      if (prev[selectedDef.name]?.state === "dead") return prev;
      const next: Record<string, HealthEntry> = { ...prev, [selectedDef.name]: { state: "dead" } };
      const ranked = [...ALL_SERVERS].sort(
        (a, b) => rankScore(a, next[a.name]?.latencyMs) - rankScore(b, next[b.name]?.latencyMs)
      );
      const fallback = ranked.find((s) => next[s.name]?.state === "working");
      if (fallback && fallback.name !== selectedDef.name) {
        setSelectedName(fallback.name);
        setIsLoading(true);
      }
      return next;
    });
  };

  const recheck = () => {
    if (cacheKey) {
      try {
        sessionStorage.removeItem(cacheKey);
      } catch {
        // Ignore storage errors.
      }
    }
    // Bump runId: the check effect re-runs (it resets health/checking itself).
    setRunId((n) => n + 1);
  };

  return (
    <div className="flex flex-col w-full h-full flex-1 relative bg-black">

      {/* Player Frame */}
      <div className="relative w-full flex-1 min-h-[40vh] md:min-h-[85vh] bg-black overflow-hidden group">

        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black">
            <Loader2 className="w-10 h-10 text-red-500 animate-spin mb-3" />
            <p className="text-white/50 text-xs font-medium">Loading {selectedDef.name}...</p>
          </div>
        )}
        <iframe
          key={`${selectedDef.name}-${tmdbId}-${mediaType}-${season}-${episode}`}
          ref={iframeRef}
          src={tmdbId ? selectedDef.url(tmdbId, isTv, season, episode) : ""}
          onLoad={() => setIsLoading(false)}
          onError={handleIframeError}
          className="absolute inset-0 w-full h-full border-none z-10"
          allowFullScreen
          frameBorder="0"
          scrolling="no"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture"
          referrerPolicy="origin"
        ></iframe>
      </div>

      {/* Control Bar (Servers & Details) */}
      <div className="bg-[#0f0f0f] border-t border-white/5 w-full flex flex-col justify-center px-4 md:px-8 py-3 z-20">

        {/* Top Row: Sources & Share */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative">
          <div className="flex items-center space-x-3 overflow-x-auto scrollbar-hide w-full md:w-auto pr-8">
            <div className="flex items-center text-white/50 shrink-0 font-medium">
              <Server className="h-4 w-4 mr-2" />
              <span className="text-[11px] md:text-xs font-bold uppercase tracking-wider">Server</span>
              <span className="ml-2 text-[10px] md:text-[11px] font-medium normal-case tracking-normal">
                {checking ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Checking...
                  </span>
                ) : (
                  <span>
                    {workingCount}/{ALL_SERVERS.length} working
                    {deadCount > 0 ? ` · ${deadCount} dead hidden` : ""}
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 pr-4 flex-wrap">
              {visible.map((server) => {
                const h = health[server.name];
                const isActive = selectedName === server.name;
                return (
                  <button
                    key={server.name}
                    onClick={() => setSelectedName(server.name)}
                    title={`${server.name}${server.hindi ? " · Hindi" : ""} · ${server.ads} ads${h?.latencyMs != null ? ` · ${h.latencyMs}ms` : ""}`}
                    className={`px-3 py-1.5 rounded-lg text-xs md:text-[13px] font-bold transition-all whitespace-nowrap inline-flex items-center gap-1.5 ${
                      isActive
                        ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                        : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        h?.state === "working" ? "bg-green-400" : h?.state === "dead" ? "bg-red-500" : "bg-yellow-400 animate-pulse"
                      }`}
                    />
                    {server.name}
                    {server.hindi && (
                      <span className="text-[9px] font-extrabold px-1 rounded bg-white/10">HI</span>
                    )}
                  </button>
                );
              })}
              {!checking && workingCount === 0 && deadCount > 0 && (
                <button
                  onClick={recheck}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 text-white/60 hover:text-white hover:bg-white/10 whitespace-nowrap"
                >
                  Retry check
                </button>
              )}
            </div>
          </div>

          {/* Animated Scroll Indicator for Mobile */}
          <div className="absolute right-0 top-0 bottom-0 md:hidden pointer-events-none bg-gradient-to-l from-[#0f0f0f] to-transparent w-16 flex items-center justify-end text-white/60">
             <ChevronRight className="w-5 h-5 animate-pulse text-red-500" />
          </div>

        </div>
      </div>
    </div>
  );
}

export default MyPlayer;

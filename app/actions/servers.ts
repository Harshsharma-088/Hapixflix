"use server";

import { ALL_SERVERS } from "@/lib/servers";

export interface ServerHealth {
  name: string;
  working: boolean;
  latencyMs: number;
}

const PROBE_TIMEOUT_MS = 5000;
const HEALTH_TTL_MS = 10 * 60 * 1000;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Phrases that mean "this embed has no playable stream".
// Checked ONLY in <title> (player JS bundles contain error-handling strings
// like "movie not found", so body matching false-positives).
const DEAD_MARKS = [
  "video not found",
  "content not found",
  "page not found",
  "has been removed",
  "has been deleted",
  "no streams found",
  "no sources found",
  "no stream available",
  "invalid id",
  "invalid imdb",
  "invalid tmdb",
  "episode not found",
  "movie not found",
  "origin is unreachable",
  "just a moment",
  "attention required",
  "404",
];

const cache = new Map<string, { at: number; data: ServerHealth[] }>();

async function probe(url: string): Promise<{ working: boolean; latencyMs: number }> {
  const started = Date.now();
  const latency = () => Date.now() - started;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": UA, Accept: "text/html" },
      redirect: "follow",
      cache: "no-store",
    });
    if (!res.ok) return { working: false, latencyMs: latency() };
    const text = await res.text();
    // Tiny shells carry no player.
    if (text.length < 1024) return { working: false, latencyMs: latency() };
    // Dead markers are checked in <title> only: player bundles embed
    // error-handling strings ("movie not found") that false-positive in body.
    const title = (text.slice(0, 12000).match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "")
      .toLowerCase();
    for (const mark of DEAD_MARKS) {
      if (title.includes(mark)) return { working: false, latencyMs: latency() };
    }
    return { working: true, latencyMs: latency() };
  } catch {
    return { working: false, latencyMs: latency() };
  } finally {
    clearTimeout(timer);
  }
}

// Content-aware health check: validates each embed actually serves a playable
// page for THIS title (not just that the host is reachable). Parallel,
// 5s cap per server, 10-min server cache. Client keeps its own session cache
// on top, so repeat visits resolve instantly.
export async function checkServers(
  tmdbId: string,
  mediaType: "movie" | "tv",
  season = 1,
  episode = 1
): Promise<ServerHealth[]> {
  const key = `${tmdbId}:${mediaType}:${season}:${episode}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < HEALTH_TTL_MS) return hit.data;

  const isTv = mediaType === "tv";
  const settled = await Promise.all(
    ALL_SERVERS.map(async (def) => {
      const res = await probe(def.url(tmdbId, isTv, season, episode));
      return { name: def.name, working: res.working, latencyMs: res.latencyMs };
    })
  );

  cache.set(key, { at: Date.now(), data: settled });
  return settled;
}

// Canonical movie/TV embed server list (plain module — safe to import anywhere).
// Deduped by backend URL: each entry is a unique stream source.
// Hindi-first ranking metadata lives here so the player and the health
// check share one source of truth.

export type AdsLevel = "low" | "medium" | "high";

export interface ServerDef {
  name: string;
  hindi: boolean;
  ads: AdsLevel;
  priority: number;
  url: (id: string, isTv: boolean, s?: number, e?: number) => string;
}

export const ALL_SERVERS: ServerDef[] = [
  // Own custom player - ad-free, mixed audio
  { name: "AnixHub", hindi: true, ads: "low", priority: 0, url: (id: string, isTv: boolean, s = 1, e = 1) => isTv ? `https://anixhub-stream.vercel.app/?tmdb_id=${id}&media_type=tv&season=${s}&episode=${e}` : `https://anixhub-stream.vercel.app/?tmdb_id=${id}&media_type=movie` },
  // Hindi-first mirrors
  { name: "ModiPlay 1080p", hindi: true, ads: "low", priority: 1, url: (id: string, isTv: boolean, s = 1, e = 1) => isTv ? `https://rozgarlelo.modiplay.xyz/embed/tmdb/tv?id=${id}&s=${s}&e=${e}` : `https://rozgarlelo.modiplay.xyz/embed/tmdb/movie?id=${id}` },
  { name: "ScreenScape Hindi", hindi: true, ads: "low", priority: 2, url: (id: string, isTv: boolean, s = 1, e = 1) => isTv ? `https://screenscape.me/embed?tmdb=${id}&type=tv&s=${s}&e=${e}&lan=hindi` : `https://screenscape.me/embed?tmdb=${id}&type=movie&lan=hindi` },
  { name: "Peachify Mirror", hindi: true, ads: "low", priority: 3, url: (id: string, isTv: boolean, s = 1, e = 1) => isTv ? `https://peachify.top/embed/tv/${id}/${s}/${e}?dub=Hindi&sub=English` : `https://peachify.top/embed/movie/${id}?dub=Hindi&sub=English` },
  { name: "IQSmart 1080p", hindi: true, ads: "medium", priority: 4, url: (id: string, isTv: boolean, s = 1, e = 1) => isTv ? `https://streams.iqsmartgames.com/embed/tv/${id}/${s}/${e}?key=e11a7debaaa4f5d25b671706ffe4d2acb56efbd4` : `https://streams.iqsmartgames.com/embed/movie/${id}?key=e11a7debaaa4f5d25b671706ffe4d2acb56efbd4` },
  // General mirrors (non-Hindi-first, kept as fallback)
  { name: "ScreenScape", hindi: false, ads: "low", priority: 5, url: (id: string, isTv: boolean, s = 1, e = 1) => isTv ? `https://screenscape.me/embed?tmdb=${id}&type=tv&s=${s}&e=${e}` : `https://screenscape.me/embed?tmdb=${id}&type=movie` },
  { name: "VIDOUT HD", hindi: false, ads: "medium", priority: 6, url: (id: string, isTv: boolean, s = 1, e = 1) => isTv ? `https://vidout.pages.dev/tv/${id}/s${s}/e${e}` : `https://vidout.pages.dev/movie/${id}` },
  { name: "Vidsync HD", hindi: false, ads: "medium", priority: 7, url: (id: string, isTv: boolean, s = 1, e = 1) => isTv ? `https://vidsync.xyz/embed/tv/${id}/${s}/${e}` : `https://vidsync.xyz/embed/movie/${id}` },
  { name: "Bingr HD", hindi: false, ads: "high", priority: 8, url: (id: string, isTv: boolean, s = 1, e = 1) => isTv ? `https://bingr.one/watch/tv/${id}/${s}/${e}` : `https://bingr.one/watch/movie/${id}` },
  { name: "Filmu HD", hindi: false, ads: "high", priority: 9, url: (id: string, isTv: boolean, s = 1, e = 1) => isTv ? `https://embed.filmu.in/tv/${id}/${s}/${e}` : `https://embed.filmu.in/movie/${id}` },
  { name: "VidBolt HD", hindi: false, ads: "high", priority: 10, url: (id: string, isTv: boolean, s = 1, e = 1) => isTv ? `https://vidbolt.xyz/tv/${id}/${s}/${e}` : `https://vidbolt.xyz/movie/${id}` },
];

export const ADS_SCORE: Record<AdsLevel, number> = { low: 0, medium: 20, high: 40 };

export function rankScore(def: ServerDef, latencyMs?: number): number {
  const hindiScore = def.hindi ? 0 : 100;
  const latencyScore = latencyMs == null ? 50 : Math.min(latencyMs / 1000, 60);
  return hindiScore + ADS_SCORE[def.ads] + def.priority + latencyScore;
}

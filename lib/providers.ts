// Provider slugs for /provider/[providerId] routes + TMDB watch-provider IDs.
// Plain module (NOT a "use server" file) so pages and components can import it.
export const PROVIDER_IDS: Record<string, { tmdbId: string; name: string }> = {
  "netflix": { tmdbId: "8", name: "Netflix" },
  "amazon-prime": { tmdbId: "9", name: "Amazon Prime" },
  "disney-hotstar": { tmdbId: "1226", name: "Jio Hotstar" },
  "jio-ott": { tmdbId: "2209", name: "Jio OTT" },
  "mx-player": { tmdbId: "5158", name: "MX Player" },
  "sony-liv": { tmdbId: "2373", name: "Sony Liv" },
  "zee-5": { tmdbId: "2329", name: "Zee 5" },
  "k-drama": { tmdbId: "k-drama", name: "K-drama" },
};

export const PROVIDER_SLUGS = Object.keys(PROVIDER_IDS);

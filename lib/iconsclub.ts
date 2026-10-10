/**
 * IconsClub Logo API Helper (https://iconsclub.xyz/api)
 * Provides simple URL generation and brand logo lookups.
 */

export interface IconsClubOptions {
  size?: number; // 16-2048 px (default: 128)
  format?: "png" | "svg"; // png or svg (default: png)
  radius?: number; // Corner rounding: 0 (square) to 50 (circle)
  gray?: boolean; // Grayscale mode
  invert?: boolean; // Inverted colors
}

/**
 * Standard brand/provider mappings for normalized lookup
 */
export const BRAND_SLUG_MAP: Record<string, string> = {
  netflix: "netflix",
  "prime video": "prime-video",
  "amazon prime": "prime-video",
  amazon: "amazon",
  max: "max",
  "hbo max": "max",
  hbo: "hbo",
  "disney+": "disney",
  "disney plus": "disney",
  disney: "disney",
  "apple tv+": "apple-tv",
  "apple tv": "apple-tv",
  apple: "apple",
  "paramount+": "paramount",
  "paramount plus": "paramount",
  paramount: "paramount",
  hulu: "hulu",
  crunchyroll: "crunchyroll",
  peacock: "peacock",
  tubi: "tubi",
  starz: "starz",
  showtime: "showtime",
  amc: "amc",
  "amc+": "amc",
  spotify: "spotify",
  youtube: "youtube",
  github: "github",
  telegram: "telegram",
  discord: "discord",
  twitter: "twitter",
  x: "twitter",
  instagram: "instagram",
  tmdb: "tmdb",
};

/**
 * Get normalized logo slug for IconsClub API
 */
export function getLogoSlug(name: string): string {
  const normalized = name.trim().toLowerCase();
  if (BRAND_SLUG_MAP[normalized]) {
    return BRAND_SLUG_MAP[normalized];
  }
  // Fallback: convert spaces to hyphens and remove non-alphanumeric chars except hyphens
  return normalized.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export const JIO_HOTSTAR_LOGO = "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/3e/7b/ef/3e7bef81-984f-4e36-9178-6890a0c47c62/AppIcon-IN-0-0-1x_U007epad-0-1-0-85-220.png/1024x1024bb.jpg";

/**
 * Generates an IconsClub logo URL
 * API Spec: https://iconsclub.xyz/logo/{name}/{size}.{format}?radius={radius}&gray={1}&invert={1}
 */
export function getIconsClubUrl(name: string, options: IconsClubOptions = {}): string {
  const normalized = name.trim().toLowerCase();
  if (["jiohotstar", "hotstar", "jio hotstar", "disney+", "disney plus", "disney"].includes(normalized)) {
    return JIO_HOTSTAR_LOGO;
  }

  const slug = getLogoSlug(name);
  const size = options.size ? Math.max(options.size, 256) : 256;
  const format = options.format || "png";

  let url = `https://iconsclub.xyz/logo/${encodeURIComponent(slug)}/${size}.${format}`;

  const queryParams: string[] = [];
  if (options.radius !== undefined && options.radius >= 0 && options.radius <= 50) {
    queryParams.push(`radius=${options.radius}`);
  }
  if (options.gray) {
    queryParams.push("gray=1");
  }
  if (options.invert) {
    queryParams.push("invert=1");
  }

  if (queryParams.length > 0) {
    url += `?${queryParams.join("&")}`;
  }

  return url;
}

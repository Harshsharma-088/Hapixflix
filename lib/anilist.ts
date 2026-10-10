import { Anime, AniListMedia } from "@/types/anime";

const ANILIST_API = "https://graphql.anilist.co";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function stripHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function mapAniListMedia(m: AniListMedia): Anime {
  const title = m.title;
  return {
    id: m.id,
    title: title?.english || title?.romaji || title?.native || `Anime ${m.id}`,
    romaji: title?.romaji || "",
    english: title?.english || "",
    native: title?.native || "",
    coverImage:
      m.coverImage?.extraLarge || m.coverImage?.large || m.coverImage?.medium || "",
    coverMedium: m.coverImage?.large || m.coverImage?.medium || "",
    color: m.coverImage?.color || null,
    bannerImage: m.bannerImage || null,
    description: stripHtml(m.description),
    status: m.status || null,
    format: m.format || null,
    episodes: m.episodes ?? null,
    duration: m.duration ?? null,
    year: m.seasonYear ?? m.startDate?.year ?? null,
    averageScore: m.averageScore ?? null,
    meanScore: m.meanScore ?? null,
    popularity: m.popularity ?? null,
    genres: m.genres || [],
    source: m.source || null,
    isAdult: Boolean(m.isAdult),
    nextAiringEpisode: m.nextAiringEpisode || null,
    trailer: m.trailer || null,
  };
}

interface ListData {
  Page: { media: AniListMedia[] };
}

async function anilistQL<T = any>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(ANILIST_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": UA,
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`AniList HTTP ${res.status}`);
  }

  const json = await res.json().catch(() => null);
  if (!json) throw new Error("AniList empty response");
  if (json.errors?.length) {
    throw new Error(json.errors[0]?.message ?? "AniList error");
  }
  return json.data as T;
}

const LIST_FIELDS = `
  id
  title { romaji english native }
  coverImage { extraLarge large medium color }
  bannerImage
  description(asHtml: true)
  status
  format
  episodes
  duration
  seasonYear
  startDate { year month day }
  averageScore
  meanScore
  popularity
  genres
  source
  isAdult
  nextAiringEpisode { episode airingAt timeUntilAiring }
  trailer { site id }
`;

function mapData(data: ListData | null): Anime[] {
  return (data?.Page?.media || []).map(mapAniListMedia);
}

export async function getAnimeList(
  sort: string,
  params: Record<string, string> = {},
  perPage = 30
): Promise<Anime[]> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page: Page(page: $page, perPage: $perPage) {
        media(type: ANIME, isAdult: false, sort: [${sort}], ${Object.entries(params)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ")}) {
          ${LIST_FIELDS}
        }
      }
    }
  `;
  const data = await anilistQL<ListData>(query, { page: 1, perPage });
  return mapData(data);
}

export async function searchAnime(
  search: string,
  perPage = 40
): Promise<Anime[]> {
  const query = `
    query ($search: String, $page: Int, $perPage: Int) {
      Page: Page(page: $page, perPage: $perPage) {
        media(type: ANIME, isAdult: false, search: $search, sort: [POPULARITY_DESC]) {
          ${LIST_FIELDS}
        }
      }
    }
  `;
  const data = await anilistQL<ListData>(query, { search, page: 1, perPage });
  return mapData(data);
}

export async function getAnimeDetail(id: number): Promise<Anime | null> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${LIST_FIELDS}
      }
    }
  `;
  try {
    const data = await anilistQL<{ Media: AniListMedia | null }>(query, { id });
    return data.Media ? mapAniListMedia(data.Media) : null;
  } catch {
    return null;
  }
}

export { mapAniListMedia, stripHtml };

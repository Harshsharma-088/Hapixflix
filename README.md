<div align="center">
  <img src="public/logo.svg" alt="Hapixflix Logo" width="300" />

  <br />
  <br />

  **The ultimate next-generation open-source cinematic streaming platform and TMDB indexer — now with anime.**

  [![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![Zustand](https://img.shields.io/badge/Zustand-State-yellow?style=for-the-badge)](https://zustand-demo.pmnd.rs/)
  [![TMDB API](https://img.shields.io/badge/TMDB-API-01B4E4?style=for-the-badge&logo=themoviedb)](https://www.themoviedb.org/)

  <br />
  <p align="center">
    <a href="#features">✨ Features</a> •
    <a href="#architecture">🏗️ Architecture</a> •
    <a href="#getting-started">🚀 Getting Started</a> •
    <a href="#project-structure">📁 Structure</a> •
    <a href="#api-routes">🔌 API</a> •
    <a href="#legal--dmca">⚖️ Legal</a>
  </p>
</div>

---

## 🌟 Overview

**Hapixflix** is a state-of-the-art, high-performance streaming directory built with **Next.js App Router**, **React**, and **Tailwind CSS**.

It has two catalog worlds:

- 🎬 **Movies & TV** — metadata from the **TMDB API**, playback via curated third-party embed servers.
- 🎌 **Anime** — metadata from **AniList**, streaming sources aggregated by the built-in **`anixanime`** provider layer (12 providers), served through Next.js API routes with an HLS proxy.

> **Note:** Hapixflix is an indexer. It does **not** host, store, or stream any media files on its own servers.

---

## ✨ Features

- 🎨 **Premium Aesthetic**: Glassmorphism, dynamic gradients, micro-animations, and a responsive layout from mobile to 4K TVs.
- 🎬 **Movies & TV Catalog**: Trending, popular, top-rated, cast details, similar content, and season/episode browsing powered by TMDB.
- 🎌 **Anime Catalog**: AniList-powered discovery with episode lists, SUB/DUB toggle, and multi-provider failover (ReAnime, AniKoto, AnimeGG, AniNeko, AniBD + more).
- ⚡ **Dynamic Image Proxy**: The `/api/images/[type]/[id]` route resolves titled English backdrops from TMDB on the fly via cache-controlled `302 Redirects` — fast loads, no rate-limit pressure, no UI flashes.
- 📡 **HLS Proxy**: The `/api/anixanime/proxy` route rewrites HLS playlists/keys and subtitles so streams play in-browser with one custom player.
- 🖥️ **Multi-Server Players**: One-tap server switching for both movies/TV (`components/player`) and anime (`AniXAnimePlayer` + `AniXCustomPlayer`).
- 💾 **Local-First State**: Watchlist, history, and continue-watching in Zustand + LocalStorage. Your data never leaves your device.
- 🔍 **Global Search**: Instant debounced search modal across movies, TV, and anime.
- 📱 **Mobile Optimized**: Fully responsive design tailored from mobile devices to 4K displays.

---

## 🏗️ Architecture

### Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui, Lucide icons
- **State**: Zustand (persisted) for watchlist, history, and continue-watching
- **Data Sources**: TMDB (movies/TV), AniList (anime metadata), `anixanime` scrapers (anime streams)

### How Playback Works

```text
Movies/TV page  →  TMDB metadata  →  embed server iframe (AnixHub, RozgarLelo, …)
Anime watch page → /api/anixanime/episodes|watch → anixanime providers → HLS via /api/anixanime/proxy
```

### Private Servers (local only)

Movie-server code that must **not** appear on the public GitHub lives in:

```text
/private-servers/anixserver2/   # standalone Express streaming server — git-ignored
```

- `/private-servers/` is in `.gitignore`, and the old tracked `anixserver2/` path has been unstaged from git — so the next push removes server code from GitHub while it keeps working on your machine.
- Run it locally with `cd private-servers/anixserver2 && npm install && npm run dev`.
- The web app never imports it (only points at its deployed URL), so the site builds and runs fine without it.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- A free API key from [TMDB](https://www.themoviedb.org/documentation/api)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AniXDex/AniXFlix.git
   cd AniXFlix
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root (already git-ignored) and add your TMDB key:

   ```env
   TMDB_API_KEY=your_v3_api_key_here
   ```

   > `NEXT_PUBLIC_TMDB_API_KEY` is accepted as a fallback. Never commit `.env`.

4. **Run the development server**
   ```bash
   npm run dev
   ```

   Open `http://localhost:3000` 🎉

### Scripts

| Command       | What it does              |
| ------------- | ------------------------- |
| `npm run dev`   | Start dev server          |
| `npm run build` | Production build          |
| `npm run start` | Serve production build    |
| `npm run lint`  | Run ESLint (ignores `private-servers/`, `.next/`, `build/`) |

> After cleanup, run `npm install` once to sync `package-lock.json` with the trimmed dependency list.

---

## 📁 Project Structure

```text
app/
  (main)/            # pages: home, movies, series, search, detail, play, anime/…, history, my-list
  actions/           # server actions: play, search, category, tv, provider
  api/
    movies/          # TMDB catalog endpoints (public base code)
    images/          # backdrop-resolver redirects (public base code)
    anixanime/       # anime episodes/watch + HLS proxy (public)
components/
  player/            # movie/TV player (MyPlayer, PlayClient, PlayerTabs)
  anime/             # anime player, episode list, cards, rows
  movie/             # cards, rows, provider row, watchlist button
  ui/                # shadcn/ui primitives
lib/                 # tmdb, anilist, mapTmdbToAnix, origin, playback, utils, iconsclub
store/               # zustand persisted store (watchlist/history/continue-watching)
types/               # anime + shared types
anixanime/           # anime provider layer: core/ + 12 providers/ + file worker entry
private-servers/     # ⛔ git-ignored: anixserver2 Express server (local only)
public/              # logos, images, robots.txt
```

---

## 🔌 API Routes

| Route | Purpose |
| ----- | ------- |
| `GET /api/movies` | Popular / featured / trending (TMDB) |
| `GET /api/movies/[movieId]` | Single title, movie-first then TV fallback (TMDB) |
| `GET /api/movies/public/[publicId]` | Same lookup by public id (TMDB) |
| `GET /api/images/[type]/[id]` | Best English backdrop → `302` to TMDB CDN |
| `GET /api/anixanime/*` | Anime gateway: `search`, `map`, `episodes`, `watch`, `stream` |
| `GET /api/anixanime/proxy?url=&referer=` | HLS/segment/subtitle proxy with playlist rewriting |

---

## ⚖️ Legal & DMCA

**Hapixflix** is a demonstration project and acts purely as an automated search engine and indexer.

- **No File Hosting**: We do **NOT** host, upload, or manage any video files, media, or content on our own servers.
- **Safe Harbor**: All video content is embedded from third-party services and APIs. We have no control over content hosted on third-party servers.
- **DMCA**: Concerns about the media itself must go to the actual file hosts. We comply with the DMCA and promptly remove indexed links on valid notification — open an issue in this repo.

For takedown requests regarding indexed links, please open an issue or contact us via this GitHub repository.

---

<div align="center">
  <i>Built with passion by <a href="https://github.com/anixdex">AniXDex</a></i>
</div>

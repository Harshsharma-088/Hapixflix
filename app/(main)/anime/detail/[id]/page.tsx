import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";

import { getAnimeDetail, getAnimeList } from "@/lib/anilist";
import AnimeCard from "@/components/anime/AnimeCard";
import { Star, Play, Calendar, Film, Clock, Sparkles, ChevronRight, Share2, Heart, ListPlus } from "lucide-react";

import AniXEpisodeList from "@/components/anime/AniXEpisodeList";
import AnimeActionButtons from "@/components/anime/AnimeActionButtons";
import AnimeSynopsis from "@/components/anime/AnimeSynopsis";

export default async function AnimeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const anilistId = Number(id);

  if (isNaN(anilistId)) {
    notFound();
  }

  const [anime, popularAnime] = await Promise.all([
    getAnimeDetail(anilistId),
    getAnimeList("POPULARITY_DESC", {}, 12).catch(() => []),
  ]);

  if (!anime) {
    notFound();
  }

  return (
    <div className="bg-[#09090b] min-h-screen text-white flex flex-col">
      <Header />

      {/* HERO BANNER SECTION */}
      <div className="relative pt-24 pb-16 px-4 md:px-14 xl:px-20 overflow-hidden border-b border-white/5">
        {anime.bannerImage ? (
          <div className="absolute inset-0 z-0">
            <img src={anime.bannerImage} alt={anime.title} className="w-full h-full object-cover opacity-20 blur-md scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent"></div>
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-red-950/20 via-[#09090b] to-[#09090b]"></div>
        )}

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
          
          {/* Cover Poster */}
          <div className="relative w-48 sm:w-56 md:w-64 aspect-[2/3] shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
            <img src={anime.coverImage || anime.coverMedium} alt={anime.title} className="w-full h-full object-cover object-top" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Link
                href={`/anime/watch/${anime.id}?ep=1`}
                className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform"
              >
                <Play size={24} className="fill-white ml-1" />
              </Link>
            </div>
          </div>

          {/* Details Content */}
          <div className="flex flex-col gap-3 md:gap-4 flex-1 items-center md:items-start mt-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
              <span className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-widest shadow-lg shadow-red-600/20">
                {anime.format || "TV"}
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">
                <Star size={12} className="fill-yellow-400" />
                {anime.averageScore ? (anime.averageScore / 10).toFixed(1) : "NR"}
              </span>
              <span className="text-white/60 text-xs font-semibold px-2 py-0.5 rounded bg-white/5 flex items-center gap-1">
                <Film size={12} />
                {anime.status || "Unknown"}
              </span>
              <span className="text-white/60 text-xs font-semibold px-2 py-0.5 rounded bg-white/5 flex items-center gap-1">
                <Calendar size={12} />
                {anime.year || "TBA"}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 leading-tight">
              {anime.title}
            </h1>
            
            {/* Quick Actions */}
            <AnimeActionButtons anime={anime} />

            {/* Next Airing Info */}
            {anime.nextAiringEpisode && (
              <div className="mt-2 flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-xl">
                <Sparkles size={14} className="text-purple-400" />
                <span className="text-xs font-medium text-purple-200">
                  Episode {anime.nextAiringEpisode.episode} releasing in{" "}
                  <strong className="text-purple-400 font-bold">
                    {Math.floor((anime.nextAiringEpisode.timeUntilAiring || 0) / 86400)}d{" "}
                    {Math.floor(((anime.nextAiringEpisode.timeUntilAiring || 0) % 86400) / 3600)}h
                  </strong>
                </span>
              </div>
            )}

            {/* Genres */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
              {anime.genres.map((genre) => (
                <span key={genre} className="bg-[#141417] border border-white/10 text-white/80 text-xs font-semibold px-3 py-1 rounded-lg">
                  {genre}
                </span>
              ))}
            </div>

            {/* Description */}
            {anime.description && <AnimeSynopsis description={anime.description} />}
          </div>
        </div>
      </div>

      {/* EPISODE SELECTION SECTION */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-14 xl:px-20 py-10">
        <AniXEpisodeList anilistId={anilistId} anime={anime} />
      </div>

      {/* RECOMMENDED ANIME ROW */}
      {popularAnime.length > 0 && (
        <div className="max-w-7xl mx-auto w-full px-4 md:px-14 xl:px-20 py-10 flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="w-1.5 h-6 bg-red-600 rounded-full"></div>
            <h2 className="text-xl font-extrabold text-white">You Might Also Like</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {popularAnime.map((item) => (
              <AnimeCard key={item.id} anime={item} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

import React from "react";
import Header from "@/components/Header";

import { getAnimeDetail, getAnimeList } from "@/lib/anilist";
import { notFound } from "next/navigation";
import AniXAnimePlayer from "@/components/anime/AniXAnimePlayer";
import AnimeCard from "@/components/anime/AnimeCard";
import { Star, ShieldCheck, Sparkles, Film, Calendar, Clock } from "lucide-react";

export default async function AniXAnimeWatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ep?: string }>;
}) {
  const { id } = await params;
  const sParams = await searchParams;
  const anilistId = Number(id);
  const initialEp = sParams.ep ? Math.max(1, Number(sParams.ep)) : 1;

  if (isNaN(anilistId)) {
    notFound();
  }

  const anime = await getAnimeDetail(anilistId);

  if (!anime) {
    notFound();
  }

  return (
    <div className="bg-[#09090b] min-h-screen text-white flex flex-col">
      <Header />

      {/* ANIXANIME PLAYER WATCH INTERFACE */}
      <div className="pt-20 pb-10 max-w-7xl mx-auto w-full">
        <AniXAnimePlayer
          anilistId={anilistId}
          anime={anime}
          initialEpisode={initialEp}
        />
      </div>
    </div>
  );
}

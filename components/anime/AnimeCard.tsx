"use client";

import React from "react";
import Link from "next/link";
import { Star, Play } from "lucide-react";
import { Anime } from "@/types/anime";
import SafeImage from "@/components/SafeImage";

interface AnimeCardProps {
  anime: Anime;
  isResponsive?: boolean;
}

export default function AnimeCard({ anime }: AnimeCardProps) {
  const rating = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;

  return (
    <Link
      href={`/anime/detail/${anime.id}`}
      className="group relative flex flex-col bg-[#141417] rounded-xl overflow-hidden active:scale-95 transition-all duration-300 border border-white/5 hover:border-red-500/30 hover:shadow-xl"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-[#09090b]">
        <SafeImage
          src={anime.coverImage || anime.coverMedium}
          alt={anime.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
          <span className="flex items-center gap-1.5 text-white text-xs font-bold bg-red-600 px-3.5 py-1.5 rounded-lg shadow-lg">
            <Play size={12} fill="currentColor" /> Watch Anime
          </span>
        </div>

        {/* Score Badge */}
        {rating && (
          <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded-md text-[11px] font-extrabold text-yellow-400 flex items-center gap-1 border border-white/10">
            <Star size={10} className="fill-yellow-400 text-yellow-400" /> {rating}
          </div>
        )}

        {/* Format / Episodes Badge */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <span className="text-[9px] font-black text-white bg-red-600/90 px-1.5 py-0.5 rounded uppercase tracking-wider">
            {anime.format || "ANIME"}
          </span>
        </div>
      </div>

      <div className="p-3 flex flex-col gap-1">
        <h3 className="text-xs font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
          {anime.title}
        </h3>
        <div className="flex items-center justify-between text-[10px] text-white/50">
          <span>{anime.year || "N/A"}</span>
          <span>{anime.episodes ? `${anime.episodes} eps` : "Ongoing"}</span>
        </div>
      </div>
    </Link>
  );
}

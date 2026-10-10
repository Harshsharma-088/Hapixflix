"use client";
import { Movie } from "@/types/types";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Star, Heart } from "lucide-react";
import SafeImage from "@/components/SafeImage";
import { useStore } from "@/store/useStore";

interface Props {
  movie: any;
  isPortrait?: boolean;
  isResponsive?: boolean;
  rank?: number; // 1 to 10
}

function MovieCard({ movie, isPortrait = false, isResponsive = false, rank }: Props) {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useStore();
  const [localMovie, setLocalMovie] = useState(movie);
  const isSaved = isInWatchlist(localMovie.publicId || localMovie.id?.toString());



  const handleWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSaved) {
      removeFromWatchlist(localMovie.publicId || localMovie.id?.toString());
    } else {
      addToWatchlist(localMovie);
    }
  };

  return (
    <Link 
      href={localMovie.mediaType === 'anime' ? `/anime/detail/${localMovie.publicId}` : `/detail/${localMovie.publicId}?v=${localMovie.mediaType === 'tv' ? 2 : 1}`} 
      className="group flex flex-col gap-3 w-full cursor-pointer"
    >
      {/* Poster Image Container */}
      <div className={`relative w-full overflow-hidden rounded-2xl bg-[#141417] ${
        isPortrait ? 'aspect-[2/3]' : (isResponsive ? 'aspect-[2/3] md:aspect-video' : 'aspect-video')
      }`}>
        
        {/* Mobile / Portrait Image */}
        <SafeImage
          src={localMovie.thumbnailUrl || localMovie.backdropUrl}
          alt={localMovie.title}
          fill
          sizes={isPortrait ? "(max-width: 1024px) 33vw, 15vw" : "(max-width: 768px) 50vw, 1vw"}
          className={`object-cover group-hover:scale-105 transition-transform duration-500 ease-out ${
            isResponsive ? 'md:hidden' : ''
          } ${!isPortrait && !isResponsive ? 'hidden' : ''}`}
        />

        {/* Desktop / Horizontal Image */}
        <SafeImage
          src={`/api/images/${localMovie.mediaType || 'movie'}/${localMovie.publicId || localMovie.id}?fallback=${encodeURIComponent(localMovie.backdropUrl || localMovie.thumbnailUrl || "")}`}
          alt={localMovie.title}
          fill
          sizes="(min-width: 768px) 33vw, 1vw"
          className={`object-cover group-hover:scale-105 transition-transform duration-500 ease-out ${
            isResponsive ? 'hidden md:block' : ''
          } ${isPortrait ? 'hidden' : ''}`}
        />
        
        {/* Top 10 Badge */}
        {rank !== undefined && (
          <div className="absolute top-0 left-0 bg-red-600 text-white flex flex-col items-center justify-center px-2 py-1 rounded-br-2xl shadow-lg z-10 min-w-10">
            <span className="text-[8px] font-bold uppercase leading-tight tracking-wider">TOP</span>
            <span className="text-sm font-black leading-tight">
              {rank.toString().padStart(2, "0")}
            </span>
          </div>
        )}



        {/* Watchlist Button */}
        <button
          onClick={handleWatchlist}
          className="absolute top-2 right-2 p-2 bg-black/40 hover:bg-black/80 backdrop-blur-sm rounded-full transition-all duration-300 z-20 opacity-100"
        >
          <Heart size={16} className={`${isSaved ? 'text-red-500 fill-red-500' : 'text-white'}`} />
        </button>
      </div>

      {/* Metadata */}
      <div className="flex flex-col gap-1">
        <h3 className="font-bold text-white text-sm md:text-base line-clamp-1 group-hover:text-red-500 transition-colors">
          {localMovie.title}
        </h3>
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] sm:text-[11px] md:text-xs text-white/50 font-medium">
          <div className="flex items-center gap-1 shrink-0">
            <Star size={10} className="text-red-600 fill-red-600 sm:w-3 sm:h-3" />
            <span className="text-white/80">{localMovie.rating || "8.5"}</span>
          </div>
          <span className="shrink-0">&middot;</span>
          <span className="shrink-0">{localMovie.releaseYear || (localMovie.releaseDate ? new Date(localMovie.releaseDate).getFullYear() : "2026")}</span>
          <span className="shrink-0">&middot;</span>
          <span className="truncate">{localMovie.mediaType === "tv" ? "TV Show" : "Movie"}</span>
        </div>
      </div>
    </Link>
  );
}

export default MovieCard;

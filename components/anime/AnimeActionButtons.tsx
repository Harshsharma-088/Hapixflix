"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Heart } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Movie } from "@/types/types";

export default function AnimeActionButtons({ anime }: { anime: any }) {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useStore();
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setIsSaved(isInWatchlist(anime.id.toString()));
  }, [anime.id, isInWatchlist]);

  const mapAnilistToMovie = (a: any): Movie => {
    return {
      id: a.id.toString(),
      publicId: a.id.toString(),
      title: a.title,
      description: a.description || "No description available.",
      thumbnailUrl: a.coverImage || a.coverMedium,
      backdropUrl: a.bannerImage || a.coverImage || a.coverMedium,
      trailerUrl: a.trailer ? `https://www.youtube.com/watch?v=${a.trailer.id}` : null,
      videoUrl: null,
      cloudinaryId: null,
      duration: a.duration || null,
      rating: a.averageScore ? (a.averageScore / 10).toFixed(1) : null,
      releaseYear: a.seasonYear || a.year || null,
      maturityRating: null,
      isTrending: false,
      isFeatured: false,
      logoUrl: null,
      mediaType: "anime" as any, // Cast to any to bypass strict typing if needed
      createdAt: new Date(),
    };
  };

  const handleLike = () => {
    const animeId = anime.id.toString();
    if (isSaved) {
      removeFromWatchlist(animeId);
      setIsSaved(false);
    } else {
      addToWatchlist(mapAnilistToMovie(anime));
      setIsSaved(true);
    }
  };

  return (
    <div className="flex items-center gap-3 mt-2">
      <Link
        href={`/anime/watch/${anime.id}?ep=1`}
        className="bg-white text-black hover:bg-gray-200 px-6 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
      >
        <Play size={18} className="fill-black" />
        <span>Watch Now</span>
      </Link>
      <button
        onClick={handleLike}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 border ${
          isSaved
            ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/30"
            : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
        }`}
      >
        <Heart size={18} className={isSaved ? "fill-white" : ""} />
      </button>
    </div>
  );
}

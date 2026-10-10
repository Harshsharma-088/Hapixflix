"use client";

import { useStore } from "@/store/useStore";
import { Movie } from "@/types/types";
import { Plus, Check } from "lucide-react";

export default function WatchlistButton({ movie }: { movie: Movie }) {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useStore();
  const isSaved = isInWatchlist(movie.publicId || movie.id?.toString());

  const handleToggle = () => {
    if (isSaved) {
      removeFromWatchlist(movie.publicId || movie.id?.toString());
    } else {
      addToWatchlist(movie);
    }
  };

  return (
    <button 
      onClick={handleToggle}
      className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/10 flex items-center justify-center transition-colors"
    >
      {isSaved ? <Check size={20} /> : <Plus size={20} />}
    </button>
  );
}

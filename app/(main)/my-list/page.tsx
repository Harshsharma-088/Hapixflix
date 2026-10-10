"use client";
import Header from '@/components/Header';
import MovieCard from '@/components/movie/MovieCard';
import { useStore } from '@/store/useStore';
import { Heart } from 'lucide-react';

export default function WatchlistPage() {
  const { watchlist } = useStore();

  return (
    <div className="bg-[#09090b] min-h-screen">
      <Header />
      <div className="pt-24 px-4 md:px-14 xl:px-20 relative z-20 flex flex-col gap-6 pb-20">
        <div className="flex items-center gap-3 mt-6 mb-2">
          <Heart size={28} className="text-white fill-white" />
          <h1 className="text-3xl font-bold text-white">My Watchlist</h1>
        </div>

        {watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-white/40">
            <Heart size={64} className="mb-4 opacity-20" />
            <p className="text-lg">Your watchlist is empty. Save some movies to watch later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {watchlist.map((movie) => (
              <MovieCard key={`list-${movie.publicId || movie.id}`} movie={movie} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
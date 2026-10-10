"use client";
import Header from '@/components/Header';
import MovieCard from '@/components/movie/MovieCard';
import { useStore } from '@/store/useStore';
import { History, Trash2 } from 'lucide-react';

export default function HistoryPage() {
  const { history, clearHistory } = useStore();

  return (
    <div className="bg-[#09090b] min-h-screen">
      <Header />
      <div className="pt-24 px-4 md:px-14 xl:px-20 relative z-20 flex flex-col gap-6 pb-20">
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-3">
            <History size={28} className="text-white" />
            <h1 className="text-3xl font-bold text-white">Watch History</h1>
          </div>
          {history.length > 0 && (
            <button 
              onClick={clearHistory}
              className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-xl"
            >
              <Trash2 size={16} /> Clear History
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-white/40">
            <History size={64} className="mb-4 opacity-20" />
            <p className="text-lg">You haven't watched anything yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {history.map((movie) => (
              <MovieCard key={`hist-${movie.publicId || movie.id}`} movie={movie} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
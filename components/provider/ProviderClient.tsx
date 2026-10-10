"use client";

import React, { useState } from "react";
import MovieCard from "@/components/movie/MovieCard";
import { Movie } from "@/types/types";
import { getProviderFeed } from "@/app/actions/provider";
import { motion, AnimatePresence } from "framer-motion";

interface ProviderClientProps {
  slug: string;
  name: string;
  initialMovies: Movie[];
  initialSeries: Movie[];
  moviesTotalPages: number;
  seriesTotalPages: number;
}

export default function ProviderClient({
  slug,
  name,
  initialMovies,
  initialSeries,
  moviesTotalPages,
  seriesTotalPages,
}: ProviderClientProps) {
  const [activeTab, setActiveTab] = useState<"movies" | "series">("movies");
  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [series, setSeries] = useState<Movie[]>(initialSeries);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const isMovies = activeTab === "movies";
  const list = isMovies ? movies : series;
  const totalPages = isMovies ? moviesTotalPages : seriesTotalPages;

  const loadMore = async () => {
    const nextPage = page + 1;
    setIsLoading(true);
    try {
      const data = await getProviderFeed(slug, isMovies ? "movie" : "tv", nextPage);
      if (isMovies) {
        setMovies((prev) => [...prev, ...data.movies]);
      } else {
        setSeries((prev) => [...prev, ...data.movies]);
      }
      setPage(nextPage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#09090b] min-h-screen pt-24 px-4 md:px-14 xl:px-20 pb-20">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-1 h-6 md:h-7 bg-red-600 rounded-full"></div>
        <h1 className="font-bold text-xl md:text-2xl text-white tracking-tight">{name}</h1>
        <span className="text-white/40 text-sm font-medium">{list.length} titles</span>
      </div>

      {/* Movies / Series tabs */}
      <div className="flex items-center gap-6 md:gap-8 overflow-x-auto scrollbar-hide border-b border-white/10 mb-8 pb-1 w-full relative z-20">
        {(["movies", "series"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setPage(1);
            }}
            className={`whitespace-nowrap text-sm font-semibold pb-3 transition-colors relative capitalize ${
              activeTab === tab
                ? "text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div
                layoutId="activeProviderTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-600 rounded-t-full"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Title grid */}
      <AnimatePresence mode="popLayout">
        {list.length > 0 ? (
          <motion.div
            key={`${activeTab}-${list.length}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 relative z-20"
          >
            {list.map((movie) => (
              <MovieCard key={movie.publicId} movie={movie} isPortrait={false} />
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-white/40">
            <p>No content found for this provider yet. Check back soon.</p>
          </div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {page < totalPages && (
        <div className="flex items-center justify-center mt-10">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-full font-semibold border border-white/10 flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            ) : null}
            {isLoading ? "Loading..." : `Load more (page ${page + 1} of ${totalPages})`}
          </button>
        </div>
      )}
    </div>
  );
}

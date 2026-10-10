"use client";

import React, { useState, useEffect } from "react";
import MovieCard from "@/components/movie/MovieCard";
import { Movie } from "@/types/types";
import { fetchCategoryMovies } from "@/app/actions/category";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = [
  "Most popular", "Most rating", "Most recent", "Action & Adventure", 
  "Animation", "Comedy", "Crime", "Documentary", "Drama", "Family", 
  "Kids", "Mystery", "News", "Reality", "Sci-Fi & Fantasy"
];

interface CategoryPageClientProps {
  type: "movie" | "tv";
  initialMovies: Movie[];
}

export default function CategoryPageClient({ type, initialMovies }: CategoryPageClientProps) {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // Skip fetching if it's the initial load for the first category
    if (activeCategory === CATEGORIES[0] && movies.length === initialMovies.length && !isLoading) {
      return;
    }

    const loadMovies = async () => {
      setIsLoading(true);
      const data = await fetchCategoryMovies(type, activeCategory);
      if (isMounted) {
        setMovies(data);
        setIsLoading(false);
      }
    };

    loadMovies();
    
    return () => { isMounted = false; };
  }, [activeCategory, type]);

  return (
    <div className="bg-[#09090b] min-h-screen pt-24 px-4 md:px-14 xl:px-20 pb-20">
      
      {/* Category Nav Bar */}
      <div className="flex items-center gap-6 md:gap-8 overflow-x-auto scrollbar-hide border-b border-white/10 mb-8 pb-1 w-full relative z-20">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`whitespace-nowrap text-sm font-semibold pb-3 transition-colors relative ${
              activeCategory === category 
                ? "text-white" 
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {category}
            {activeCategory === category && (
              <motion.div 
                layoutId="activeCategoryIndicator"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-600 rounded-t-full"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Movie Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {movies.length > 0 ? (
            <motion.div 
              key={activeCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 relative z-20"
            >
              {movies.map((movie) => (
                <MovieCard key={movie.publicId} movie={movie} isPortrait={false} />
              ))}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-white/40">
              <p>No content found for this category.</p>
            </div>
          )}
        </AnimatePresence>
      )}

    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Info, Flame, Award, Sparkles, Film } from "lucide-react";
import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import { Anime } from "@/types/anime";
import AnimeRow from "@/components/anime/AnimeRow";

interface Props {
  trending: Anime[];
  topRated: Anime[];
  trendingNow: Anime[];
  movies: Anime[];
}

export default function AnimeHomeClient({
  trending,
  topRated,
  trendingNow,
  movies,
}: Props) {
  const [featuredIndex, setFeaturedIndex] = useState(0);

  // Filter out anime without banner images for the hero carousel
  const heroAnime = trendingNow.filter(a => a.bannerImage || a.coverImage).slice(0, 10);

  useEffect(() => {
    if (heroAnime.length === 0) return;
    const interval = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % heroAnime.length);
    }, 8000); // 8-second rotation
    return () => clearInterval(interval);
  }, [heroAnime.length]);

  const featured = heroAnime[featuredIndex];

  return (
    <div className="bg-[#09090b] min-h-screen text-white">
      {/* Hero Section */}
      {featured && (
        <div className="relative w-full h-[70vh] md:h-[90vh] -mt-20 overflow-hidden bg-[#09090b]">
          <AnimatePresence mode="wait">
            <motion.div
              key={featured.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <>
                <SafeImage
                  src={featured.coverImage || featured.coverMedium || featured.bannerImage}
                  alt={featured.title}
                  fill
                  priority
                  className="object-cover object-center md:hidden"
                />
                <SafeImage
                  src={featured.bannerImage || featured.coverImage || featured.coverMedium}
                  alt={featured.title}
                  fill
                  priority
                  className="object-cover object-center hidden md:block"
                />
              </>
            </motion.div>
          </AnimatePresence>

          {/* Vignette Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 md:via-[#09090b]/40 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/80 md:via-[#09090b]/60 to-transparent z-10" />
          <div className="absolute inset-0 bg-black/40 md:bg-transparent z-10" />

          {/* Hero Content */}
          <div className="absolute bottom-0 left-0 w-full z-20 px-4 md:px-14 xl:px-20 pb-20 md:pb-32 flex flex-col justify-end h-full">
            <motion.div
              key={`content-${featured.id}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="max-w-2xl flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <span className="bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-widest shadow-lg shadow-red-600/20">
                  {featured.format || "ANIME"}
                </span>
                {featured.averageScore && (
                  <span className="flex items-center gap-1 text-xs font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">
                    ★ {(featured.averageScore / 10).toFixed(1)}
                  </span>
                )}
                {featured.year && (
                  <span className="text-white/60 text-xs font-semibold px-2 py-0.5 rounded bg-white/5">
                    {featured.year}
                  </span>
                )}
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 tracking-tight leading-none drop-shadow-2xl">
                {featured.title}
              </h1>

              <p className="text-sm md:text-base text-white/70 line-clamp-3 md:line-clamp-4 leading-relaxed max-w-xl font-medium drop-shadow-md">
                {featured.description?.replace(/<[^>]*>?/gm, '') || "No description available."}
              </p>

              <div className="flex items-center gap-4 mt-2">
                <Link
                  href={`/anime/watch/${featured.id}?ep=1`}
                  className="bg-white text-black hover:bg-gray-200 px-6 md:px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/10 text-sm md:text-base"
                >
                  <Play size={20} className="fill-black" />
                  <span>Watch Now</span>
                </Link>
                <Link
                  href={`/anime/detail/${featured.id}`}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/10 px-6 md:px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 text-sm md:text-base"
                >
                  <Info size={20} />
                  <span>More Info</span>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Main Content Rows */}
      <div className={`relative z-20 flex flex-col gap-12 pb-20 px-4 md:px-14 xl:px-20 ${heroAnime.length > 0 ? "-mt-10" : "pt-24"}`}>
        <AnimeRow title="Trending This Season" animeList={trendingNow} icon={Sparkles} iconColor="text-emerald-400" />
        <AnimeRow title="Top Trending Anime" animeList={trending} icon={Flame} iconColor="text-red-500" />
        <AnimeRow title="Top Rated Classics" animeList={topRated} icon={Award} iconColor="text-yellow-500" />
        <AnimeRow title="Anime Movies" animeList={movies} icon={Film} iconColor="text-purple-500" />
      </div>
    </div>
  );
}

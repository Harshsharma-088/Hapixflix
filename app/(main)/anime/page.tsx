import React from "react";
import Header from "@/components/Header";
import { getAnimeList } from "@/lib/anilist";
import AnimeHomeClient from "./AnimeHomeClient";

export const revalidate = 3600;

export default async function AnimeBrowsePage() {
  const [trending, topRated, trendingNow, movies] = await Promise.all([
    getAnimeList("POPULARITY_DESC", {}, 18).catch(() => []),
    getAnimeList("SCORE_DESC", {}, 18).catch(() => []),
    getAnimeList("TRENDING_DESC", {}, 18).catch(() => []),
    getAnimeList("POPULARITY_DESC", { format: "MOVIE" }, 18).catch(() => []),
  ]);

  return (
    <>
      <Header />
      <AnimeHomeClient 
        trending={trending} 
        topRated={topRated} 
        trendingNow={trendingNow} 
        movies={movies} 
      />
    </>
  );
}
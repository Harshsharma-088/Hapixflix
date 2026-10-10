"use client";
import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { Movie } from "@/types/types";

export default function HistoryTracker({ movie }: { movie: Movie }) {
  const { addToHistory } = useStore();

  useEffect(() => {
    if (movie) {
      addToHistory(movie);
    }
  }, [movie, addToHistory]);

  return null;
}

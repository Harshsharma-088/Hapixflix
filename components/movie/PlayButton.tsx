"use client";
import { Play } from "lucide-react";
import Link from "next/link";
import { PLAYBACK_KEY, PlaybackData, buildPlayHref } from "@/lib/playback";

export default function PlayButton({ data }: { data: PlaybackData }) {
  const handlePlay = () => {
    sessionStorage.setItem(PLAYBACK_KEY, JSON.stringify(data));
  };

  return (
    <Link
      href={buildPlayHref(data)}
      prefetch={true}
      onClick={handlePlay}
      className="bg-white hover:bg-white/90 text-black px-6 md:px-8 py-2.5 md:py-3 rounded-full font-bold flex items-center gap-2 transition-all hover:scale-105"
    >
      <Play size={18} fill="black" /> Play
    </Link>
  );
}

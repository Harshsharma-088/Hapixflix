"use client";

import React from "react";
import Link from "next/link";

// Crisp 8-bit retro pixelated icon
export function PixelPlayIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="currentColor"
      style={{ shapeRendering: "crispEdges", imageRendering: "pixelated" }}
      aria-hidden="true"
    >
      <rect x="2" y="1" width="2" height="14" />
      <rect x="4" y="2" width="2" height="12" />
      <rect x="6" y="3" width="2" height="10" />
      <rect x="8" y="4" width="2" height="8" />
      <rect x="10" y="5" width="2" height="6" />
      <rect x="12" y="6" width="2" height="4" />
      <rect x="14" y="7" width="2" height="2" />
    </svg>
  );
}

export default function LatentSpecialButton() {
  return (
    <Link
      href="/watch/s2ep6"
      title="Watch Season 2 Episode 6"
      className="group relative flex items-center gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:via-rose-500 hover:to-amber-500 text-white font-bold border border-amber-400/40 shadow-lg shadow-red-950/50 hover:shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer shrink-0"
    >
      <span className="p-1 rounded bg-black/30 border border-amber-300/40 group-hover:border-amber-200 transition-colors">
        <PixelPlayIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-300 group-hover:text-amber-100" />
      </span>
      <span className="text-xs md:text-sm font-extrabold tracking-wide uppercase drop-shadow">
        S2:EP6
      </span>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
      </span>
    </Link>
  );
}

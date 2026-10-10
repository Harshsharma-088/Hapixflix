"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Maximize2, Minimize2 } from "lucide-react";

export default function WatchS2EP6Page() {
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetIdleTimer = useCallback(() => {
    setShowControls(true);
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    idleTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    resetIdleTimer();

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };
  }, [resetIdleTimer]);

  return (
    <div
      ref={containerRef}
      onMouseMove={resetIdleTimer}
      onPointerMove={resetIdleTimer}
      onTouchStart={resetIdleTimer}
      className="fixed inset-0 w-screen h-screen bg-black flex flex-col overflow-hidden z-50 cursor-default"
    >
      {/* Top-Right Corner Mask (auto-hides with controls after idle, reappears on activity) */}
      <div
        className={`absolute top-0 right-0 w-36 sm:w-48 md:w-64 h-12 sm:h-16 md:h-20 bg-black z-30 pointer-events-none shadow-[0_0_15px_10px_black] transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      />

      {/* Top-Left Corner Mask (auto-hides with controls after idle, reappears on activity) */}
      <div
        className={`absolute top-0 left-0 w-36 sm:w-48 md:w-64 h-12 sm:h-16 md:h-20 bg-black z-30 pointer-events-none shadow-[0_0_15px_10px_black] transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      />

      {/* Floating Top Control Bar */}
      <div
        className={`absolute top-0 inset-x-0 z-40 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-gradient-to-b from-black/90 via-black/50 to-transparent px-4 md:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/detail/264022?v=2"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs md:text-sm font-semibold border border-white/15 backdrop-blur-md transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </Link>
            <div className="flex items-center gap-2 text-white/90 text-xs md:text-sm font-medium">
              <span className="text-red-500 font-bold">•</span>
              <span className="font-semibold text-white">India&apos;s Got Latent</span>
              <span className="text-white/40">/</span>
              <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 text-[11px] uppercase tracking-wider">
                S2:EP6
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Embed Frame */}
      <div className="relative w-full h-full flex-1 bg-black">
        <iframe
          src="https://hubstream.art/#ucp5r8"
          className="w-full h-full border-0 bg-black"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
}

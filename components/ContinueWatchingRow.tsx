"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SafeImage from "@/components/SafeImage";
import { PLAYBACK_KEY, PlaybackData, buildPlayHref } from "@/lib/playback";
import { useStore } from "@/store/useStore";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";

interface Props {
  showOnlyTvId?: string;
}

export default function ContinueWatchingRow({ showOnlyTvId }: Props) {
  const router = useRouter();
  const continueWatching = useStore((s) => s.continueWatching);
  const [isAndroid, setIsAndroid] = useState(false);
  const [maxItems, setMaxItems] = useState(6);

  useEffect(() => {
    setIsAndroid(/android/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (showOnlyTvId) { setMaxItems(1); return; }
    const check = () => setMaxItems(window.innerWidth < 768 ? 4 : window.innerWidth < 1280 ? 6 : 8);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [showOnlyTvId]);

  const items = continueWatching
    .filter((c) => showOnlyTvId ? (c.tmdbId === showOnlyTvId && c.mediaType === "tv") : true)
    .slice(0, maxItems);

  if (items.length === 0) return null;

  const handleClick = (item: (typeof items)[0]) => {
    const payload = {
      tmdbId: item.tmdbId,
      mediaType: item.mediaType,
      season: item.season,
      episode: item.episode,
    };
    sessionStorage.setItem(
      PLAYBACK_KEY,
      JSON.stringify(payload)
    );
    router.push(buildPlayHref(payload as PlaybackData));
  };

  return (
    <section className="flex flex-col gap-3 md:gap-4 relative min-h-[120px] md:min-h-[150px]">
      <div className="flex items-center gap-3">
        <div className="w-1 h-5 md:h-6 bg-red-600 rounded-full"></div>
        <h2 className="font-bold text-lg md:text-xl text-white tracking-tight">
          Continue Watching
        </h2>
      </div>

      <Carousel
        opts={{ align: "start", slidesToScroll: isAndroid ? 1 : 3, dragFree: isAndroid }}
        className="w-full relative group/carousel"
      >
        <CarouselContent>
          {items.map((item) => (
            <CarouselItem
              key={`${item.tmdbId}-${item.season}-${item.episode}`}
              className="basis-[45%] sm:basis-[35%] md:basis-[28%] lg:basis-[20%] xl:basis-[15%]"
            >
              <button
                onClick={() => handleClick(item)}
                className="w-full text-left focus:outline-none group/card"
              >
                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-[#141414]">
                  <SafeImage
                    src={item.backdropUrl || item.posterUrl}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover/card:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
                    <div className="h-full w-1/3 bg-red-600 rounded-full" />
                  </div>
                  {item.mediaType === "tv" && (
                    <div className="absolute top-1.5 left-1.5 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      S{item.season}:E{item.episode}
                    </div>
                  )}
                  {item.mediaType === "movie" && (
                    <div className="absolute top-1.5 left-1.5 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      Movie
                    </div>
                  )}
                  <div className="absolute bottom-1.5 left-1.5 right-1.5">
                    <p className="text-white text-[11px] font-medium truncate drop-shadow-lg">
                      {item.title}
                    </p>
                  </div>
                </div>
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>
        {!isAndroid && (
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 pointer-events-none px-4 flex justify-between opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300">
            <CarouselPrevious className="relative pointer-events-auto w-10 h-10 bg-black/50 border-white/10 hover:bg-black/80 hover:scale-110 transition-all text-white backdrop-blur-sm -left-5" />
            <CarouselNext className="relative pointer-events-auto w-10 h-10 bg-black/50 border-white/10 hover:bg-black/80 hover:scale-110 transition-all text-white backdrop-blur-sm -right-5" />
          </div>
        )}
      </Carousel>
    </section>
  );
}

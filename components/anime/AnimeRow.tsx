"use client";

import React, { useState, useEffect } from "react";
import { Anime } from "@/types/anime";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import AnimeCard from "./AnimeCard";
import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  animeList: Anime[];
  icon?: LucideIcon;
  iconColor?: string;
}

function AnimeRow({ title, animeList, icon: Icon, iconColor = "text-white" }: Props) {
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    setIsAndroid(/android/i.test(navigator.userAgent));
  }, []);

  if (!animeList || animeList.length === 0) return null;

  return (
    <section className="flex flex-col gap-4 md:gap-6 relative min-h-[180px] md:min-h-[250px]">
      
      {/* Section Header */}
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 md:h-7 bg-red-600 rounded-full"></div>
          <div className="flex items-center gap-2">
            {Icon && <Icon size={20} className={iconColor} />}
            <h2 className="font-bold text-xl md:text-2xl text-white tracking-tight">{title}</h2>
          </div>
        </div>
      </div>

      {/* Carousel */}
      <Carousel opts={{ align: "start", slidesToScroll: isAndroid ? 1 : 3, dragFree: isAndroid }} className="w-full relative group/carousel">
        <CarouselContent className="">
          {animeList.map((anime) => (
            <CarouselItem
              key={anime.id}
              className="basis-[40%] sm:basis-1/3 md:basis-[25%] lg:basis-[16.66%] xl:basis-[14.28%]"
            >
              <AnimeCard anime={anime} />
            </CarouselItem>
          ))}
        </CarouselContent>
        {!isAndroid && (
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 pointer-events-none px-4 flex justify-between opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300">
          <CarouselPrevious className="relative pointer-events-auto w-12 h-12 bg-black/50 border-white/10 hover:bg-black/80 hover:scale-110 transition-all text-white backdrop-blur-sm -left-6" />
          <CarouselNext className="relative pointer-events-auto w-12 h-12 bg-black/50 border-white/10 hover:bg-black/80 hover:scale-110 transition-all text-white backdrop-blur-sm -right-6" />
        </div>
        )}
      </Carousel>

    </section>
  );
}

export default AnimeRow;

"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import MovieCard from "@/components/movie/MovieCard";
import { Play, ChevronDown, Search } from "lucide-react";

export default function PlayerTabs({ 
  type, 
  episodes, 
  currentEpisodeData, 
  season, 
  episode, 
  mappedSimilar, 
  tmdbId, 
  details,
  onNavigate
}: any) {
  const [activeTab, setActiveTab] = useState(type === "tv" ? "Episodes" : "Related");
  const [visibleCount, setVisibleCount] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setVisibleCount(20);
    setSearchQuery("");
  }, [season]);

  const filteredEpisodes = type === "tv" ? (episodes || []).filter((ep: any) => 
    searchQuery.trim() === "" || ep?.episode_number?.toString() === searchQuery.trim()
  ) : [];

  return (
    <div className="flex flex-col gap-8 w-full pb-20">
      {/* Tabs */}
      <div className="flex items-center gap-6 md:gap-10 border-b border-white/5 pb-2 overflow-x-auto scrollbar-hide pt-4">
        {type === "tv" && (
          <button 
            onClick={() => setActiveTab("Episodes")}
            className={`${activeTab === "Episodes" ? 'text-[#ff9d00] border-b-2 border-[#ff9d00] font-bold' : 'text-white/50 hover:text-white font-semibold'} pb-2 transition-colors whitespace-nowrap`}
          >
            Episodes
          </button>
        )}
        <button 
          onClick={() => setActiveTab("Related")}
          className={`${activeTab === "Related" ? 'text-[#ff9d00] border-b-2 border-[#ff9d00] font-bold' : 'text-white/50 hover:text-white font-semibold'} pb-2 transition-colors whitespace-nowrap`}
        >
          Related
        </button>
        <button 
          onClick={() => setActiveTab("Details")}
          className={`${activeTab === "Details" ? 'text-[#ff9d00] border-b-2 border-[#ff9d00] font-bold' : 'text-white/50 hover:text-white font-semibold'} pb-2 transition-colors whitespace-nowrap`}
        >
          Details
        </button>
        <button 
          onClick={() => setActiveTab("Clips")}
          className={`${activeTab === "Clips" ? 'text-[#ff9d00] border-b-2 border-[#ff9d00] font-bold' : 'text-white/50 hover:text-white font-semibold'} pb-2 transition-colors whitespace-nowrap`}
        >
          Clips
        </button>
        <button 
          onClick={() => setActiveTab("Photos")}
          className={`${activeTab === "Photos" ? 'text-[#ff9d00] border-b-2 border-[#ff9d00] font-bold' : 'text-white/50 hover:text-white font-semibold'} pb-2 transition-colors whitespace-nowrap`}
        >
          Photos
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === "Episodes" && type === "tv" && episodes.length > 0 && (
          <div className="flex flex-col gap-8 animate-in fade-in duration-500">
            {currentEpisodeData && (
              <div className="bg-[#141417] rounded-2xl md:p-6 flex flex-col md:flex-row gap-4 md:gap-6 border border-white/5 md:shadow-xl overflow-hidden">
                <div className="relative w-full md:w-[350px] aspect-video shrink-0 md:rounded-xl overflow-hidden bg-black/50">
                  {currentEpisodeData.still_path ? (
                    <Image 
                      src={`https://image.tmdb.org/t/p/w780${currentEpisodeData.still_path}`} 
                      alt={currentEpisodeData.name || "Episode image"} 
                      fill 
                      className="object-cover" 
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/20">No Image</div>
                  )}
                  <div className="absolute top-2 left-2 md:top-3 md:left-3 bg-[#ff9d00] text-black text-[9px] md:text-[10px] font-black uppercase px-2 py-1 rounded shadow-lg flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    Now Playing
                  </div>
                </div>

                <div className="flex flex-col justify-center flex-1 py-2 px-4 md:px-0 pb-4 md:pb-2">
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 text-[#ff9d00] text-[10px] md:text-xs font-bold tracking-widest uppercase mb-1 md:mb-2">
                    <span>Season {season}</span>
                    <span className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-[#ff9d00]/50"></span>
                    <span>Episode {currentEpisodeData.episode_number}</span>
                    <span className="text-white/30 tracking-normal capitalize flex items-center gap-2 ml-1 md:ml-2">
                      <span>•</span> {currentEpisodeData.air_date} <span>•</span> {currentEpisodeData.runtime || '45'} mins
                    </span>
                  </div>
                  <h2 className="text-xl md:text-3xl font-bold mb-2 md:mb-4">{currentEpisodeData.name}</h2>
                  <p className="text-white/60 text-xs md:text-sm leading-relaxed mb-4 md:mb-6 line-clamp-3">
                    {currentEpisodeData.overview || "No description available for this episode."}
                  </p>
                  
                  <div className="flex items-center gap-2 md:gap-3 mt-auto">
                    {currentEpisodeData.episode_number > 1 && (
                      <button
                        onClick={() => onNavigate({ tmdbId, mediaType: "tv", season, episode: currentEpisodeData.episode_number - 1 })}
                        className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-4 md:px-5 py-2 md:py-2.5 rounded-lg text-[10px] md:text-xs font-bold transition-colors flex items-center gap-1.5 md:gap-2 flex-1 md:flex-none justify-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                        Previous
                      </button>
                    )}
                    {currentEpisodeData.episode_number < episodes.length && (
                      <button
                        onClick={() => onNavigate({ tmdbId, mediaType: "tv", season, episode: currentEpisodeData.episode_number + 1 })}
                        className="bg-[#ff9d00] hover:bg-[#ffaa22] text-black px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-wider transition-colors shadow-[0_0_20px_rgba(255,157,0,0.2)] flex items-center gap-1.5 md:gap-2 flex-1 md:flex-none justify-center"
                      >
                        Next Ep
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Season Episodes */}
            {type === "tv" && episodes && episodes.length > 0 && (
              <div className="mt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h3 className="text-lg font-bold">Season Episodes <span className="text-white/40 text-sm font-normal ml-2">({episodes.length} total)</span></h3>
                  
                  {/* Search Input */}
                  <div className="relative w-full sm:w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                    <input 
                      type="text" 
                      placeholder="Search episode..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#141414] border border-white/10 hover:border-white/30 focus:border-red-500 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-white/30 outline-none transition-all"
                    />
                  </div>
                </div>

                {filteredEpisodes.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {filteredEpisodes.slice(0, visibleCount).map((ep: any) => (
                      <button
                        onClick={() => onNavigate({ tmdbId, mediaType: "tv", season, episode: ep.episode_number })}
                        key={ep.id}
                        className={`group flex flex-row items-center gap-3 p-2 rounded-xl transition-all border border-transparent hover:bg-[#141417] hover:border-white/5 text-left w-full ${ep.episode_number === Number(episode) ? 'bg-[#141417] border-white/5' : ''}`}
                      >
                        <div className="relative w-36 md:w-48 lg:w-56 aspect-video shrink-0 rounded-lg overflow-hidden bg-black/50">
                          {ep.still_path ? (
                            <Image 
                              src={`https://image.tmdb.org/t/p/w500${ep.still_path}`} 
                              alt={ep.name || "Episode Image"} 
                              fill 
                              className="object-cover" 
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-white/20">No Image</div>
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/40">
                              <div className="w-0 h-0 border-t-4 border-b-4 border-l-6 border-transparent border-l-white ml-1"></div>
                            </div>
                          </div>

                          <div className="absolute bottom-1.5 left-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow-lg">
                            E{ep.episode_number}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0 flex flex-col justify-center py-1 pr-2">
                          <h4 className={`text-sm md:text-base font-bold truncate mb-1 transition-colors ${
                            ep.episode_number === Number(episode) ? "text-red-500" : "text-white group-hover:text-red-500"
                          }`}>
                            {ep.episode_number}. {ep.name}
                          </h4>
                          <p className="hidden md:block text-xs text-white/50 line-clamp-2 leading-relaxed">
                            {ep.overview || "No description available for this episode."}
                          </p>
                        </div>
                      </button>
                    ))}
                    {visibleCount < filteredEpisodes.length && (
                      <div className="col-span-2 lg:col-span-1">
                        <button 
                          onClick={() => setVisibleCount(prev => prev + 20)}
                          className="mt-2 w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-colors flex items-center justify-center gap-2"
                        >
                          <ChevronDown size={18} /> Load More
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-white/40">
                    No episodes found for this search.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "Related" && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            <h3 className="text-lg font-bold">Related {type === "tv" ? "Shows" : "Movies"}</h3>
            {mappedSimilar.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {mappedSimilar.map((movie: any) => (
                  <MovieCard key={movie.publicId} movie={movie} />
                ))}
              </div>
            ) : (
              <p className="text-white/50 text-sm">No related content found.</p>
            )}
          </div>
        )}

        {activeTab === "Details" && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-4xl">
            <h3 className="text-2xl font-bold">{details?.title || details?.name}</h3>
            <p className="text-white/70 text-lg leading-relaxed">{details?.overview}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-4">
              <div>
                <h4 className="text-white/40 font-bold uppercase text-xs tracking-wider mb-2">Genres</h4>
                <div className="flex flex-wrap gap-2">
                  {details?.genres?.map((g: any) => (
                    <span key={g.id} className="bg-white/5 px-3 py-1 rounded-full text-sm">{g.name}</span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-white/40 font-bold uppercase text-xs tracking-wider mb-2">Status</h4>
                <p className="text-white/90">{details?.status}</p>
              </div>
              {details?.networks && (
                <div>
                  <h4 className="text-white/40 font-bold uppercase text-xs tracking-wider mb-2">Network</h4>
                  <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl">
                    {details.networks.map((n: any) => (
                      n.logo_path ? (
                        <Image key={n.id} src={`https://image.tmdb.org/t/p/w200${n.logo_path}`} alt={n.name} width={60} height={30} className="invert opacity-70" />
                      ) : (
                        <span key={n.id} className="font-bold">{n.name}</span>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Clips" && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            <h3 className="text-lg font-bold">Clips & Trailers</h3>
            {details?.videos?.results?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {details.videos.results.slice(0, 4).map((video: any) => (
                  <div key={video.id} className="w-full aspect-video rounded-xl overflow-hidden bg-black">
                    <iframe 
                      src={`https://www.youtube.com/embed/${video.key}`} 
                      className="w-full h-full" 
                      allowFullScreen 
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/50 text-sm">No clips available.</p>
            )}
          </div>
        )}

        {activeTab === "Photos" && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            <h3 className="text-lg font-bold">Photos</h3>
            {details?.images?.backdrops?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {details.images.backdrops.slice(0, 6).map((img: any, i: number) => (
                  <div key={i} className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/50">
                    <Image src={`https://image.tmdb.org/t/p/w780${img.file_path}`} alt="Backdrop" fill className="object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/50 text-sm">No photos available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

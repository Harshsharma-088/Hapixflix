"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function AnimeSynopsis({ description }: { description: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Remove HTML tags for cleaner display if it contains any, though dangerouslySetInnerHTML is another option.
  const cleanDescription = description.replace(/<[^>]*>?/gm, '');

  return (
    <div className="mt-2 bg-[#141417]/80 p-4 rounded-xl border border-white/5 text-left w-full">
      <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Synopsis</h3>
      <div className="relative">
        <p 
          className={`text-xs md:text-sm text-white/70 leading-relaxed transition-all duration-300 ${
            !isExpanded ? "line-clamp-3 md:line-clamp-4" : ""
          }`}
        >
          {cleanDescription}
        </p>
        
        {/* Faded overlay when collapsed */}
        {!isExpanded && cleanDescription.length > 150 && (
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#141417] to-transparent pointer-events-none"></div>
        )}
      </div>

      {cleanDescription.length > 150 && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 mt-2 text-[10px] md:text-xs font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider"
        >
          {isExpanded ? (
            <>Show Less <ChevronUp size={14} /></>
          ) : (
            <>Show More <ChevronDown size={14} /></>
          )}
        </button>
      )}
    </div>
  );
}

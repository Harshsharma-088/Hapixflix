"use client";
import { ArrowUp } from "lucide-react";
import Link from "next/link";
import React from "react";

import { IconsClubLogo } from "@/components/ui/IconsClubLogo";

function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="mt-20 border-t border-white/10 px-8 py-16 text-white bg-[#09090b] relative">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-start justify-between gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-block">
              <img src="/logo.svg" alt="Hapixflix" className="h-8 w-auto" />
            </Link>
          </div>
          <p className="text-sm text-white/50 max-w-xl">
            This site does not store any files on our server, we only linked to the media which is hosted on 3rd party services.
          </p>
          <div className="flex items-center gap-5 text-sm text-white/70 mt-1">
            <Link href="https://github.com/anixdex" target="_blank" className="flex items-center gap-2 hover:text-white transition-colors group">
              <IconsClubLogo name="github" size={18} radius={4} className="opacity-70 group-hover:opacity-100 transition-opacity" />
              <span>GitHub</span>
            </Link>
            <span>&middot;</span>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span>&middot;</span>
            <Link href="/dmca" className="hover:text-white transition-colors">
              DMCA
            </Link>
          </div>
        </div>

        <button 
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors shrink-0"
        >
          <ArrowUp size={20} className="text-white/70" />
        </button>
      </div>
    </footer>
  );
}

export default Footer;

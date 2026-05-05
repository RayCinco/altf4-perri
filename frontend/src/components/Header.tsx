"use client";

import { Scan } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[#000919]/70 backdrop-blur-[100px] border-b border-white/10">
      <div className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Scan className="w-7 h-7 text-[#0094c6]" />
          
          {/* Name and Functionality */}
          <div>
            <h1 className="text-xl font-semibold bg-linear-to-r text-white bg-clip-text">
              ChismiScan
            </h1>
            <p className="text-xs text-gray-400">
              Gossip Analyzer & Fake News Detector
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

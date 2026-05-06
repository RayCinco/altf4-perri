"use client";

import { Scan } from "lucide-react";
import Link from "next/link";

export function Header() {
  return (
    <header className="relative top-0 z-10 bg-[#000919]/70 backdrop-blur-[100px] border-b border-white/10">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          
          {/* LEFT SIDE */}
          <div className="flex items-center gap-3">
            <Scan className="w-7 h-7 text-[#054E98]" />

            <div>
              <h1 className="text-xl font-semibold text-white">
                ChismiScan
              </h1>
              <p className="text-xs text-[#054E98]">
                Gossip Analyzer & Fake News Detector
              </p>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="px-4 py-1.5 rounded-lg border border-[#001D3F] text-white hover:bg-[#0a1a3a] transition"
            >
              Login
            </Link>

            <Link
              href="/auth/signup"
              className="px-4 py-1.5 rounded-lg bg-[#054E98] text-white hover:bg-[#04356A] transition"
            >
              Sign Up
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
}
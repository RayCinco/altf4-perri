"use client";

import { Scan } from "lucide-react";

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-3">
          <Scan className="w-8 h-8 text-red-600" />
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-linear-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
              ChismiScan
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Gossip Analyzer & Fake News Detector 
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
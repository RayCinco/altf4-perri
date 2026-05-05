"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Link, ImageIcon, FileText, ChevronDown } from "lucide-react";
import { ChismisMeter } from "./ChismisMeter";

/* ----------------- TYPES ----------------- */

type ResultType = {
  level: number;
  classification: "fact" | "opinion" | "chismis";
};

/* ----------------- MAIN ----------------- */

export default function DetectorPanel() {
  const [mode, setMode] = useState<"genz" | "formal">("genz");
  const [activeTab, setActiveTab] = useState<"url" | "image" | "text">("text");
  const [open, setOpen] = useState(false);

  const [result, setResult] = useState<ResultType | null>(null);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ----------------- ANALYZE HANDLER ----------------- */

  const handleAnalyze = () => {
    setLoading(true);
    setResult(null);

    // Simulated AI result
    setTimeout(() => {
      const level = Math.floor(Math.random() * 100);

      let classification: ResultType["classification"] = "fact";
      if (level > 60) classification = "chismis";
      else if (level > 30) classification = "opinion";

      setResult({ level, classification });
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-[#04356A] bg-[#000919] text-white p-4">
      
      {/* ----------------- TOP BAR ----------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        
        {/* Mode Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2 bg-[#001D3F] border border-[#04356A] rounded-lg hover:bg-[#0a1a3a]"
          >
            Mode:
            <span className="text-[#54A9FF] font-medium">
              {mode === "genz" ? "GenZ Mode" : "Formal Mode"}
            </span>
            <ChevronDown size={16} />
          </button>

          {open && (
            <div className="absolute mt-2 w-full bg-[#001D3F] border border-[#04356A] rounded-lg overflow-hidden z-10">
              <button
                onClick={() => {
                  setMode("genz");
                  setOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-[#0a1a3a]"
              >
                GenZ Mode
              </button>
              <button
                onClick={() => {
                  setMode("formal");
                  setOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-[#0a1a3a]"
              >
                Formal Mode
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          <TabButton
            active={activeTab === "url"}
            onClick={() => setActiveTab("url")}
            icon={<Link size={16} />}
            label="URL"
          />
          <TabButton
            active={activeTab === "image"}
            onClick={() => setActiveTab("image")}
            icon={<ImageIcon size={16} />}
            label="Image"
          />
          <TabButton
            active={activeTab === "text"}
            onClick={() => setActiveTab("text")}
            icon={<FileText size={16} />}
            label="Text"
          />
        </div>
      </div>

      {/* ----------------- GRID ----------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-105">
        
        {/* Left Panel */}
        <div className="bg-[#001d3f49] border border-[#04356A] rounded-xl p-4 flex min-h-80">
          {activeTab === "text" && <TextUI onAnalyze={handleAnalyze} loading={loading} />}
          {activeTab === "image" && <ImageUI onAnalyze={handleAnalyze} loading={loading} />}
          {activeTab === "url" && <UrlUI onAnalyze={handleAnalyze} loading={loading} />}
        </div>

        {/* Right Panel */}
        <div className="bg-[#001d3f49] border border-[#04356A] rounded-xl p-4 flex items-center justify-center min-h-80">
          
          {loading && (
            <div className="text-[#7FB3FF] animate-pulse text-sm">
              Analyzing...
            </div>
          )}

          {!loading && !result && (
            <div className="text-[#7FB3FF] text-sm">
              Your analysis will appear here.
            </div>
          )}

          {!loading && result && (
            <ChismisMeter
              level={result.level}
              classification={result.classification}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ----------------- TAB CONTENT ----------------- */

function TextUI({
  onAnalyze,
  loading,
}: {
  onAnalyze: () => void;
  loading: boolean;
}) {
  return (
    <div className="w-full h-full relative">
      
      <div className="absolute inset-0 flex items-center justify-center">
        <button className="px-6 py-3 bg-[#04356A] rounded-lg opacity-60">
          Paste Text
        </button>
      </div>

      <div className="absolute bottom-2 left-4 right-4 flex justify-between items-center">
        <label className="text-[#7FB3FF] cursor-pointer hover:text-white">
          Upload File
          <input type="file" className="hidden" />
        </label>

        <button
          onClick={onAnalyze}
          disabled={loading}
          className="px-6 py-2 bg-[#04356A] rounded-lg hover:bg-[#054E98] disabled:opacity-50"
        >
          {loading ? "..." : "Analyze"}
        </button>
      </div>
    </div>
  );
}

function ImageUI({
  onAnalyze,
  loading,
}: {
  onAnalyze: () => void;
  loading: boolean;
}) {
  return (
    <div className="w-full h-full relative">
      
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="border-2 border-dashed border-[#04356A] rounded-xl p-6 w-full max-w-md flex flex-col items-center text-center">
          <ImageIcon size={32} className="mb-2 text-[#7FB3FF]" />
          <p className="text-sm text-[#7FB3FF]">Upload an image</p>

          <label className="mt-3 px-4 py-2 bg-[#04356A] rounded-lg hover:bg-[#054E98] cursor-pointer">
            Choose File
            <input type="file" accept="image/*" className="hidden" />
          </label>
        </div>
      </div>

      <div className="absolute bottom-4 right-4">
        <button
          onClick={onAnalyze}
          disabled={loading}
          className="px-6 py-2 bg-[#04356A] rounded-lg hover:bg-[#054E98] disabled:opacity-50"
        >
          {loading ? "..." : "Analyze"}
        </button>
      </div>
    </div>
  );
}

function UrlUI({
  onAnalyze,
  loading,
}: {
  onAnalyze: () => void;
  loading: boolean;
}) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
      <input
        type="text"
        placeholder="Paste URL here..."
        className="w-full px-4 py-3 bg-[#001D3F] border border-[#04356A] rounded-lg outline-none"
      />

      <button
        onClick={onAnalyze}
        disabled={loading}
        className="px-6 py-2 bg-[#04356A] rounded-lg hover:bg-[#054E98] disabled:opacity-50"
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>
    </div>
  );
}

/* ----------------- TAB BUTTON ----------------- */

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition ${
        active
          ? "bg-[#04356A] text-white border-[#054E98]"
          : "bg-[#001D3F] border-[#04356A] hover:bg-[#0a1a3a] text-[#7FB3FF]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
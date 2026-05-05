"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Link, ImageIcon, FileText, ChevronDown } from "lucide-react";
import { type AnalysisResult } from "./PopUp";

/* ----------------- MAIN ----------------- */

export default function DetectorPanel({ onAnalysisResult }: { onAnalysisResult: (result: AnalysisResult) => void }) {
  const [mode, setMode] = useState<"genz" | "formal">("genz");
  const [activeTab, setActiveTab] = useState<"url" | "image" | "text">("text");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [textInput, setTextInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [imageName, setImageName] = useState("");
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ----------------- ANALYZE HANDLER ----------------- */

  const handleAnalyze = async () => {
    setLoading(true);
    setAnalysisError(null);

    const payload: { type: typeof activeTab; text?: string; url?: string } = {
      type: activeTab,
    };

    if (activeTab === "text") {
      if (!textInput.trim()) {
        setAnalysisError("Please paste or type the text you want to analyze.");
        setLoading(false);
        return;
      }
      payload.text = textInput.trim();
    }

    if (activeTab === "url") {
      if (!urlInput.trim()) {
        setAnalysisError("Please enter a URL before analyzing.");
        setLoading(false);
        return;
      }
      payload.url = urlInput.trim();
    }

    if (activeTab === "image") {
      setAnalysisError("Image analysis is not supported yet. Please use text or URL input.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Backend analysis failed.");
      }

      const data = (await response.json()) as AnalysisResult;
      onAnalysisResult(data);
    } catch (error) {
      setAnalysisError(
        error instanceof Error
          ? error.message
          : "Unable to analyze the content at this time."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-[#04356A] bg-[#000919] text-white p-4">
      
      {/* ----------------- TOP BAR ----------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        
        {/* Mode Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2 bg-[#001D3F] border border-[#04356A] rounded-lg hover:bg-[#0a1a3a]"
          >
            Mode:
            <span className="text-[#54A9FF] font-medium">
              {mode === "genz" ? "GenZ Mode" : "Formal Mode"}
            </span>
            <ChevronDown size={16} />
          </button>

          {dropdownOpen && (
            <div className="absolute mt-2 w-full bg-[#001D3F] border border-[#04356A] rounded-lg overflow-hidden z-10">
              <button
                onClick={() => {
                  setMode("genz");
                  setDropdownOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-[#0a1a3a]"
              >
                GenZ Mode
              </button>
              <button
                onClick={() => {
                  setMode("formal");
                  setDropdownOpen(false);
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
        <div className="bg-[#001D3F] border border-[#04356A] rounded-xl p-4 flex min-h-80">
          {activeTab === "text" && (
            <TextUI
              onAnalyze={handleAnalyze}
              loading={loading}
              value={textInput}
              onChange={setTextInput}
            />
          )}
          {activeTab === "image" && (
            <ImageUI
              onAnalyze={handleAnalyze}
              loading={loading}
              fileName={imageName}
              onFileSelect={(file) => setImageName(file ? file.name : "")}
            />
          )}
          {activeTab === "url" && (
            <UrlUI
              onAnalyze={handleAnalyze}
              loading={loading}
              url={urlInput}
              onUrlChange={setUrlInput}
            />
          )}
        </div>

        {/* Right Panel */}
        <div className="bg-[#001D3F] border border-[#04356A] rounded-xl p-4 flex items-center justify-center min-h-80">
          {loading && (
            <div className="text-[#7FB3FF] animate-pulse text-sm">Analyzing...</div>
          )}

          {!loading && analysisError && (
            <div className="text-[#FCA5A5] text-sm text-center">{analysisError}</div>
          )}

          {!loading && !analysisError && (
            <div className="text-[#7FB3FF] text-sm text-center">Analysis results will appear in the popup panel.</div>
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
  value,
  onChange,
}: {
  onAnalyze: () => void;
  loading: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="w-full h-full flex flex-col gap-4">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste or type the content you want analyzed..."
        className="w-full h-full min-h-[240px] resize-none rounded-xl border border-[#04356A] bg-[#001D3F] px-4 py-3 text-sm text-white outline-none"
      />

      <div className="flex items-center justify-between gap-4">
        <label className="text-[#7FB3FF] cursor-pointer hover:text-white">
          Upload file
          <input type="file" className="hidden" />
        </label>

        <button
          onClick={onAnalyze}
          disabled={loading}
          className="px-6 py-2 bg-[#04356A] rounded-lg hover:bg-[#054E98] disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>
    </div>
  );
}

function ImageUI({
  onAnalyze,
  loading,
  fileName,
  onFileSelect,
}: {
  onAnalyze: () => void;
  loading: boolean;
  fileName: string;
  onFileSelect: (file: File | null) => void;
}) {
  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div className="flex-1 rounded-xl border border-dashed border-[#04356A] bg-[#061429] p-6 flex flex-col items-center justify-center text-center">
        <ImageIcon size={32} className="mb-3 text-[#7FB3FF]" />
        <p className="text-sm text-[#7FB3FF]">Upload an image to analyze</p>
        <p className="mt-2 text-xs text-[#94a3ff]/80">Image support is not available yet, but this shows where results will appear.</p>
        <label className="mt-4 inline-flex cursor-pointer rounded-lg bg-[#04356A] px-4 py-2 text-sm hover:bg-[#054E98]">
          Choose file
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFileSelect(e.target.files?.[0] ?? null)}
          />
        </label>
        <div className="mt-3 text-xs text-[#7FB3FF]/70">
          {fileName || "No image selected"}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onAnalyze}
          disabled={loading}
          className="px-6 py-2 bg-[#04356A] rounded-lg hover:bg-[#054E98] disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>
    </div>
  );
}

function UrlUI({
  onAnalyze,
  loading,
  url,
  onUrlChange,
}: {
  onAnalyze: () => void;
  loading: boolean;
  url: string;
  onUrlChange: (value: string) => void;
}) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
      <input
        type="url"
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        placeholder="Paste URL here..."
        className="w-full px-4 py-3 bg-[#001D3F] border border-[#04356A] rounded-lg outline-none text-white"
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
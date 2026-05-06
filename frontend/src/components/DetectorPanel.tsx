"use client";

import { useState, useRef, useEffect } from "react";
import { Link, ImageIcon, FileText, ChevronDown } from "lucide-react";
import { ChismisMeter } from "./ChismisMeter";
import { analyzeChismisAPI } from "@/lib/apiClient";
import { useImageDropPaste } from "@/components/hooks/useImageDropPaste";
import ResultsPanel, { type PopupResult } from "./Popup";
// (AnalysisResult type is used via apiClient return type inference)

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

  const [textInput, setTextInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<ResultType | null>(null);
  const [loading, setLoading] = useState(false);
  const [popupResult, setPopupResult] = useState<PopupResult | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ----------------- ANALYZE HANDLER ----------------- */

  const handleAnalyze = async () => {
    setError(null);
    setResult(null);
    setLoading(true);

    // Map genz → marites for the backend personality field
    const personality = mode === "genz" ? "marites" : "formal";

    try {
      // Validate input based on active tab
      if (activeTab === "text" && !textInput.trim()) {
        setError("Please enter some text to analyze.");
        setLoading(false);
        return;
      }
      if (activeTab === "url" && !urlInput.trim()) {
        setError("Please enter a URL to analyze.");
        setLoading(false);
        return;
      }
      if (activeTab === "image" && !imageFile) {
        setError("Please select an image to analyze.");
        setLoading(false);
        return;
      }

      // Call API with appropriate payload
      const data = await analyzeChismisAPI({
        text: activeTab === "text" ? textInput.trim() : undefined,
        url: activeTab === "url" ? urlInput.trim() : undefined,
        file: activeTab === "image" ? imageFile : undefined,
        personality,
      });

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      setResult({
        level: data.chismisLevel,
        classification: data.classification,
      });

      // Pass raw API data directly to the popup
      setPopupResult({
        classification: data.classification,
        chismisLevel: data.chismisLevel,
        message: data.message,
        details: data.details,
        breakdown: data.breakdown,
        harmScore: data.harmScore,
        resibo: data.resibo,
        literacyLesson: data.literacyLesson,
      });
      setIsPanelOpen(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
                file={imageFile}
                onFileChange={setImageFile}
              />
            )}
            {activeTab === "url" && (
              <UrlUI
                onAnalyze={handleAnalyze}
                loading={loading}
                value={urlInput}
                onChange={setUrlInput}
              />
            )}
          </div>

          {/* Right Panel */}
          <div className="bg-[#001d3f49] border border-[#04356A] rounded-xl p-4 flex flex-col items-center justify-center min-h-80 gap-2">
            {loading && (
              <div className="text-[#7FB3FF] animate-pulse text-sm">
                Analyzing...
              </div>
            )}

            {!loading && error && (
              <div className="text-red-400 text-sm text-center px-4">
                {error}
              </div>
            )}

            {!loading && !error && !result && (
              <div className="text-[#7FB3FF] text-sm">
                Your analysis will appear here.
              </div>
            )}

            {!loading && !error && result && (
              <>
                <ChismisMeter
                  level={result.level}
                  classification={result.classification}
                />
                <button
                  onClick={() => setIsPanelOpen(true)}
                  className="mt-3 px-5 py-2 bg-[#04356A] hover:bg-[#054E98] text-white text-sm rounded-lg border border-[#1e3a5f] transition"
                >
                  View Full Results
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Results Panel Popup */}
      <ResultsPanel
        isOpen={isPanelOpen}
        result={popupResult}
        onClose={() => setIsPanelOpen(false)}
        onToggle={() => setIsPanelOpen(!isPanelOpen)}
      />
    </>
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
  onChange: (v: string) => void;
}) {
  return (
    <div className="w-full h-full flex flex-col gap-3">
      <textarea
        className="flex-1 w-full bg-[#001D3F] border border-[#04356A] rounded-lg px-4 py-3 text-sm text-white outline-none resize-none placeholder-[#7FB3FF]/50 min-h-48"
        placeholder="Paste the chismis or news text here..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

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

function ImageUI({
  onAnalyze,
  loading,
  file,
  onFileChange,
}: {
  onAnalyze: () => void;
  loading: boolean;
  file: File | null;
  onFileChange: (f: File | null) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useImageDropPaste({
    onImage: onFileChange,
    dropRef: dropRef as React.RefObject<HTMLElement>,
  });

  return (
    <div className="w-full h-full flex flex-col gap-3">
      <div
        ref={dropRef}
        className="relative flex items-center justify-center border-2 border-dashed border-[#04356A] rounded-xl overflow-hidden bg-[#001d3f33] transition-colors h-[400px] w-full"
        title="Drag & drop or paste an image here"
      >
        {file && previewUrl ? (
          <div className="relative w-full h-full group">
            <Image
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-contain"
            />
            {/* Hover overlay for info and remove action */}
            <div className="absolute inset-0 bg-[#000919]/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
              <div className="text-center p-4">
                <p className="text-sm text-white font-medium mb-1 truncate max-w-[200px]">
                  {file.name}
                </p>
                <p className="text-xs text-[#7FB3FF]/80 mb-4">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileChange(null);
                  }}
                  className="px-4 py-2 bg-red-500/20 border border-red-500/50 hover:bg-red-500/40 text-red-200 text-xs rounded-lg transition"
                >
                  Remove Image
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center pointer-events-none select-none">
            <ImageIcon size={32} className="mb-2 text-[#7FB3FF]" />
            <p className="text-sm text-[#7FB3FF]">
              Drag & drop, paste, or upload an image
            </p>
            <label className="mt-3 px-4 py-2 bg-[#04356A] rounded-lg hover:bg-[#054E98] cursor-pointer text-sm pointer-events-auto">
              Choose File
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
              />
            </label>
            <p className="text-xs text-[#7FB3FF]/60 mt-2">or Ctrl+V to paste</p>
          </div>
        )}
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
  value,
  onChange,
}: {
  onAnalyze: () => void;
  loading: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
      <input
        type="text"
        placeholder="Paste URL here..."
        className="w-full px-4 py-3 bg-[#001D3F] border border-[#04356A] rounded-lg outline-none text-sm text-white placeholder-[#7FB3FF]/50"
        value={value}
        onChange={(e) => onChange(e.target.value)}
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

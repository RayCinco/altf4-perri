"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Upload, ImageIcon, Loader2, AlertCircle, Type } from "lucide-react";

/** Rotating loading messages shown during analysis */
const LOADING_MESSAGES = [
  "Nag-iinvestigate si Marites... 🔍",
  "Chine-check ang mga sources... 📰",
  "Kinukuha ang resibo... 🧾",
  "Ina-analyze kung totoo o chismis... 🤔",
  "Halos tapos na, sis! ☕",
  "Pinag-aaralan pa ng AI... 🧠",
];

export default function Page() {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [inputMode, setInputMode] = useState<"image" | "text">("image");
  const [textInput, setTextInput] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  /** Starts rotating the loading messages */
  const startLoadingMessages = () => {
    let index = 0;
    loadingIntervalRef.current = setInterval(() => {
      index = (index + 1) % LOADING_MESSAGES.length;
      setLoadingMessage(LOADING_MESSAGES[index]);
    }, 2500);
  };

  /** Stops the loading message rotation */
  const stopLoadingMessages = () => {
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = null;
    }
  };

  /** Sends an image file to the /api/analyze endpoint */
  const handleFile = async (file: File) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingMessage(LOADING_MESSAGES[0]);
    startLoadingMessages();

    try {
      // Store the image preview for the result page
      const reader = new FileReader();
      const imageBase64 = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      localStorage.setItem("uploadedImage", imageBase64);

      // Send image to API
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      // Store result and navigate
      localStorage.setItem("analysisResult", JSON.stringify(data));
      router.push("/result");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Try again!";
      setError(message);
    } finally {
      setIsLoading(false);
      stopLoadingMessages();
    }
  };

  /** Sends raw text to the /api/analyze endpoint */
  const handleTextSubmit = async () => {
    if (!textInput.trim()) {
      setError("Please enter some text to analyze.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingMessage(LOADING_MESSAGES[0]);
    startLoadingMessages();

    try {
      // No image for text mode
      localStorage.removeItem("uploadedImage");

      const formData = new FormData();
      formData.append("text", textInput.trim());

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      localStorage.setItem("analysisResult", JSON.stringify(data));
      router.push("/result");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Try again!";
      setError(message);
    } finally {
      setIsLoading(false);
      stopLoadingMessages();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleClick = () => fileInputRef.current?.click();

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  return (
    <div className="max-w-2xl mx-auto min-h-screen flex items-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full relative overflow-hidden">
        {/* ─── Loading Overlay ──────────────────────────────────────── */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-2xl"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="mb-6"
              >
                <Loader2 className="w-16 h-16 text-red-600" />
              </motion.div>

              <motion.p
                key={loadingMessage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-xl font-semibold text-gray-800 text-center px-4"
              >
                {loadingMessage}
              </motion.p>

              <p className="text-sm text-gray-500 mt-3">
                This may take a few seconds...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Title ───────────────────────────────────────────────── */}
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">
          Upload Image or Text to Verify
        </h2>

        <p className="text-center text-gray-600 mb-6">
          Kape tayo habang nag-analyze ako ng news mo! ☕
        </p>

        {/* ─── Input Mode Toggle ───────────────────────────────────── */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => setInputMode("image")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              inputMode === "image"
                ? "bg-red-600 text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Image
          </button>
          <button
            type="button"
            onClick={() => setInputMode("text")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              inputMode === "text"
                ? "bg-red-600 text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Type className="w-4 h-4" />
            Text
          </button>
        </div>

        {/* ─── Error Message ───────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-xs text-red-600 underline mt-1"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Image Upload Mode ───────────────────────────────────── */}
        {inputMode === "image" && (
          <div
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
              transition-all duration-300
              ${
                isDragging
                  ? "border-red-500 bg-red-50 scale-105"
                  : "border-gray-300 bg-gray-50 hover:border-red-400 hover:bg-red-50"
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-4">
              {isDragging ? (
                <ImageIcon className="w-16 h-16 text-red-500 animate-bounce" />
              ) : (
                <Upload className="w-16 h-16 text-gray-400" />
              )}

              <div>
                <p className="text-lg font-semibold text-gray-700 mb-1">
                  Drop your image here or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Screenshots, photos, or memes - lahat pwede! 📸
                </p>
              </div>

              <button
                type="button"
                className="mt-4 px-6 py-3 bg-linear-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-md"
              >
                Select Image
              </button>
            </div>
          </div>
        )}

        {/* ─── Text Input Mode ─────────────────────────────────────── */}
        {inputMode === "text" && (
          <div className="space-y-4">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste the chismis, news article, or forwarded message here..."
              className="w-full h-40 p-4 border-2 border-gray-300 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-red-400 focus:bg-red-50 focus:outline-none transition-all resize-none"
            />
            <button
              type="button"
              onClick={handleTextSubmit}
              disabled={!textInput.trim()}
              className="w-full px-6 py-3 bg-linear-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Analyze Text 🔍
            </button>
          </div>
        )}

        {/* ─── Info Banner ─────────────────────────────────────────── */}
        <div className="mt-6 p-4 bg-linear-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-lg">
          <p className="text-sm text-gray-800 text-center font-medium">
            {inputMode === "image"
              ? "Upload screenshots of news posts, social media claims, or forwarded messages."
              : "Paste text from news articles, social media posts, or forwarded messages."}
          </p>
        </div>
      </div>
    </div>
  );
}
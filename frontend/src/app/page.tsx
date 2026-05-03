"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, ImageIcon } from "lucide-react";

export default function Page() {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFile = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;

        // store image (simulate passing props)
        localStorage.setItem("uploadedImage", result);

        // TODO: replace with real AI result later
        localStorage.setItem(
          "analysisResult",
          JSON.stringify({
            classification: "chismis",
            message: "Hmm... mukhang CHISMIS",
            details: "Walang reliable sources na sumusuporta dito.",
            maritesMode: "Sis parang gawa-gawa lang ‘to ah",
            chismisLevel: 80,
            breakdown: {
              reasons: ["No credible sources", "Emotional language used"],
              redFlags: ["Clickbait phrasing"],
            },
            harmScore: {
              score: 75,
              level: "high",
              explanation: "Could mislead people if shared.",
            },
            resibo: {
              verdict: "No strong evidence found.",
              sources: [],
            },
          })
        );

        router.push("/result");
      };
      reader.readAsDataURL(file);
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
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full">
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">
          Upload Image to Verify
        </h2>

        <p className="text-center text-gray-600 mb-6">
          Kape tayo habang nag-analyze ako ng news mo! 
        </p>

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
                Screenshots, photos, or memes - lahat pwede! 
              </p>
            </div>

            <button
              type="button"
              className="mt-4 px-6 py-3 bg-linear-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold"
            >
              Select Image
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-linear-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-lg">
          <p className="text-sm text-gray-800 text-center font-medium">
            Upload screenshots of news posts, social media claims, or forwarded messages.
          </p>
        </div>
      </div>
    </div>
  );
}
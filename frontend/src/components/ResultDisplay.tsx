"use client";

import { motion } from "motion/react";
import {
  ExternalLink,
  RefreshCw,
  Search,
  CheckCircle,
  MessageCircle,
  AlertTriangle,
} from "lucide-react";
import type { AnalysisResult } from "@/app/types/analysis";
import { ChismisMeter } from "./ChismisMeter";

interface ResultDisplayProps {
  result: AnalysisResult;
  uploadedImage: string | null;
  onReset: () => void;
}

export function ResultDisplay({ result, uploadedImage, onReset }: ResultDisplayProps) {
  const getBadgeColor = () => {
    if (result.classification === "fact") return "bg-green-100 text-green-800 border-green-300";
    if (result.classification === "opinion") return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  const getBadgeIcon = () => {
    if (result.classification === "fact") return <CheckCircle className="w-4 h-4" />;
    if (result.classification === "opinion") return <MessageCircle className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  const getBadgeLabel = () => {
    if (result.classification === "fact") return "FACT CHECK: LEGIT";
    if (result.classification === "opinion") return "OPINION DETECTED";
    return "CHISMIS ALERT";
  };

  const getHarmColor = () => {
    if (result.harmScore.level === "low") return "bg-green-50 border-green-300 text-green-800";
    if (result.harmScore.level === "medium") return "bg-yellow-50 border-yellow-300 text-yellow-800";
    return "bg-red-50 border-red-300 text-red-800";
  };

  const getHarmIcon = () => {
    if (result.harmScore.level === "low") return "✅";
    if (result.harmScore.level === "medium") return "⚠️";
    return "🚨";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-linear-to-r from-red-600 to-red-800 p-6 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Analysis Complete! 🎯</h2>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 ${getBadgeColor()} font-bold text-sm`}>
            {getBadgeIcon()}
            {getBadgeLabel()}
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            {uploadedImage && (
              <img src={uploadedImage} className="rounded-xl border" alt="Uploaded result" />
            )}
            <ChismisMeter level={result.chismisLevel} classification={result.classification} />
          </div>

          <div className="bg-red-50 p-6 rounded-xl border">
            <h3 className="text-xl font-bold text-center">{result.message}</h3>
            <p className="text-center mt-2">{result.details}</p>
          </div>
          <div className="bg-orange-100 p-6 rounded-xl border">
            <p className="italic text-lg">{result.maritesMode}</p>
          </div>

          <div>
            <h4 className="font-bold mb-2 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Why?
            </h4>
            <ul className="list-disc ml-6">
              {result.breakdown.reasons.map((reason: string, index: number) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </div>

          <div className={`p-4 rounded-xl border ${getHarmColor()}`}>
            <p>
              Harm Score: {result.harmScore.score} {getHarmIcon()}
            </p>
            <p className="text-sm">{result.harmScore.explanation}</p>
          </div>

          <div>
            <h4 className="font-bold flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Sources
            </h4>
            {result.resibo.sources.map((source: AnalysisResult["resibo"]["sources"][number], index: number) => (
              <div key={index} className="border p-2 rounded mt-2">
                <a href={source.url} target="_blank" rel="noreferrer" className="font-semibold text-red-700 hover:underline">
                  {source.title}
                </a>
                <div className="text-sm text-gray-600">{source.credibility}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 justify-center">
            <button onClick={onReset} className="bg-red-600 text-white px-4 py-2 rounded inline-flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

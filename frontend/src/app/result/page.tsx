"use client";

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
  Share2,
  AlertTriangle,
  CheckCircle,
  MessageCircle,
  Shield,
  ExternalLink,
  Search,
  PenLine,
  FileWarning,
  BookOpen,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';

import { ChismisMeter } from '@/components/ChismisMeter';
import { BeforeYouShare } from '@/components/BeforeYouShare';
import type { AnalysisResult } from '../types/analysis';

export default function Page() {
  const [showShareModal, setShowShareModal] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const storedImage = localStorage.getItem("uploadedImage");
    const storedResult = localStorage.getItem("analysisResult");

    if (!storedImage || !storedResult) {
      router.push("/");
      return;
    }

    setUploadedImage(storedImage);
    setResult(JSON.parse(storedResult));
  }, [router]);

  if (!result) return null;

  const onReset = () => {
    localStorage.clear();
    router.push("/");
  };

  const getBadgeColor = () => {
    if (result.classification === 'fact') return 'bg-green-100 text-green-800 border-green-300';
    if (result.classification === 'opinion') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getBadgeIcon = () => {
    if (result.classification === 'fact') return <CheckCircle className="w-4 h-4" />;
    if (result.classification === 'opinion') return <MessageCircle className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  const getBadgeLabel = () => {
    if (result.classification === 'fact') return 'FACT CHECK: LEGIT';
    if (result.classification === 'opinion') return 'OPINION DETECTED';
    return 'CHISMIS ALERT';
  };

  const getHarmColor = () => {
    if (result.harmScore.level === 'low') return 'bg-green-50 border-green-300 text-green-800';
    if (result.harmScore.level === 'medium') return 'bg-yellow-50 border-yellow-300 text-yellow-800';
    return 'bg-red-50 border-red-300 text-red-800';
  };

  const getHarmIcon = () => {
    if (result.harmScore.level === 'low') return '✅';
    if (result.harmScore.level === 'medium') return '⚠️';
    return '🚨';
  };

  const getCredibilityColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getCredibilityLabel = (score: number) => {
    if (score >= 70) return 'High Credibility';
    if (score >= 40) return 'Moderate Credibility';
    if (score > 0) return 'Low Credibility';
    return 'No Sources';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-800 p-6 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Analysis Complete! 🎯</h2>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 ${getBadgeColor()} font-bold text-sm`}>
            {getBadgeIcon()}
            {getBadgeLabel()}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Image */}
            {uploadedImage && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">Uploaded Image:</h3>
                <div className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-md">
                  <img
                    src={uploadedImage}
                    alt="Uploaded content"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            )}

            {/* Meter */}
            <div>
              <ChismisMeter
                level={result.chismisLevel}
                classification={result.classification}
              />
            </div>
          </div>

          {/* Main Result Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 space-y-6"
          >
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 border-2 border-red-200">
              <h3 className="text-2xl font-bold text-gray-800 mb-3 text-center">
                {result.message}
              </h3>
              <p className="text-gray-700 text-center text-lg">
                {result.details}
              </p>
            </div>

            {/* Marites Mode - The Hook */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="bg-gradient-to-r from-red-100 to-orange-100 rounded-xl p-6 border-2 border-red-300 shadow-lg"
            >
              <div className="flex items-start gap-3">
                <div className="text-4xl">🫖</div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-red-900 mb-2">
                    Marites Mode Says:
                  </h4>
                  <p className="text-gray-800 text-lg italic">
                    &quot;{result.maritesMode}&quot;
                  </p>
                </div>
              </div>
            </motion.div>

            {/* ═══ FACT CORRECTION — shown only for Fake/Chismis claims ═══ */}
            {result.factCorrection && result.classification === 'chismis' && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border-2 border-emerald-300 shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <PenLine className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-emerald-900 mb-2">
                      ✏️ Ang Totoo — Fact Correction:
                    </h4>
                    <p className="text-gray-800 text-base leading-relaxed">
                      {result.factCorrection}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══ LINGUISTIC RED FLAGS — suspicious writing patterns ═══ */}
            {result.linguisticFlags && result.linguisticFlags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-6 border-2 border-amber-300 shadow"
              >
                <h4 className="font-bold text-lg text-amber-900 mb-4 flex items-center gap-2">
                  <FileWarning className="w-5 h-5 text-amber-600" />
                  🔍 Writing Pattern Analysis:
                </h4>
                <ul className="space-y-2">
                  {result.linguisticFlags.map((flag, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-amber-800">
                      <span className="text-amber-600 mt-0.5 shrink-0">⚠️</span>
                      <span className="text-sm font-medium">{flag}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Chismis Breakdown - WHY it's classified */}
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow">
              <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-red-600" />
                Chismis Breakdown - Here&apos;s WHY:
              </h4>

              <div className="space-y-4">
                <div>
                  <h5 className="font-semibold text-gray-700 mb-2">Analysis Reasons:</h5>
                  <ul className="space-y-2">
                    {result.breakdown.reasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                        <span className="text-red-600 mt-1">✓</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {result.breakdown.redFlags.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-gray-700 mb-2">Red Flags Detected:</h5>
                    <ul className="space-y-2">
                      {result.breakdown.redFlags.map((flag, idx) => (
                        <li key={idx} className="text-red-700 font-medium">
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Harm Score - Ethical Layer */}
            <div className={`rounded-xl p-6 border-2 shadow ${getHarmColor()}`}>
              <div className="flex items-start gap-3 mb-3">
                <Shield className="w-6 h-6 mt-1" />
                <div className="flex-1">
                  <h4 className="font-bold text-lg mb-1">
                    Harm Score: {result.harmScore.score}/100 {getHarmIcon()}
                  </h4>
                  <p className="text-sm font-semibold uppercase tracking-wide">
                    {result.harmScore.level} Risk
                  </p>
                </div>
              </div>
              <p className="text-sm leading-relaxed">
                {result.harmScore.explanation}
              </p>
            </div>

            {/* ═══ RESIBO FINDER — Top 3 Most Credible Sources ═══ */}
            <div className="bg-white rounded-xl p-6 border-2 border-blue-200 shadow">
              <h4 className="font-bold text-lg text-gray-800 mb-3 flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-blue-600" />
                Resibo Finder - Top Sources:
              </h4>

              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="font-semibold text-blue-900">{result.resibo.verdict}</p>
              </div>

              {/* Source Credibility Score Bar */}
              {result.sourceCredibility && result.sourceCredibility.score > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Source Credibility Score
                    </span>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                      result.sourceCredibility.score >= 70
                        ? 'bg-green-100 text-green-800'
                        : result.sourceCredibility.score >= 40
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {result.sourceCredibility.score}/100 — {getCredibilityLabel(result.sourceCredibility.score)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.sourceCredibility.score}%` }}
                      transition={{ delay: 1.0, duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full ${getCredibilityColor(result.sourceCredibility.score)}`}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>🟢 {result.sourceCredibility.trustedCount} trusted</span>
                    <span>🟡 {result.sourceCredibility.semiTrustedCount} semi-trusted</span>
                    <span>🔴 {result.sourceCredibility.untrustedCount} untrusted</span>
                  </div>
                </div>
              )}

              {/* Top 3 Sources Only */}
              {result.resibo.sources.length > 0 && (
                <div>
                  <h5 className="font-semibold text-gray-700 mb-3">
                    Top {result.resibo.sources.length} Most Credible Sources:
                  </h5>
                  <div className="space-y-2">
                    {result.resibo.sources.map((source, idx) => (
                      <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors ${
                        idx === 0 && source.credibility === 'verified'
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-gray-50'
                      }`}>
                        <div className="shrink-0 w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-gray-800 hover:text-blue-700 hover:underline block truncate"
                          >
                            {source.title}
                          </a>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{source.url}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                          source.credibility === 'verified'
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : source.credibility === 'questionable'
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}>
                          {source.credibility === 'verified' && '✓ Trusted'}
                          {source.credibility === 'questionable' && '~ Semi-Trusted'}
                          {source.credibility === 'unknown' && '✗ Untrusted'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ═══ MEDIA LITERACY PANEL — Educational Breakdown ═══ */}
            {result.literacyLesson && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="rounded-xl overflow-hidden border-2 border-indigo-200 shadow-lg"
              >
                {/* Panel Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">
                        📖 Media Literacy Check
                      </h4>
                      <p className="text-indigo-100 text-sm">
                        {result.literacyLesson.summary}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Teaching Points */}
                <div className="bg-gradient-to-b from-indigo-50 to-white p-6 space-y-4">
                  {result.literacyLesson.points.map((point, idx) => (
                    <div key={idx} className="rounded-lg border border-indigo-100 overflow-hidden">
                      {/* Issue (what's wrong) */}
                      <div className="bg-red-50 px-4 py-3 flex items-start gap-2">
                        <span className="text-red-500 mt-0.5 shrink-0 text-sm">✗</span>
                        <p className="text-sm text-red-800">{point.issue}</p>
                      </div>
                      {/* Arrow separator */}
                      <div className="flex items-center justify-center py-1 bg-gray-50">
                        <ArrowRight className="w-4 h-4 text-gray-400 rotate-90" />
                      </div>
                      {/* Correction (what it should look like) */}
                      <div className="bg-green-50 px-4 py-3 flex items-start gap-2">
                        <span className="text-green-500 mt-0.5 shrink-0 text-sm">✓</span>
                        <p className="text-sm text-green-800">{point.correction}</p>
                      </div>
                    </div>
                  ))}

                  {/* Quick Tip */}
                  <div className="mt-4 flex items-start gap-3 bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Quick Tip</p>
                      <p className="text-sm text-amber-800 mt-1">
                        {result.literacyLesson.tip}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <RefreshCw className="w-5 h-5" />
              Scan Another Image
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-red-600 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-all duration-200"
            >
              <Share2 className="w-5 h-5" />
              Before You Share...
            </button>
          </div>
        </div>
      </div>

      {/* Before You Share Modal */}
      <BeforeYouShare
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        result={result}
      />
    </motion.div>
  );
}
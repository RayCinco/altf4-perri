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
  Search
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
                    "{result.maritesMode}"
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Chismis Breakdown - WHY it's classified */}
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow">
              <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-red-600" />
                Chismis Breakdown - Here's WHY:
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

            {/* Resibo Finder - Evidence Layer */}
            <div className="bg-white rounded-xl p-6 border-2 border-blue-200 shadow">
              <h4 className="font-bold text-lg text-gray-800 mb-3 flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-blue-600" />
                Resibo Finder - Evidence Check:
              </h4>

              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="font-semibold text-blue-900">{result.resibo.verdict}</p>
              </div>

              {result.resibo.sources.length > 0 && (
                <div>
                  <h5 className="font-semibold text-gray-700 mb-3">Sources Found:</h5>
                  <div className="space-y-2">
                    {result.resibo.sources.map((source, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{source.title}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {source.credibility === 'verified' && '✓ Verified Source'}
                            {source.credibility === 'questionable' && 'Questionable Source'}
                            {source.credibility === 'unknown' && '? Unknown Source'}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          source.credibility === 'verified' ? 'bg-green-100 text-green-800' :
                          source.credibility === 'questionable' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {source.credibility}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
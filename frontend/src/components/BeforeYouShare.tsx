"use client";

import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, CheckCircle, Share2 } from 'lucide-react';
import type { AnalysisResult } from '@/app/types/analysis';

interface BeforeYouShareProps {
  isOpen: boolean;
  onClose: () => void;
  result: AnalysisResult;
}

export function BeforeYouShare({ isOpen, onClose, result }: BeforeYouShareProps) {
  const shouldWarn = result.classification === 'chismis' || result.harmScore.level !== 'low';

  const handleShare = () => {
    alert('Screenshot this result and share responsibly!');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className={`p-6 ${shouldWarn ? 'bg-red-50 border-b-4 border-red-500' : 'bg-green-50 border-b-4 border-green-500'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {shouldWarn ? (
                      <AlertTriangle className="w-8 h-8 text-red-600 shrink-0" />
                    ) : (
                      <CheckCircle className="w-8 h-8 text-green-600 shrink-0" />
                    )}
                    <div>
                      <h3 className={`text-xl font-bold ${shouldWarn ? 'text-red-900' : 'text-green-900'}`}>
                        {shouldWarn ? 'WAIT! Before You Share...' : 'Ready to Share?'}
                      </h3>
                      <p className={`text-sm mt-1 ${shouldWarn ? 'text-red-700' : 'text-green-700'}`}>
                        {shouldWarn ? 'Think twice about sharing this content' : 'This content appears safe to share'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {shouldWarn ? (
                  <>
                    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                      <h4 className="font-bold text-yellow-900 mb-2">Warning Signs:</h4>
                      <ul className="text-sm text-yellow-800 space-y-2">
                        <li>• <span className="font-semibold">Classification:</span> {result.classification.toUpperCase()}</li>
                        <li>• <span className="font-semibold">Chismis Level:</span> {result.chismisLevel}%</li>
                        <li>• <span className="font-semibold">Harm Score:</span> {result.harmScore.score}/100 ({result.harmScore.level} risk)</li>
                      </ul>
                    </div>

                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                      <h4 className="font-bold text-red-900 mb-2">🛑 Before sharing, ask yourself:</h4>
                      <ul className="text-sm text-red-800 space-y-2">
                        <li>✓ Did I verify this from credible sources?</li>
                        <li>✓ Could this harm someone's reputation?</li>
                        <li>✓ Is this based on facts or just hearsay?</li>
                        <li>✓ Would I want this shared about me?</li>
                      </ul>
                    </div>

                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                      <h4 className="font-bold text-blue-900 mb-2">💡 What you can do instead:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Check official fact-checking websites</li>
                        <li>• Look for original credible sources</li>
                        <li>• Ask the person who sent it for sources</li>
                        <li>• Report if it's clearly harmful misinformation</li>
                      </ul>
                    </div>

                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-900 italic text-center">
                        "Ang bilis mag-share, pero ang hirap i-undo ang damage ng fake news."
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                      <h4 className="font-bold text-green-900 mb-2">✅ Good signs:</h4>
                      <ul className="text-sm text-green-800 space-y-2">
                        <li>• <span className="font-semibold">Classification:</span> {result.classification.toUpperCase()}</li>
                        <li>• <span className="font-semibold">Chismis Level:</span> {result.chismisLevel}% (Low)</li>
                        <li>• <span className="font-semibold">Harm Score:</span> {result.harmScore.score}/100 (Low risk)</li>
                      </ul>
                    </div>

                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                      <h4 className="font-bold text-blue-900 mb-2">Still, be responsible:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Add context when sharing</li>
                        <li>• Credit original sources</li>
                        <li>• Verify sensitive information</li>
                        <li>• Think about your audience</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="p-6 bg-gray-50 border-t border-gray-200 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-all"
                >
                  Go Back
                </button>
                <button
                  onClick={handleShare}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    shouldWarn
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  <Share2 className="w-5 h-5" />
                  {shouldWarn ? 'Share Anyway' : 'Share Now'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

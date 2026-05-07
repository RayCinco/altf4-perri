/**
 * Maps internal pipeline outputs to the frontend AnalysisResult shape.
 */

import type { AnalysisResult } from "@/app/types/analysis";
import type { GeminiResponse } from "../ai/types";
import type { LiteracyLesson } from "../media_literacy";
import type { CategorizedSource, FilteredSources } from "../source_filter";

const MAX_DISPLAY_SOURCES = 3;

export function mapClassification(
  label: GeminiResponse["label"],
): AnalysisResult["classification"] {
  switch (label) {
    case "True":
      return "fact";
    case "Suspicious":
      return "opinion";
    case "Fake":
      return "chismis";
    default:
      return "opinion";
  }
}

export function mapToAnalysisResult(
  gemini: GeminiResponse,
  filteredSources: FilteredSources | null,
  literacyLesson: LiteracyLesson | null,
  personality: "marites" | "formal" = "marites",
  extractedText = "",
  inputType: AnalysisResult["inputType"] = "text",
  originalInput = "",
): AnalysisResult {
  const classification = mapClassification(gemini.label);
  const topSources = getTopSources(filteredSources, extractedText);
  const resiboSources = topSources.map((source) => ({
    title: source.title,
    url: source.link,
    credibility: mapSourceCredibility(source.credibility),
  }));

  return {
    personality,
    classification,
    chismisLevel: gemini.chismis_level,
    message: getResultMessage(classification, personality),
    details: getResultDetails(gemini, personality),
    breakdown: {
      reasons:
        gemini.claims.length > 0
          ? gemini.claims
          : [
              personality === "formal"
                ? "No specific claims extracted."
                : "Walang na-extract na specific claims.",
            ],
      redFlags: gemini.evidence.filter(
        (evidence) =>
          evidence.toLowerCase().includes("no") ||
          evidence.toLowerCase().includes("lack") ||
          evidence.toLowerCase().includes("unverified") ||
          evidence.toLowerCase().includes("misleading"),
      ),
    },
    harmScore: gemini.harm_score,
    maritesMode: gemini.marites_explanation,
    resibo: {
      verdict:
        gemini.evidence.length > 0
          ? gemini.evidence.join(" | ")
          : personality === "formal"
            ? "No evidence found to support the claim."
            : "Walang mahanap na matibay na resibo si Perri... 👀",
      sources: resiboSources,
    },
    linguisticFlags: gemini.linguistic_flags,
    factCorrection: gemini.fact_correction,
    sourceCredibility: filteredSources
      ? {
          score: filteredSources.credibilityScore,
          trustedCount: filteredSources.trustedCount,
          semiTrustedCount: filteredSources.semiTrustedCount,
          untrustedCount: filteredSources.untrustedCount,
        }
      : { score: 0, trustedCount: 0, semiTrustedCount: 0, untrustedCount: 0 },
    literacyLesson,
    inputType,
    originalInput,
  };
}

export function getTopSources(
  filteredSources: FilteredSources | null,
  originalText = "",
): CategorizedSource[] {
  if (!filteredSources || filteredSources.sources.length === 0) {
    return [];
  }

  const credibilityWeight: Record<string, number> = {
    trusted: 3.0,
    "semi-trusted": 1.5,
    untrusted: 0.3,
  };

  const stopWords = new Set([
    "the",
    "and",
    "or",
    "for",
    "with",
    "this",
    "that",
    "from",
    "have",
    "been",
    "will",
    "are",
    "was",
    "were",
    "but",
    "not",
    "its",
    "into",
    "ang",
    "ng",
    "sa",
    "na",
    "mga",
    "ay",
    "at",
    "si",
    "ni",
    "hindi",
  ]);

  const queryWords = originalText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word));

  function relevanceScore(source: CategorizedSource): number {
    if (queryWords.length === 0) return 0.5;
    const combined = `${source.title} ${source.snippet}`.toLowerCase();
    const matches = queryWords.filter((word) => combined.includes(word)).length;
    return matches / queryWords.length;
  }

  return filteredSources.sources
    .map((source) => ({
      source,
      score: relevanceScore(source) * credibilityWeight[source.credibility],
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, MAX_DISPLAY_SOURCES)
    .map((item) => item.source);
}

function mapSourceCredibility(
  tier: "trusted" | "semi-trusted" | "untrusted",
): "verified" | "questionable" | "unknown" {
  switch (tier) {
    case "trusted":
      return "verified";
    case "semi-trusted":
      return "questionable";
    case "untrusted":
      return "unknown";
  }
}

function getResultMessage(
  classification: AnalysisResult["classification"],
  personality: "marites" | "formal" = "marites",
): string {
  const isFormal = personality === "formal";

  switch (classification) {
    case "fact":
      return isFormal ? "Verified Fact ✅" : "Legit naman 'to ✅";
    case "opinion":
      return isFormal
        ? "Unverified / Needs Context 🤔"
        : "Hmm... hindi sure si Marites 🤔";
    case "chismis":
      return isFormal ? "Misinformation Detected 🚨" : "CHISMIS ALERT! 🚨";
    default:
      return isFormal ? "Analysis Complete" : "Na-analyze na ni Marites!";
  }
}

function getResultDetails(
  gemini: GeminiResponse,
  personality: "marites" | "formal" = "marites",
): string {
  if (gemini.marites_explanation?.trim()) {
    return gemini.marites_explanation.trim();
  }

  const isFormal = personality === "formal";

  switch (gemini.label) {
    case "True":
      return isFormal
        ? "This claim is supported by credible evidence and sources."
        : "Mukhang totoo naman ito based sa analysis ni Marites.";
    case "Suspicious":
      return isFormal
        ? "This claim contains questionable elements. Verify before sharing."
        : "May mga questionable parts — double check muna bago i-share.";
    case "Fake":
      return isFormal
        ? "No credible evidence supports this claim. Please avoid sharing misinformation."
        : "Walang credible evidence na nahanap. Ingat sa pagsha-share!";
    default:
      return isFormal
        ? "Please cross-reference with credible news sources."
        : "Check mo na lang rin sa ibang sources para sure.";
  }
}

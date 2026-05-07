/**
 * chismis.ts — Pipeline Orchestrator
 *
 * The main orchestration layer that connects:
 *   1. OCR (extract text from image)
 *   2. Search (SerperDev fact-check)
 *   3. Source Filtering (credibility classification)
 *   4. AI Analysis (classify with Gemini + linguistic analysis + fact correction)
 *   5. Media Literacy (educational breakdown for the user)
 *   6. Type Mapping (GeminiResponse → AnalysisResult)
 *
 * This is the single entry point called by the API route.
 * Each run creates a PipelineLogger that records the full session to /logs.
 */

import { extractText } from "./ocr";
import { analyzeWithGemini, type GeminiResponse } from "./ai";
import { executeFactCheck } from "./ai_search";
import {
  filterSources,
  type FilteredSources,
  type CategorizedSource,
} from "./source_filter";
import { generateLiteracyLesson, type LiteracyLesson } from "./media_literacy";
import { extractFromUrl } from "./url";
import { PipelineLogger } from "./logger";
import type { AnalysisResult } from "@/app/types/analysis";

// ─── Constants ───────────────────────────────────────────────────────────────

/** Maximum number of sources to display in the frontend */
const MAX_DISPLAY_SOURCES = 3;

// ─── Main Pipeline ───────────────────────────────────────────────────────────

/**
 * Runs the full ChismiScan analysis pipeline on an uploaded image.
 *
 * Pipeline: Image → OCR → Search → Filter → AI Analysis → Literacy → Mapped Result
 *
 * @param imageBuffer - Raw image bytes as a Buffer
 * @param mimeType    - MIME type of the image (e.g., "image/png")
 * @returns A fully populated AnalysisResult for the frontend
 */
export async function analyzeChismis(
  imageBuffer: Buffer,
  mimeType: string,
  personality: "marites" | "formal" = "marites",
): Promise<AnalysisResult> {
  const logger = new PipelineLogger("image");

  console.log("----------------------------------------");
  console.log("[PIPELINE] 📸 Starting ChismiScan Image Pipeline");
  console.log(
    `[PIPELINE] 📦 Image type: ${mimeType}, Size: ${imageBuffer.length} bytes`,
  );

  logger.log("PIPELINE", "Image pipeline started", {
    mimeType,
    imageSizeBytes: imageBuffer.length,
  });

  try {
    // Step 1: Extract text from the image via Gemini Vision
    console.log("[PIPELINE] ➡️ Step 1: Running OCR");
    const extractedText = await extractText(imageBuffer, mimeType, logger);

    // Step 2: Query SerperDev Search API for raw results
    console.log("[PIPELINE] ➡️ Step 2: Running Search Fact-Check");
    const searchResult = await executeFactCheck(
      extractedText,
      logger,
      personality,
    );

    // Step 3: Filter and classify sources by credibility
    console.log("[PIPELINE] ➡️ Step 3: Filtering Sources by Credibility");
    let filteredSources: FilteredSources | null = null;
    let searchContext: string | undefined;

    if (searchResult && searchResult.rawSources.length > 0) {
      filteredSources = filterSources(searchResult.rawSources, logger);
      // Only pass credible sources (trusted + semi-trusted) to Gemini
      searchContext = filteredSources.formattedContext;
    }

    // Step 4: Analyze the extracted text with Gemini AI
    console.log("[PIPELINE] ➡️ Step 4: Running AI Analysis");
    const geminiResult = await analyzeWithGemini(
      extractedText,
      searchContext,
      logger,
      personality,
    );

    // Step 5: Generate media literacy lesson
    console.log("[PIPELINE] ➡️ Step 5: Generating Media Literacy Lesson");
    const topSources = getTopSources(filteredSources, extractedText);
    const literacyLesson = await generateLiteracyLesson(
      extractedText,
      mapClassification(geminiResult.label),
      geminiResult.linguistic_flags,
      geminiResult.evidence,
      topSources.map((s) => ({
        title: s.title,
        url: s.link,
        credibility: s.credibility,
      })),
      personality,
      logger,
    );

    // Step 6: Map the AI response to the frontend's AnalysisResult type
    console.log("[PIPELINE] ➡️ Step 6: Mapping output to AnalysisResult");
    const finalResult = mapToAnalysisResult(
      geminiResult,
      filteredSources,
      literacyLesson,
      personality,
      extractedText,
      "image",
      "Image Analysis", // For images, we can just use a placeholder or image filename if available
    );

    logger.log("OUTPUT", "Final result mapped for frontend", {
      classification: finalResult.classification,
      chismisLevel: finalResult.chismisLevel,
      message: finalResult.message,
      details: finalResult.details,
      breakdown: finalResult.breakdown,
      harmScore: finalResult.harmScore,
      maritesMode: finalResult.maritesMode,
      resibo: finalResult.resibo,
      linguisticFlags: finalResult.linguisticFlags,
      factCorrection: finalResult.factCorrection,
      sourceCredibility: finalResult.sourceCredibility,
      literacyLesson: finalResult.literacyLesson,
    });

    console.log("[PIPELINE] 🎉 Pipeline completed successfully!");
    console.log("----------------------------------------");

    // Save the full log to disk
    await logger.save();

    return finalResult;
  } catch (error) {
    logger.log("ERROR", "Pipeline failed with exception", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    await logger.save();
    throw error;
  }
}

/**
 * Runs the analysis pipeline on raw text input (no OCR needed).
 *
 * @param text - The raw text to analyze
 * @returns A fully populated AnalysisResult for the frontend
 */
export async function analyzeChismisText(
  text: string,
  personality: "marites" | "formal" = "marites",
): Promise<AnalysisResult> {
  const logger = new PipelineLogger("text");

  console.log("----------------------------------------");
  console.log("[PIPELINE] 📝 Starting ChismiScan Text Pipeline");

  logger.log("PIPELINE", "Text pipeline started", {
    inputText: text,
    inputTextLength: text.length,
  });

  try {
    // Step 1: Query SerperDev Search API for raw results
    console.log("[PIPELINE] ➡️ Step 1: Running Search Fact-Check");
    const searchResult = await executeFactCheck(text, logger, personality);

    // Step 2: Filter and classify sources by credibility
    console.log("[PIPELINE] ➡️ Step 2: Filtering Sources by Credibility");
    let filteredSources: FilteredSources | null = null;
    let searchContext: string | undefined;

    if (searchResult && searchResult.rawSources.length > 0) {
      filteredSources = filterSources(searchResult.rawSources, logger);
      searchContext = filteredSources.formattedContext;
    }

    // Step 3: Analyze with Gemini AI
    console.log("[PIPELINE] ➡️ Step 3: Running AI Analysis");
    const geminiResult = await analyzeWithGemini(
      text,
      searchContext,
      logger,
      personality,
    );

    // Step 4: Generate media literacy lesson
    console.log("[PIPELINE] ➡️ Step 4: Generating Media Literacy Lesson");
    const topSources = getTopSources(filteredSources, text);
    const literacyLesson = await generateLiteracyLesson(
      text,
      mapClassification(geminiResult.label),
      geminiResult.linguistic_flags,
      geminiResult.evidence,
      topSources.map((s) => ({
        title: s.title,
        url: s.link,
        credibility: s.credibility,
      })),
      personality,
      logger,
    );

    // Step 5: Map output
    console.log("[PIPELINE] ➡️ Step 5: Mapping output to AnalysisResult");
    const finalResult = mapToAnalysisResult(
      geminiResult,
      filteredSources,
      literacyLesson,
      personality,
      text,
      "text",
      text,
    );

    logger.log("OUTPUT", "Final result mapped for frontend", {
      classification: finalResult.classification,
      chismisLevel: finalResult.chismisLevel,
      message: finalResult.message,
      details: finalResult.details,
      breakdown: finalResult.breakdown,
      harmScore: finalResult.harmScore,
      maritesMode: finalResult.maritesMode,
      resibo: finalResult.resibo,
      linguisticFlags: finalResult.linguisticFlags,
      factCorrection: finalResult.factCorrection,
      sourceCredibility: finalResult.sourceCredibility,
      literacyLesson: finalResult.literacyLesson,
    });

    console.log("[PIPELINE] 🎉 Pipeline completed successfully!");
    console.log("----------------------------------------");

    // Save the full log to disk
    await logger.save();

    return finalResult;
  } catch (error) {
    logger.log("ERROR", "Pipeline failed with exception", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    await logger.save();
    throw error;
  }
}

/**
 * Runs the analysis pipeline on a URL input.
 *
 * Pipeline: URL → Fetch HTML → Extract Text → Search → Filter → AI Analysis → Literacy → Mapped Result
 *
 * @param url - The URL to fetch and analyze
 * @returns A fully populated AnalysisResult for the frontend
 */
export async function analyzeChismisUrl(
  url: string,
  personality: "marites" | "formal" = "marites",
): Promise<AnalysisResult> {
  const logger = new PipelineLogger("url");

  console.log("----------------------------------------");
  console.log("[PIPELINE] 🌐 Starting ChismiScan URL Pipeline");
  console.log(`[PIPELINE] 🔗 URL: ${url}`);

  logger.log("PIPELINE", "URL pipeline started", {
    inputUrl: url,
  });

  try {
    // Step 1: Fetch and extract text content from the URL
    console.log("[PIPELINE] ➡️ Step 1: Fetching & Extracting URL Content");
    const urlResult = await extractFromUrl(url, logger);

    // Combine title + content for analysis
    const extractedText = `[Title: ${urlResult.title}]\n[Source: ${urlResult.domain}]\n\n${urlResult.content}`;
    console.log(
      `[PIPELINE] 📄 Extracted ${extractedText.length} chars from URL`,
    );

    // Step 2: Query SerperDev Search API for raw results
    console.log("[PIPELINE] ➡️ Step 2: Running Search Fact-Check");
    const searchResult = await executeFactCheck(
      extractedText,
      logger,
      personality,
    );

    // Step 3: Filter and classify sources by credibility
    console.log("[PIPELINE] ➡️ Step 3: Filtering Sources by Credibility");
    let filteredSources: FilteredSources | null = null;
    let searchContext: string | undefined;

    if (searchResult && searchResult.rawSources.length > 0) {
      filteredSources = filterSources(searchResult.rawSources, logger);
      searchContext = filteredSources.formattedContext;
    }

    // Step 4: Analyze the extracted text with Gemini AI
    console.log("[PIPELINE] ➡️ Step 4: Running AI Analysis");
    const geminiResult = await analyzeWithGemini(
      extractedText,
      searchContext,
      logger,
      personality,
    );

    // Step 5: Generate media literacy lesson
    console.log("[PIPELINE] ➡️ Step 5: Generating Media Literacy Lesson");
    const topSources = getTopSources(filteredSources, extractedText);
    const literacyLesson = await generateLiteracyLesson(
      extractedText,
      mapClassification(geminiResult.label),
      geminiResult.linguistic_flags,
      geminiResult.evidence,
      topSources.map((s) => ({
        title: s.title,
        url: s.link,
        credibility: s.credibility,
      })),
      personality,
      logger,
    );

    // Step 6: Map output
    console.log("[PIPELINE] ➡️ Step 6: Mapping output to AnalysisResult");
    const finalResult = mapToAnalysisResult(
      geminiResult,
      filteredSources,
      literacyLesson,
      personality,
      extractedText,
      "url",
      url,
    );

    logger.log("OUTPUT", "Final result mapped for frontend", {
      classification: finalResult.classification,
      chismisLevel: finalResult.chismisLevel,
      message: finalResult.message,
      details: finalResult.details,
      breakdown: finalResult.breakdown,
      harmScore: finalResult.harmScore,
      maritesMode: finalResult.maritesMode,
      resibo: finalResult.resibo,
      linguisticFlags: finalResult.linguisticFlags,
      factCorrection: finalResult.factCorrection,
      sourceCredibility: finalResult.sourceCredibility,
      literacyLesson: finalResult.literacyLesson,
    });

    console.log("[PIPELINE] 🎉 URL Pipeline completed successfully!");
    console.log("----------------------------------------");

    await logger.save();

    return finalResult;
  } catch (error) {
    logger.log("ERROR", "URL pipeline failed with exception", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    await logger.save();
    throw error;
  }
}

// ─── Source Selection ────────────────────────────────────────────────────────

/**
 * Selects the top N sources ranked by RELEVANCE to the original claim,
 * weighted by source credibility tier.
 *
 * Score = (keyword overlap ratio) × credibility_weight
 *   Trusted     = 3.0×
 *   Semi-trusted = 1.5×
 *   Untrusted   = 0.3×
 *
 * This prevents old/off-topic trusted articles from outranking highly
 * relevant but semi-trusted sources, and ensures the displayed sources
 * are the ones most closely related to the specific claim.
 */
function getTopSources(
  filteredSources: FilteredSources | null,
  originalText: string = "",
): CategorizedSource[] {
  if (!filteredSources || filteredSources.sources.length === 0) {
    return [];
  }

  const CREDIBILITY_WEIGHT: Record<string, number> = {
    trusted: 3.0,
    "semi-trusted": 1.5,
    untrusted: 0.3,
  };

  // Filipino + English stop words
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
    .filter((w) => w.length > 3 && !stopWords.has(w));

  function relevanceScore(source: CategorizedSource): number {
    if (queryWords.length === 0) return 0.5; // no query words → neutral score
    const combined = `${source.title} ${source.snippet}`.toLowerCase();
    const matches = queryWords.filter((w) => combined.includes(w)).length;
    return matches / queryWords.length;
  }

  const scored = filteredSources.sources.map((s) => ({
    source: s,
    score: relevanceScore(s) * CREDIBILITY_WEIGHT[s.credibility],
  }));

  // Highest combined score first
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, MAX_DISPLAY_SOURCES).map((item) => item.source);
}

// ─── Type Mapping ────────────────────────────────────────────────────────────

/**
 * Maps Gemini's response format to the frontend's AnalysisResult type.
 *
 * Key behaviors:
 * - Only the top 3 most credible sources are sent to the frontend
 * - Trusted → verified, Semi-trusted → questionable, Untrusted → unknown
 * - Literacy lesson is attached from the separate generation step
 */
function mapToAnalysisResult(
  gemini: GeminiResponse,
  filteredSources: FilteredSources | null,
  literacyLesson: LiteracyLesson | null,
  personality: "marites" | "formal" = "marites",
  extractedText: string = "",
  inputType: AnalysisResult["inputType"] = "text",
  originalInput: string = "",
): AnalysisResult {
  const classification = mapClassification(gemini.label);

  // Use AI-calculated scores directly from Gemini instead of static formulas
  const chismisLevel = gemini.chismis_level;
  const harmScore = gemini.harm_score;

  // Get top sources ranked by relevance to the original claim
  const topSources = getTopSources(filteredSources, extractedText);
  const resiboSources = topSources.map((s) => ({
    title: s.title,
    url: s.link,
    credibility: mapSourceCredibility(s.credibility),
  }));

  return {
    personality,
    classification,
    chismisLevel,
    message: getResultMessage(classification, personality),
    details: getResultDetails(gemini, personality),
    breakdown: {
      reasons:
        gemini.claims.length > 0
          ? gemini.claims
          : ["No specific claims extracted"],
      redFlags: gemini.evidence.filter(
        (e) =>
          e.toLowerCase().includes("no") ||
          e.toLowerCase().includes("lack") ||
          e.toLowerCase().includes("unverified") ||
          e.toLowerCase().includes("misleading"),
      ),
    },
    harmScore,
    maritesMode: gemini.marites_explanation,
    resibo: {
      verdict:
        gemini.evidence.length > 0
          ? gemini.evidence.join(" | ")
          : personality === "formal"
            ? "No evidence found to support the claim."
            : "Walang mahanap na resibo si Perri... 👀",
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

/**
 * Maps the source filter's credibility tier to the frontend's source credibility label.
 */
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

/**
 * Maps Gemini label → frontend classification
 */
function mapClassification(
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

// ───────────────────────────────────────────────────────────────────────────
// DEPRECATED STATIC CALCULATION FUNCTIONS
// These are no longer used — Gemini now calculates chismis_level and harm_score
// dynamically based on context. Kept here for reference only.
// ───────────────────────────────────────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * @deprecated - Gemini now calculates chismis_level dynamically.
 * Maps Gemini confidence + SOURCE QUALITY to chismisLevel.
 */
function mapChismisLevel(
  label: GeminiResponse["label"],
  confidence: number,
  filteredSources: FilteredSources | null,
): number {
  let base: number;
  switch (label) {
    case "True":
      base = Math.max(5, 100 - confidence);
      break;
    case "Suspicious":
      base = Math.min(65, Math.max(35, confidence));
      break;
    case "Fake":
      base = Math.min(95, Math.max(60, confidence));
      break;
    default:
      return 50;
  }

  if (filteredSources && filteredSources.sources.length > 0) {
    const total = filteredSources.sources.length;
    const trusted = filteredSources.trustedCount;
    const semiTrusted = filteredSources.semiTrustedCount;
    const untrusted = filteredSources.untrustedCount;

    if (trusted === 0 && semiTrusted === 0) {
      // All sources are social media / untrusted — zero credible corroboration
      base = Math.min(90, base + 30);
    } else if (untrusted / total > 0.7) {
      // Predominantly untrusted sources
      base = Math.min(80, base + 20);
    } else if (trusted === 0) {
      // Only semi-trusted sources, no fully trusted
      base = Math.min(70, base + 10);
    }
  } else {
    // No search results at all — unsupported claim shouldn't stay as "True"
    if (label === "True") {
      base = Math.min(65, base + 20);
    }
  }

  return base;
}

/**
 * @deprecated - Gemini now calculates harm_score dynamically.
 * Calculates a harm score based on classification and confidence.
 */
function calculateHarmScore(
  label: GeminiResponse["label"],
  confidence: number,
): AnalysisResult["harmScore"] {
  if (label === "True") {
    return {
      level: "low",
      score: Math.max(5, 30 - Math.floor(confidence / 5)),
      explanation:
        "This content appears to be factual. Safe to share with context.",
    };
  }

  if (label === "Suspicious") {
    return {
      level: "medium",
      score: Math.min(60, Math.max(30, confidence)),
      explanation:
        "This content has unclear or unverified claims. Verify before sharing.",
    };
  }

  // Fake
  return {
    level: "high",
    score: Math.min(95, Math.max(60, confidence)),
    explanation:
      "High risk of misinformation. Sharing this could mislead others.",
  };
}

/**
 * Gets a headline message based on classification.
 */
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

/**
 * Gets detail text from the Gemini response.
 */
function getResultDetails(
  gemini: GeminiResponse,
  personality: "marites" | "formal" = "marites",
): string {
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

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
import { filterSources, type FilteredSources, type CategorizedSource } from "./source_filter";
import { generateLiteracyLesson, type LiteracyLesson } from "./media_literacy";
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
  mimeType: string
): Promise<AnalysisResult> {
  const logger = new PipelineLogger("image");

  console.log("----------------------------------------");
  console.log("[PIPELINE] 📸 Starting ChismiScan Image Pipeline");
  console.log(`[PIPELINE] 📦 Image type: ${mimeType}, Size: ${imageBuffer.length} bytes`);

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
    const searchResult = await executeFactCheck(extractedText, logger);

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
    const geminiResult = await analyzeWithGemini(extractedText, searchContext, logger);

    // Step 5: Generate media literacy lesson
    console.log("[PIPELINE] ➡️ Step 5: Generating Media Literacy Lesson");
    const topSources = getTopSources(filteredSources);
    const literacyLesson = await generateLiteracyLesson(
      extractedText,
      mapClassification(geminiResult.label),
      geminiResult.linguistic_flags,
      geminiResult.evidence,
      topSources.map((s) => ({ title: s.title, url: s.link, credibility: s.credibility })),
      logger
    );

    // Step 6: Map the AI response to the frontend's AnalysisResult type
    console.log("[PIPELINE] ➡️ Step 6: Mapping output to AnalysisResult");
    const finalResult = mapToAnalysisResult(geminiResult, filteredSources, literacyLesson);

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
  text: string
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
    const searchResult = await executeFactCheck(text, logger);

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
    const geminiResult = await analyzeWithGemini(text, searchContext, logger);

    // Step 4: Generate media literacy lesson
    console.log("[PIPELINE] ➡️ Step 4: Generating Media Literacy Lesson");
    const topSources = getTopSources(filteredSources);
    const literacyLesson = await generateLiteracyLesson(
      text,
      mapClassification(geminiResult.label),
      geminiResult.linguistic_flags,
      geminiResult.evidence,
      topSources.map((s) => ({ title: s.title, url: s.link, credibility: s.credibility })),
      logger
    );

    // Step 5: Map output
    console.log("[PIPELINE] ➡️ Step 5: Mapping output to AnalysisResult");
    const finalResult = mapToAnalysisResult(geminiResult, filteredSources, literacyLesson);

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

// ─── Source Selection ────────────────────────────────────────────────────────

/**
 * Selects the top N most credible sources from filtered results.
 * Priority: trusted first, then semi-trusted, then untrusted.
 * Returns at most MAX_DISPLAY_SOURCES (3) sources.
 */
function getTopSources(
  filteredSources: FilteredSources | null
): CategorizedSource[] {
  if (!filteredSources || filteredSources.sources.length === 0) {
    return [];
  }

  const priorityOrder = { trusted: 0, "semi-trusted": 1, untrusted: 2 };

  // Sort by credibility tier (trusted first), then keep original order within tiers
  const sorted = [...filteredSources.sources].sort(
    (a, b) => priorityOrder[a.credibility] - priorityOrder[b.credibility]
  );

  return sorted.slice(0, MAX_DISPLAY_SOURCES);
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
  literacyLesson: LiteracyLesson | null
): AnalysisResult {
  const classification = mapClassification(gemini.label);
  const chismisLevel = mapChismisLevel(gemini.label, gemini.confidence);
  const harmScore = calculateHarmScore(gemini.label, gemini.confidence);

  // Get only the top 3 most credible sources for display
  const topSources = getTopSources(filteredSources);
  const resiboSources = topSources.map((s) => ({
    title: s.title,
    url: s.link,
    credibility: mapSourceCredibility(s.credibility),
  }));

  return {
    classification,
    chismisLevel,
    message: getResultMessage(classification),
    details: getResultDetails(gemini),
    breakdown: {
      reasons: gemini.claims.length > 0
        ? gemini.claims
        : ["No specific claims extracted"],
      redFlags: gemini.evidence.filter((e) =>
        e.toLowerCase().includes("no") ||
        e.toLowerCase().includes("lack") ||
        e.toLowerCase().includes("unverified") ||
        e.toLowerCase().includes("misleading")
      ),
    },
    harmScore,
    maritesMode: gemini.marites_explanation,
    resibo: {
      verdict: gemini.evidence.length > 0
        ? gemini.evidence.join(" | ")
        : "Walang mahanap na resibo si Marites... 👀",
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
  };
}

/**
 * Maps the source filter's credibility tier to the frontend's source credibility label.
 */
function mapSourceCredibility(
  tier: "trusted" | "semi-trusted" | "untrusted"
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
  label: GeminiResponse["label"]
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

/**
 * Maps confidence to chismisLevel.
 * - For "True": low chismis (inverted confidence)
 * - For "Suspicious": moderate chismis
 * - For "Fake": high chismis (direct confidence)
 */
function mapChismisLevel(
  label: GeminiResponse["label"],
  confidence: number
): number {
  switch (label) {
    case "True":
      return Math.max(5, 100 - confidence); // Low chismis
    case "Suspicious":
      return Math.min(65, Math.max(35, confidence)); // Mid range
    case "Fake":
      return Math.min(95, Math.max(60, confidence)); // High chismis
    default:
      return 50;
  }
}

/**
 * Calculates a harm score based on classification and confidence.
 */
function calculateHarmScore(
  label: GeminiResponse["label"],
  confidence: number
): AnalysisResult["harmScore"] {
  if (label === "True") {
    return {
      level: "low",
      score: Math.max(5, 30 - Math.floor(confidence / 5)),
      explanation: "This content appears to be factual. Safe to share with context.",
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
  classification: AnalysisResult["classification"]
): string {
  switch (classification) {
    case "fact":
      return "Legit naman 'to ✅";
    case "opinion":
      return "Hmm... hindi sure si Marites 🤔";
    case "chismis":
      return "CHISMIS ALERT! 🚨";
    default:
      return "Na-analyze na ni Marites!";
  }
}

/**
 * Gets detail text from the Gemini response.
 */
function getResultDetails(gemini: GeminiResponse): string {
  switch (gemini.label) {
    case "True":
      return "Mukhang totoo naman ito based sa analysis ni Marites.";
    case "Suspicious":
      return "May mga questionable parts — double check muna bago i-share.";
    case "Fake":
      return "Walang credible evidence na nahanap. Ingat sa pagsha-share!";
    default:
      return "Check mo na lang rin sa ibang sources para sure.";
  }
}

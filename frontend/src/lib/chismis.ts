/**
 * chismis.ts — Pipeline Orchestrator
 *
 * The main orchestration layer that connects:
 *   1. OCR (extract text from image)
 *   2. AI Analysis (classify with Gemini)
 *   3. Type Mapping (GeminiResponse → AnalysisResult)
 *
 * This is the single entry point called by the API route.
 */

import { extractText } from "./ocr";
import { analyzeWithGemini, type GeminiResponse } from "./ai";
import { executeFactCheck } from "./ai_search";
import type { AnalysisResult } from "@/app/types/analysis";

// ─── Main Pipeline ───────────────────────────────────────────────────────────

/**
 * Runs the full ChismiScan analysis pipeline on an uploaded image.
 *
 * Pipeline: Image → OCR → AI Analysis → Mapped Result
 *
 * @param imageBuffer - Raw image bytes as a Buffer
 * @param mimeType    - MIME type of the image (e.g., "image/png")
 * @returns A fully populated AnalysisResult for the frontend
 */
export async function analyzeChismis(
  imageBuffer: Buffer,
  mimeType: string
): Promise<AnalysisResult> {
  console.log("----------------------------------------");
  console.log("[PIPELINE] 📸 Starting ChismiScan Image Pipeline");
  console.log(`[PIPELINE] 📦 Image type: ${mimeType}, Size: ${imageBuffer.length} bytes`);
  
  // Step 1: Extract text from the image via Gemini Vision
  console.log("[PIPELINE] ➡️ Step 1: Running OCR");
  const extractedText = await extractText(imageBuffer, mimeType);

  // Step 2: Query Google Search API for context
  console.log("[PIPELINE] ➡️ Step 2: Running Search Fact-Check");
  const searchContext = await executeFactCheck(extractedText);

  // Step 3: Analyze the extracted text with Gemini AI
  console.log("[PIPELINE] ➡️ Step 3: Running AI Analysis");
  const geminiResult = await analyzeWithGemini(extractedText, searchContext || undefined);

  // Step 4: Map the AI response to the frontend's AnalysisResult type
  console.log("[PIPELINE] ➡️ Step 4: Mapping output to AnalysisResult");
  const finalResult = mapToAnalysisResult(geminiResult);
  console.log("[PIPELINE] 🎉 Pipeline completed successfully!");
  console.log("----------------------------------------");
  return finalResult;
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
  console.log("----------------------------------------");
  console.log("[PIPELINE] 📝 Starting ChismiScan Text Pipeline");
  
  console.log("[PIPELINE] ➡️ Step 1: Running Search Fact-Check");
  const searchContext = await executeFactCheck(text);
  
  console.log("[PIPELINE] ➡️ Step 2: Running AI Analysis");
  const geminiResult = await analyzeWithGemini(text, searchContext || undefined);
  
  console.log("[PIPELINE] ➡️ Step 3: Mapping output to AnalysisResult");
  const finalResult = mapToAnalysisResult(geminiResult);
  console.log("[PIPELINE] 🎉 Pipeline completed successfully!");
  console.log("----------------------------------------");
  return finalResult;
}

// ─── Type Mapping ────────────────────────────────────────────────────────────

/**
 * Maps Gemini's response format to the frontend's AnalysisResult type.
 *
 * Mapping:
 *   Gemini "True"       → classification "fact"
 *   Gemini "Suspicious" → classification "opinion"
 *   Gemini "Fake"       → classification "chismis"
 *
 *   confidence → chismisLevel (inverted for "True", direct for "Fake")
 *   marites_explanation → maritesMode
 *   claims → breakdown.reasons
 *   evidence → breakdown.redFlags + resibo.verdict
 */
function mapToAnalysisResult(gemini: GeminiResponse): AnalysisResult {
  const classification = mapClassification(gemini.label);
  const chismisLevel = mapChismisLevel(gemini.label, gemini.confidence);
  const harmScore = calculateHarmScore(gemini.label, gemini.confidence);

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
      sources: [], // No search API yet — will be populated when Google Search is integrated
    },
  };
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

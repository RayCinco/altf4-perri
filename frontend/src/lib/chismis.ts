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

import {
  runImageAnalysis,
  runTextAnalysis,
  runUrlAnalysis,
} from "./pipeline/runner";

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
) {
  return runImageAnalysis(imageBuffer, mimeType, personality);
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
) {
  return runTextAnalysis(text, personality);
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
) {
  return runUrlAnalysis(url, personality);
}
